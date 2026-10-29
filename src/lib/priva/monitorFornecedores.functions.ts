import { createServerFn } from '@tanstack/react-start';
import { setResponseHeader } from '@tanstack/react-start/server';
import { z } from 'zod';
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware';
import { carregarVazamentosFornecedores } from './monitorFornecedores.server';
import { correspondenciaForte, extrairFornecedores } from './monitorFornecedores';
export const verificarFornecedoresEmVazamentos = createServerFn({ method: 'POST' }).middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ cnpj: z.string().regex(/^\d{14}$/) }).parse(input))
  .handler(async ({ data, context }) => {
    setResponseHeader('Cache-Control', 'private, no-store');
    const { data: pode, error: acesso } = await context.supabase.rpc('iniciar_verificacao_fornecedores', { _cnpj: data.cnpj });
    if (acesso) throw new Error('Verificação não autorizada.');
    if (!pode) return { ok: false, cooldown: true };
    // Privileged persistence only after the authenticated, tenant-scoped role check above.
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
    try {
      const [rot, ativos, vazamentos] = await Promise.all([
        context.supabase.from('registro_operacoes').select('id,infraestrutura,salvaguardas').eq('empresa_cnpj', data.cnpj),
        context.supabase.from('ativos_seguranca').select('id,descricao,estrutura_pasta,provedor_nuvem,responsavel,localizacao').eq('empresa_cnpj', data.cnpj),
        carregarVazamentosFornecedores(),
      ]);
      if (rot.error || ativos.error) throw new Error('Falha ao ler fornecedores');
      const fontes = extrairFornecedores(rot.data ?? [], ativos.data ?? []);
      const agora = new Date().toISOString();
      for (const f of fontes) for (const b of vazamentos.itens) if (correspondenciaForte(f.nome, b)) {
        const referencia_chave = `${f.processo_rot_id ?? f.ativo_id}:${f.campo}:${b.Name}:${b.BreachDate}`;
        const row = { empresa_cnpj: data.cnpj, fornecedor_nome: f.nome, fonte: 'Have I Been Pwned', data_vazamento: b.BreachDate, contas_afetadas: b.PwnCount, tipos_dados: b.DataClasses, url_referencia: `https://haveibeenpwned.com/PwnedWebsites#${encodeURIComponent(b.Name)}`, processo_rot_id: f.processo_rot_id, ativo_id: f.ativo_id, campo_origem: f.campo, referencia_chave, verificado_em: vazamentos.consultadoEm };
        const { error } = await supabaseAdmin.from('monitor_fornecedores').upsert(row, { onConflict: 'empresa_cnpj,referencia_chave', ignoreDuplicates: true });
        if (error) throw error;
        const { error: atualizacao } = await supabaseAdmin.from('monitor_fornecedores').update({ verificado_em: vazamentos.consultadoEm }).eq('empresa_cnpj', data.cnpj).eq('referencia_chave', referencia_chave);
        if (atualizacao) throw atualizacao;
      }
      const { error } = await supabaseAdmin.from('monitor_verificacoes').update({ sucesso_em: agora, erro: false }).eq('empresa_cnpj', data.cnpj);
      if (error) throw error;
      return { ok: true, cooldown: false };
    } catch {
      await supabaseAdmin.from('monitor_verificacoes').update({ erro: true }).eq('empresa_cnpj', data.cnpj);
      return { ok: false, cooldown: false };
    }
  });