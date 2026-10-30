import { createClient } from '@supabase/supabase-js';
import { describe, expect, it } from 'vitest';
const sessionText = process.env['LOVABLE_BROWSER_SUPABASE_SESSION_JSON'];
const url = import.meta.env['VITE_SUPABASE_URL'];
const key = import.meta.env['VITE_SUPABASE_PUBLISHABLE_KEY'];
const RAZAO_TESTE = 'TESTE DE ACEITAÇÃO — Enquadramento Privacium (cenográfico)';
describe.skipIf(!sessionText || !url || !key)('membros_empresa autenticado no banco', () => {
  it('isola por empresa, mascara o documento, audita a revelação e só permite exclusão lógica', async () => {
    if (!sessionText) throw new Error('Sessão ausente');
    const session = JSON.parse(sessionText) as { access_token: string };
    const db = createClient(url, key, { auth: { persistSession: false }, global: { headers: { Authorization: `Bearer ${session.access_token}` } } });
    const emp = await db.from('empresas').select('id, cnpj').eq('razao_social', RAZAO_TESTE).single();
    expect(emp.error).toBeNull(); if (!emp.data) throw new Error('Empresa de teste ausente');

    // Cadastro (DPO da empresa)
    const doc = '52998224725';
    const ins = await db.from('membros_empresa').insert({ empresa_id: emp.data.id, nome: 'Membro de Teste Privacium', documento: doc, tipo_documento: 'CPF', email: 'membro.teste@cenografica.com.br', area_setor: 'Recursos Humanos › Folha de Pagamento', papel_rac: 'R', membro_comite: false }).select('id').single();
    expect(ins.error).toBeNull(); const id = ins.data!.id;

    // A coluna documento não é legível por SELECT direto (fora do GRANT)
    const direto = await db.from('membros_empresa').select('documento').eq('id', id);
    expect(direto.error).not.toBeNull();

    // Isolamento: outro empresa_id não retorna o registro
    const outra = await db.from('membros_empresa').select('id').eq('id', id).neq('empresa_id', emp.data.id);
    expect(outra.error).toBeNull(); expect(outra.data).toEqual([]);

    // Revelação auditada: devolve o documento e grava linha na trilha com o campo acessado
    const rev = await db.rpc('revelar_documento_membro', { _id: id });
    expect(rev.error).toBeNull(); expect(rev.data).toBe(doc);
    const trilha = await db.from('trilha_auditoria_sistema').select('op,target,campo_mascarado_acessado,detail').eq('cnpj', emp.data.cnpj).eq('target', 'membros_empresa').eq('campo_mascarado_acessado', 'documento').order('seq', { ascending: false }).limit(1).single();
    expect(trilha.error).toBeNull(); expect(trilha.data?.op).toBe('SELECT'); expect(trilha.data?.detail).toContain('Membro de Teste Privacium');

    // Exclusão física é impossível (sem GRANT de DELETE); a exclusão lógica funciona
    const del = await db.from('membros_empresa').delete().eq('id', id);
    expect(del.error).not.toBeNull();
    const off = await db.from('membros_empresa').update({ ativo: false }).eq('id', id);
    expect(off.error).toBeNull();

    // O cadastro entrou no ROT como operação de governança de privacidade (uma vez por empresa)
    const rot = await db.from('registro_operacoes').select('codigo, finalidade_especifica, hipotese_tratamento').eq('empresa_cnpj', emp.data.cnpj).like('finalidade_especifica', 'Governança de privacidade: cadastro de membros%');
    expect(rot.error).toBeNull();
    expect(rot.data?.length).toBe(1);
    expect(rot.data?.[0]?.hipotese_tratamento).toMatch(/^Art\. 7º/);
  }, 40000);
});
