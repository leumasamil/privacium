import { render, screen, act } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { PrivaProvider, usePriva, isUnlocked } from '@/lib/priva/store';
import { DEMO_CNPJ, DEMO_ROT, DEMO_ROWS, DEMO_PUBLIC_SIGNATURES } from '@/lib/priva/demo';
import { carregarEstadoIncidente } from '@/lib/priva/estadoIncidente';
import { isLoginSessionEvent, safeAuthPath } from '@/lib/priva/authNavigation';
import { assinaturasVigentes } from '@/lib/priva/ciclo';

const database = vi.hoisted(() => ({ from: vi.fn(), rpc: vi.fn(), auth: { getUser: vi.fn() }, channel: vi.fn() }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: database }));
describe('regras da demonstração pública', () => {
  it('ready imediato, DPO somente e CNPJ cenográfico único', () => {
    function Probe() { const ctx = usePriva(); return <output>{JSON.stringify({ ready: ctx.ready, demo: ctx.demo, cnpj: ctx.cnpj, roles: ctx.roles, role: ctx.role })}</output>; }
    render(<PrivaProvider initialDemo><Probe /></PrivaProvider>);
    expect(JSON.parse(screen.getByRole('status').textContent ?? '{}')).toEqual({ ready: true, demo: true, cnpj: '99999999000199', roles: ['DPO_OPERACIONAL'], role: 'DPO_OPERACIONAL' });
    expect(database.auth.getUser).not.toHaveBeenCalled();
  });
  it('mutações e trilha não chamam banco nem alteram assinaturas', async () => {
    let ctx: ReturnType<typeof usePriva> | undefined;
    function Probe() { ctx = usePriva(); return null; }
    render(<PrivaProvider initialDemo><Probe /></PrivaProvider>);
    if (!ctx) throw new Error('Context missing');
    const initial = ctx.signatures;
    await act(async () => { if (!ctx) return; ctx.set({ signatures: {} }); ctx.log('INSERT', 'test', 'test'); await ctx.sign('PI-04'); await ctx.refreshAudit(); ctx.reset(); ctx.setRole('ADMIN_SISTEMA'); ctx.selectEmpresa('123'); await ctx.createEmpresa('123', 'Teste'); });
    expect(ctx.signatures).toBe(initial);
    expect(ctx.role).toBe('DPO_OPERACIONAL');
    expect(database.from).not.toHaveBeenCalled(); expect(database.rpc).not.toHaveBeenCalled(); expect(database.channel).not.toHaveBeenCalled();
  });
  it('ROT e todas as linhas pertencem ao mesmo CNPJ fictício', () => {
    expect(DEMO_CNPJ).toBe('99999999000199');
    expect([...DEMO_ROT, ...Object.values(DEMO_ROWS).flat()].every(row => row.empresa_cnpj === DEMO_CNPJ)).toBe(true);
  });
  it('ANPD tem 1250 titulares, três categorias e fontes em riscos e medidas', () => {
    const form = DEMO_ROWS.incidentes_seguranca[0]?.comunicacao as Record<string, unknown>;
    expect(form['titulares']).toBe('1250'); expect(form['categorias']).toEqual(['Nome', 'CPF', 'Dados bancários']);
    for (const key of ['natureza_principal', 'categorias_vinculadas', 'riscos_selecionados', 'medidas_selecionadas']) {
      const items = Array.isArray(form[key]) ? form[key] : [form[key]];
      expect(items.length).toBeGreaterThan(0); expect(items.every(item => item && item.valor && item.fonte_normativa)).toBe(true);
    }
  });
  it('etapas 1–3 possuem evidência e PI-04 ausente bloqueia Bloco 5', () => {
    const incident = DEMO_ROWS.incidentes_seguranca[0]; if (!incident) throw new Error('Missing incident');
    const state = carregarEstadoIncidente(incident.id, { incidentes: [incident], lotes: [], assinaturas: DEMO_PUBLIC_SIGNATURES, agora: Date.parse(incident.iniciado_em) });
    expect(state.etapas.concluidas).toBe(3); expect(state.etapas.itens.slice(0, 3).every(item => item.data && item.responsavel)).toBe(true);
    expect(isUnlocked(DEMO_PUBLIC_SIGNATURES, 5)).toBe(false);
  });
  it('eventos de login aceitam somente SIGNED_IN e INITIAL_SESSION', () => {
    expect(['SIGNED_IN','INITIAL_SESSION','TOKEN_REFRESHED','SIGNED_OUT','USER_UPDATED'].filter(isLoginSessionEvent)).toEqual(['SIGNED_IN', 'INITIAL_SESSION']);
  });
  it('redirect externo, contrabarra e caminho desconhecido nunca são aceitos', () => {
    for (const path of ['https://example.com', '//example.com', '/\\example.com', '/nao-existe']) expect(safeAuthPath(path)).toBe('/painel');
    expect(safeAuthPath('/bloco-2#rot')).toBe('/bloco-2#rot');
  });
  it('assinaturas nulas ou arrays não liberam blocos', () => {
    for (const value of [null, undefined, []]) expect(assinaturasVigentes(value as never, new Date('2026-10-30'))).toEqual({});
  });
});