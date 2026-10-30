import { createClient } from '@supabase/supabase-js';
import { describe, expect, it } from 'vitest';

// Migração 0045: remover_registro_de_teste exige proprietário do sistema (ADMIN_SISTEMA),
// justificativa obrigatória e grava a remoção na trilha com hash. Roda só na empresa de teste.
const sessionText = process.env['LOVABLE_BROWSER_SUPABASE_SESSION_JSON'];
const url = import.meta.env['VITE_SUPABASE_URL'];
const key = import.meta.env['VITE_SUPABASE_PUBLISHABLE_KEY'];
const CNPJ_TESTE = '98765432000198';
const ROT_TESTE = '718707ec-7d20-41d8-8bd7-5d26ba6a44c1'; // PRIVA-TI-002 da empresa de teste

describe.skipIf(!sessionText || !url || !key)('remover_registro_de_teste autenticado no banco', () => {
  it('exige justificativa, marca origem TESTE, tira do dossiê e audita com hash', async () => {
    if (!sessionText) throw new Error('Sessão ausente');
    const session = JSON.parse(sessionText) as { access_token: string };
    const db = createClient(url!, key!, { auth: { persistSession: false }, global: { headers: { Authorization: `Bearer ${session.access_token}` } } });

    // Justificativa obrigatória
    const semJust = await db.rpc('remover_registro_de_teste', { _rot_id: ROT_TESTE, _justificativa: 'curta' });
    expect(semJust.error?.message).toContain('justificativa');

    // Linha inexistente
    const inexistente = await db.rpc('remover_registro_de_teste', { _rot_id: '00000000-0000-0000-0000-000000000000', _justificativa: 'justificativa longa o bastante' });
    expect(inexistente.error?.message).toContain('não encontrada');

    // Remoção auditada na empresa de teste
    const r = await db.rpc('remover_registro_de_teste', { _rot_id: ROT_TESTE, _justificativa: 'Linha de teste automatizado da remoção de registros de teste (integração).' });
    expect(r.error).toBeNull();
    const dados = r.data as { codigo: string; hash: string; removida_por: string };
    expect(dados.codigo).toBe('PRIVA-TI-002');
    expect(dados.hash).toMatch(/^[0-9a-f]{64}$/);

    const linha = await db.from('registro_operacoes').select('origem, removida_do_dossie').eq('id', ROT_TESTE).single();
    expect(linha.data?.origem).toBe('TESTE');
    expect(linha.data?.removida_do_dossie).toBe(true);

    const trilha = await db.from('trilha_auditoria_sistema').select('op, detail, hash').eq('cnpj', CNPJ_TESTE).eq('target', 'registro_operacoes').like('detail', 'Remoção de registro de teste%').order('seq', { ascending: false }).limit(1).single();
    expect(trilha.error).toBeNull();
    expect(trilha.data?.detail).toContain('PRIVA-TI-002');
    expect(trilha.data?.detail).toContain('justificativa');
    expect(trilha.data?.hash).toBe(dados.hash);

    // Segunda remoção é recusada
    const deNovo = await db.rpc('remover_registro_de_teste', { _rot_id: ROT_TESTE, _justificativa: 'tentativa repetida de remoção' });
    expect(deNovo.error?.message).toContain('já está fora do dossiê');

    // Ninguém altera origem/removida_do_dossie por fora da operação auditada
    const direto = await db.from('registro_operacoes').update({ removida_do_dossie: false }).eq('id', ROT_TESTE);
    expect(direto.error).not.toBeNull();
  });
});
