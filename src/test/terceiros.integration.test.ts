import { createClient } from '@supabase/supabase-js';
import { describe, expect, it } from 'vitest';
const sessionText = process.env['LOVABLE_BROWSER_SUPABASE_SESSION_JSON'];
const url = import.meta.env['VITE_SUPABASE_URL'];
const key = import.meta.env['VITE_SUPABASE_PUBLISHABLE_KEY'];
const RAZAO_TESTE = 'TESTE DE ACEITAÇÃO — Enquadramento Privacium (cenográfico)';
const OK = { instrucoes: true, proposito: true, metodos: true, duracao: true, deveres: true, vigencia: true, controle: true, responsabilidade: true, seguranca: true, direitos_titular: true };

describe.skipIf(!sessionText || !url || !key)('terceiros_empresa autenticado no banco', () => {
  it('mascara o CNPJ, audita a revelação, isola por empresa e aplica as travas', async () => {
    if (!sessionText) throw new Error('Sessão ausente');
    const session = JSON.parse(sessionText) as { access_token: string };
    const db = createClient(url, key, { auth: { persistSession: false }, global: { headers: { Authorization: `Bearer ${session.access_token}` } } });
    const emp = await db.from('empresas').select('id, cnpj').eq('razao_social', RAZAO_TESTE).single();
    expect(emp.error).toBeNull(); if (!emp.data) throw new Error('Empresa de teste ausente');
    const cnpjTerc = '11222333000181';

    const op = await db.from('terceiros_empresa').insert({ empresa_id: emp.data.id, razao_social: 'Operador de Teste Privacium', cnpj: cnpjTerc, papel_cadeia: 'OPERADOR', contrato_vigente: true, data_contrato: '2026-01-10', checklist_art39: OK }).select('id, clausulas_art39').single();
    expect(op.error).toBeNull(); expect(op.data?.clausulas_art39).toBe(true);
    // Checklist incompleto: o banco grava clausulas_art39 = false (alerta bloqueante na Etapa 2)
    const inc = await db.from('terceiros_empresa').insert({ empresa_id: emp.data.id, razao_social: 'Terceiro sem cláusulas', cnpj: cnpjTerc, papel_cadeia: 'OPERADOR', checklist_art39: { instrucoes: true } }).select('id, clausulas_art39').single();
    expect(inc.error).toBeNull(); expect(inc.data?.clausulas_art39).toBe(false);

    // Suboperador sem operador principal e transferência sem hipótese são recusados
    expect((await db.from('terceiros_empresa').insert({ empresa_id: emp.data.id, razao_social: 'Sub sem vínculo', cnpj: cnpjTerc, papel_cadeia: 'SUBOPERADOR' })).error).not.toBeNull();
    expect((await db.from('terceiros_empresa').insert({ empresa_id: emp.data.id, razao_social: 'Transf sem hipótese', cnpj: cnpjTerc, papel_cadeia: 'OPERADOR', transferencia_internacional: true })).error).not.toBeNull();
    const sub = await db.from('terceiros_empresa').insert({ empresa_id: emp.data.id, razao_social: 'Suboperador de Teste', cnpj: cnpjTerc, papel_cadeia: 'SUBOPERADOR', operador_principal_id: op.data!.id, transferencia_internacional: true, hipotese_art33: 'II-b' }).select('id').single();
    expect(sub.error).toBeNull();

    // CNPJ fora do GRANT de leitura
    expect((await db.from('terceiros_empresa').select('cnpj').eq('id', op.data!.id)).error).not.toBeNull();
    // Isolamento: registro não aparece sob outro empresa_id
    const outra = await db.from('terceiros_empresa').select('id').eq('id', op.data!.id).neq('empresa_id', emp.data.id);
    expect(outra.error).toBeNull(); expect(outra.data).toEqual([]);
    // Inserção em outra empresa é recusada
    const alheia = await db.from('empresas').select('id').neq('id', emp.data.id).limit(1);
    if (alheia.data?.length) {
      const x = await db.from('terceiros_empresa').insert({ empresa_id: alheia.data[0]!.id, razao_social: 'Intruso', cnpj: cnpjTerc, papel_cadeia: 'OPERADOR' });
      // ADMIN_SISTEMA ignora o isolamento; para os demais papéis a política restritiva recusa
      const { data: admin } = await db.rpc('has_role', { _user_id: (await db.auth.getUser(session.access_token)).data.user!.id, _role: 'ADMIN_SISTEMA' });
      if (!admin) expect(x.error).not.toBeNull();
    }

    // Revelação auditada
    const rev = await db.rpc('revelar_cnpj_terceiro', { _id: op.data!.id });
    expect(rev.error).toBeNull(); expect(rev.data).toBe(cnpjTerc);
    const trilha = await db.from('trilha_auditoria_sistema').select('op, detail, campo_mascarado_acessado').eq('cnpj', emp.data.cnpj).eq('target', 'terceiros_empresa').eq('campo_mascarado_acessado', 'cnpj').order('seq', { ascending: false }).limit(1).single();
    expect(trilha.error).toBeNull(); expect(trilha.data?.op).toBe('SELECT'); expect(trilha.data?.detail).toContain('Operador de Teste Privacium');

    // Exclusão apenas lógica
    expect((await db.from('terceiros_empresa').delete().eq('id', inc.data!.id)).error).not.toBeNull();
    for (const id of [sub.data!.id, inc.data!.id, op.data!.id]) expect((await db.from('terceiros_empresa').update({ ativo: false }).eq('id', id)).error).toBeNull();

    // Operação própria no ROT
    const rot = await db.from('registro_operacoes').select('id').eq('empresa_cnpj', emp.data.cnpj).like('finalidade_especifica', 'Gestão de fornecedores com acesso a dados pessoais%');
    expect(rot.error).toBeNull(); expect(rot.data?.length).toBe(1);

    // Lista de PRT grava no ROT
    const upd = await db.from('registro_operacoes').update({ produtos_tratamento: [{ nome: 'PRT de teste', destino: { tipo: 'ELIMINACAO', prazo: '1 ano', fundamento: 'LGPD, art. 16' } }] }).eq('id', rot.data![0]!.id).select('produtos_tratamento').single();
    expect(upd.error).toBeNull(); expect((upd.data?.produtos_tratamento as { nome: string }[])[0]?.nome).toBe('PRT de teste');
  }, 40000);
});
