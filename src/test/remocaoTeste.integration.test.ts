import { createClient } from '@supabase/supabase-js';
import { describe, expect, it } from 'vitest';

// Migração 0045: remover_registro_de_teste exige proprietário do sistema (ADMIN_SISTEMA),
// justificativa obrigatória e grava a remoção na trilha com hash. Roda só na empresa de teste
// e cria a própria linha descartável, então pode ser repetido quantas vezes for preciso.
const sessionText = process.env['LOVABLE_BROWSER_SUPABASE_SESSION_JSON'];
const url = import.meta.env['VITE_SUPABASE_URL'];
const key = import.meta.env['VITE_SUPABASE_PUBLISHABLE_KEY'];
const CNPJ_TESTE = '98765432000198';

describe.skipIf(!sessionText || !url || !key)('remover_registro_de_teste autenticado no banco', () => {
  it('exige justificativa, marca origem TESTE, tira do dossiê e audita com hash', async () => {
    if (!sessionText) throw new Error('Sessão ausente');
    const session = JSON.parse(sessionText) as { access_token: string };
    const db = createClient(url!, key!, { auth: { persistSession: false }, global: { headers: { Authorization: `Bearer ${session.access_token}` } } });

    // Linha descartável criada na empresa de teste (nunca na empresa real)
    const ins = await db.from('registro_operacoes').insert({
      empresa_cnpj: CNPJ_TESTE, setor: 'TI', genero_verbo: 'Processar',
      categoria_titulares: ['Clientes'], dados_pessoais: ['Nome'], dados_sensiveis: ['N/A'],
      finalidade_especifica: 'Linha descartável do teste automatizado de remoção de registros de teste',
      hipotese_tratamento: 'Art. 7º, V – Execução de contrato ou procedimentos preliminares',
      tempo_retencao: '1 ano', base_prazo: 'Contrato', compartilhamento: 'Não Compartilhado',
      salvaguardas: ['Criptografia'], infraestrutura: 'Nuvem Corporativa',
      ciclo_vida: { Coletar: ['receber'], Processar: ['utilizar'] }, papel_agente: 'CONTROLADOR', produtos_tratamento: [],
    }).select('id, codigo').single();
    expect(ins.error).toBeNull();
    const rotId = ins.data!.id as string;
    const codigo = ins.data!.codigo as string;

    // Justificativa obrigatória
    const semJust = await db.rpc('remover_registro_de_teste', { _rot_id: rotId, _justificativa: 'curta' });
    expect(semJust.error?.message).toContain('justificativa');

    // Linha inexistente
    const inexistente = await db.rpc('remover_registro_de_teste', { _rot_id: '00000000-0000-0000-0000-000000000000', _justificativa: 'justificativa longa o bastante' });
    expect(inexistente.error?.message).toContain('não encontrada');

    // Remoção auditada
    const r = await db.rpc('remover_registro_de_teste', { _rot_id: rotId, _justificativa: 'Linha descartável criada pelo teste automatizado de remoção de registros de teste.' });
    expect(r.error).toBeNull();
    const dados = r.data as { codigo: string; hash: string; removida_por: string };
    expect(dados.codigo).toBe(codigo);
    expect(dados.hash).toMatch(/^[0-9a-f]{64}$/);

    const linha = await db.from('registro_operacoes').select('origem, removida_do_dossie').eq('id', rotId).single();
    expect(linha.data?.origem).toBe('TESTE');
    expect(linha.data?.removida_do_dossie).toBe(true);

    const trilha = await db.from('trilha_auditoria_sistema').select('op, detail, hash').eq('cnpj', CNPJ_TESTE).eq('target', 'registro_operacoes').like('detail', `Remoção de registro de teste%${codigo}%`).order('seq', { ascending: false }).limit(1).single();
    expect(trilha.error).toBeNull();
    expect(trilha.data?.detail).toContain('justificativa');
    expect(trilha.data?.hash).toBe(dados.hash);

    // Segunda remoção é recusada
    const deNovo = await db.rpc('remover_registro_de_teste', { _rot_id: rotId, _justificativa: 'tentativa repetida de remoção' });
    expect(deNovo.error?.message).toContain('já está fora do dossiê');

    // Ninguém altera origem/removida_do_dossie por fora da operação auditada
    const direto = await db.from('registro_operacoes').update({ removida_do_dossie: false }).eq('id', rotId);
    expect(direto.error).not.toBeNull();
  });
});
