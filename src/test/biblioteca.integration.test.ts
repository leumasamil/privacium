import { createClient } from '@supabase/supabase-js';
import { describe, expect, it } from 'vitest';
import { BIBLIOTECA_NORMATIVA } from '@/lib/priva/bibliotecaNormativa';

const sessionText = process.env['LOVABLE_BROWSER_SUPABASE_SESSION_JSON'];
const url = import.meta.env['VITE_SUPABASE_URL'];
const key = import.meta.env['VITE_SUPABASE_PUBLISHABLE_KEY'];
const RAZAO_TESTE = 'TESTE DE ACEITAÇÃO — Enquadramento Privacium (cenográfico)';

describe.skipIf(!sessionText || !url || !key)('dosimetria NULL e biblioteca_normativa no banco', () => {
  it('coluna aceita NULL e nenhum registro legado com 0 permanece (simulador desabilitado)', async () => {
    if (!sessionText) throw new Error('Sessão ausente');
    const session = JSON.parse(sessionText) as { access_token: string };
    const db = createClient(url!, key!, { auth: { persistSession: false }, global: { headers: { Authorization: `Bearer ${session.access_token}` } } });
    const emp = await db.from('empresas').select('id, cnpj').eq('razao_social', RAZAO_TESTE).single();
    expect(emp.error).toBeNull(); if (!emp.data) throw new Error('Empresa de teste ausente');

    // A.2: a migração converteu os registros 0 (simulador desabilitado) para NULL
    const zeros = await db.from('ciclos_priva').select('id').eq('reducao_dosimetria', 0);
    expect(zeros.error).toBeNull();
    expect(zeros.data).toEqual([]);

    // A.3/A.4: os ciclos arquivados leem NULL ("não calculado"), nunca 0
    const ciclos = await db.from('ciclos_priva').select('id, reducao_dosimetria').eq('empresa_cnpj', emp.data.cnpj);
    expect(ciclos.error).toBeNull();
    for (const c of ciclos.data ?? []) expect(c.reducao_dosimetria).toBeNull();

    // A.2: a coluna aceita NULL (prova de escrita/leitura atômica feita na migração e na prova manual)
    const nulos = await db.from('ciclos_priva').select('id').is('reducao_dosimetria', null);
    expect(nulos.error).toBeNull();
  });

  it('biblioteca_normativa populada: 51 verificadas + 8 não verificáveis, legível por autenticado', async () => {
    if (!sessionText) throw new Error('Sessão ausente');
    const session = JSON.parse(sessionText) as { access_token: string };
    const db = createClient(url!, key!, { auth: { persistSession: false }, global: { headers: { Authorization: `Bearer ${session.access_token}` } } });

    const todas = await db.from('biblioteca_normativa').select('norma, identificador, status');
    expect(todas.error).toBeNull();
    expect(todas.data!.length).toBe(59);
    expect(todas.data!.filter((r) => r.status === 'VERIFICADA').length).toBe(51);
    expect(todas.data!.filter((r) => r.status === 'NAO_VERIFICAVEL').length).toBe(8);

    // O seed do código e o banco têm exatamente as mesmas chaves
    const chavesBanco = new Set(todas.data!.map((r) => `${r.norma}|${r.identificador}`));
    for (const e of BIBLIOTECA_NORMATIVA) expect(chavesBanco.has(`${e.norma}|${e.identificador}`)).toBe(true);
  });

  it('verificar_citacao_normativa exige URL e texto literal e grava trilha com hash', async () => {
    if (!sessionText) throw new Error('Sessão ausente');
    const session = JSON.parse(sessionText) as { access_token: string };
    const db = createClient(url!, key!, { auth: { persistSession: false }, global: { headers: { Authorization: `Bearer ${session.access_token}` } } });

    const alvo = await db.from('biblioteca_normativa').select('id, texto_literal, url_oficial').eq('norma', 'LC 182/2021').single();
    expect(alvo.error).toBeNull(); const id = alvo.data!.id;

    // Validações: sem URL e com texto curto são rejeitadas
    const semUrl = await db.rpc('verificar_citacao_normativa', { _id: id, _url: '', _texto: alvo.data!.texto_literal });
    expect(semUrl.error).not.toBeNull();
    const textoCurto = await db.rpc('verificar_citacao_normativa', { _id: id, _url: alvo.data!.url_oficial, _texto: 'curto' });
    expect(textoCurto.error).not.toBeNull();

    // Re-verificação idempotente com o mesmo texto oficial: sucesso + trilha com hash
    const ok = await db.rpc('verificar_citacao_normativa', { _id: id, _url: alvo.data!.url_oficial, _texto: alvo.data!.texto_literal });
    expect(ok.error).toBeNull();
    const trilha = await db.from('trilha_auditoria_sistema').select('op, target, detail, hash').eq('target', 'biblioteca_normativa').order('seq', { ascending: false }).limit(1).single();
    expect(trilha.error).toBeNull();
    expect(trilha.data?.op).toBe('UPDATE');
    expect(trilha.data?.detail).toContain('LC 182/2021');
    expect(trilha.data?.detail).toContain('hash sha256');
    expect(trilha.data?.hash).toMatch(/^[0-9a-f]{64}$/);
  });
});
