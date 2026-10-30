import { render, screen, act } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { PrivaProvider, usePriva, isUnlocked } from '@/lib/priva/store';
import { DEMO_CNPJ, DEMO_ROT, DEMO_ROWS, DEMO_PUBLIC_SIGNATURES, DEMO_TRILHA_SEED, DEMO_AGORA, DEMO_AGORA_ISO, aplicarSessaoDemo, carregarEstadoIncidenteDemo, type DemoSessao } from '@/lib/priva/demo';
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
  it('mutações e trilha não chamam banco; assinatura demo vive só em memória', async () => {
    let ctx: ReturnType<typeof usePriva> | undefined;
    function Probe() { ctx = usePriva(); return null; }
    render(<PrivaProvider initialDemo><Probe /></PrivaProvider>);
    if (!ctx) throw new Error('Context missing');
    await act(async () => { if (!ctx) return; ctx.set({ signatures: {} }); ctx.log('INSERT', 'test', 'test'); await ctx.refreshAudit(); ctx.reset(); ctx.setRole('ADMIN_SISTEMA'); ctx.selectEmpresa('123'); await ctx.createEmpresa('123', 'Teste'); });
    expect(ctx.signatures['PI-04-DPO']).toBeUndefined();
    await act(async () => { await ctx?.sign('PI-04'); });
    expect(ctx.signatures['PI-04-DPO']?.by).toContain('DPO Cenográfico');
    expect(ctx.signatures['PI-04']).toBeUndefined();
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
  it('etapas 01 a 05 cenográficas têm data, responsável e evidência; a 06 nasce pendente', () => {
    const incident = DEMO_ROWS.incidentes_seguranca[0]; if (!incident) throw new Error('Missing incident');
    const state = carregarEstadoIncidenteDemo(incident.id, { incidentes: [incident], lotes: [], assinaturas: DEMO_PUBLIC_SIGNATURES, agora: Date.parse(incident.iniciado_em) });
    expect(incident.passos).toEqual([true, true, true, true, true, true]);
    // A etapa 06 é consequência do envio: sem enviado_anpd_em, o demo abre com 5 de 6.
    expect(state.etapas.concluidas).toBe(5);
    expect(state.etapas.itens[5]?.concluida).toBe(false);
    expect(state.motivos_bloqueio).toContain('Formulário ANPD não enviado');
    const registros = incident.etapas_registro as Record<string, { data: string; responsavel: string; evidencia: string }>;
    expect(Object.keys(registros)).toEqual(['1', '2', '3', '4', '5', '6']);
    expect(Object.values(registros).map(registro => registro.evidencia)).toEqual([
      'Servidores desconectados da VLAN corporativa.',
      'Célula de resposta acionada; papéis de crise atribuídos.',
      'Coleta forense de logs de firewall e dump de memória.',
      'Restauração a partir de backup íntegro com validação de hash.',
      'Integridade dos dados restaurados validada por SHA-256.',
      'Comunicação à ANPD preparada no formulário assistido.',
    ]);
    expect(state.incidente.id).toBe('demo-inc');
    expect(state.etapas.itens.slice(0, 5).map(etapa => etapa.responsavel)).toEqual(Array(5).fill('DPO Cenográfico'));
    for (const registro of Object.values(registros)) {
      expect(registro.data).toBe('2026-10-01T12:00:00.000Z');
      expect(registro.responsavel).toBe('DPO Cenográfico');
      expect(registro.evidencia.length).toBeGreaterThan(0);
    }
  });
  it('cenário não enviado e não encerrado nunca libera PI-04 ou Bloco 5', () => {
    const incident = DEMO_ROWS.incidentes_seguranca[0]; if (!incident) throw new Error('Missing incident');
    const fonte = { incidentes: [incident], lotes: [], assinaturas: DEMO_PUBLIC_SIGNATURES, agora: Date.parse(incident.iniciado_em) };
    const state = carregarEstadoIncidenteDemo(incident.id, fonte);
    expect(incident.enviado_anpd_em).toBeNull(); expect(incident.encerrado_em).toBeNull();
    expect(state.anpd.enviado).toBe(false); expect(state.podeEncerrar).toBe(false);
    expect(carregarEstadoIncidente(incident.id, fonte).etapas.concluidas).toBe(5);
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

describe('circuito do incidente no demo (etapa 06 como consequência)', () => {
  const fonteBase = () => {
    const incident = DEMO_ROWS.incidentes_seguranca[0]; if (!incident) throw new Error('Missing incident');
    return { incident, fonte: { incidentes: [incident], lotes: DEMO_ROWS.lotes_pgaudit, assinaturas: DEMO_PUBLIC_SIGNATURES, agora: DEMO_AGORA } };
  };
  it('antes do envio: 5 de 6, encerramento bloqueado só pelo formulário', () => {
    const { incident, fonte } = fonteBase();
    const e = carregarEstadoIncidenteDemo(incident.id, fonte);
    expect(e.etapas.concluidas).toBe(5);
    expect(e.podeEncerrar).toBe(false);
    expect(e.motivos_bloqueio).toEqual(['Formulário ANPD não enviado']);
  });
  it('envio simulado conclui a etapa 06 com data e responsável e habilita o encerramento', () => {
    const { incident, fonte } = fonteBase();
    const sessao: DemoSessao = { enviadoEm: DEMO_AGORA_ISO, encerradoEm: null };
    const sobreposto = aplicarSessaoDemo(incident, sessao);
    const e = carregarEstadoIncidenteDemo(sobreposto.id, { ...fonte, incidentes: [sobreposto] });
    expect(e.etapas.concluidas).toBe(6);
    const sexta = e.etapas.itens[5];
    expect(sexta?.concluida).toBe(true);
    expect(sexta?.responsavel).toBe('DPO Cenográfico');
    expect(sexta?.data).toBe(DEMO_AGORA_ISO);
    expect(e.podeEncerrar).toBe(true);
    expect(e.anpd.prazo_vencido).toBe(false);
  });
  it('encerramento simulado marca encerrado_em e a sessão completa libera o fluxo do PI-04', () => {
    const { incident, fonte } = fonteBase();
    const sobreposto = aplicarSessaoDemo(incident, { enviadoEm: DEMO_AGORA_ISO, encerradoEm: DEMO_AGORA_ISO });
    const e = carregarEstadoIncidenteDemo(sobreposto.id, { ...fonte, incidentes: [sobreposto] });
    expect(e.incidente.encerrado_em).toBe(DEMO_AGORA_ISO);
    expect(e.etapas.concluidas).toBe(6);
    expect(e.anpd.enviado).toBe(true);
  });
  it('trilha cenográfica tem seed encadeado e contador real', () => {
    expect(DEMO_TRILHA_SEED.length).toBeGreaterThanOrEqual(11);
    for (let i = 1; i < DEMO_TRILHA_SEED.length; i++) expect(DEMO_TRILHA_SEED[i]?.prev_hash).toBe(DEMO_TRILHA_SEED[i - 1]?.hash);
    for (const ev of DEMO_TRILHA_SEED) expect(ev.hash).toMatch(/^[0-9a-f]{64}$/);
  });
  it('fluxo completo em memória: envio, encerramento e dupla chancela liberam o Bloco 5 sem banco', async () => {
    let ctx: ReturnType<typeof usePriva> | undefined;
    function Probe() { ctx = usePriva(); return null; }
    render(<PrivaProvider initialDemo><Probe /></PrivaProvider>);
    if (!ctx) throw new Error('Context missing');
    const eventosAntes = ctx.audit.length;
    expect(isUnlocked(ctx.signatures, 5)).toBe(false);
    await act(async () => { await ctx?.demoEnviarANPD(); });
    expect(ctx.demoSessao.enviadoEm).toBe(DEMO_AGORA_ISO);
    await act(async () => { await ctx?.demoEncerrarIncidente(); });
    expect(ctx.demoSessao.encerradoEm).toBe(DEMO_AGORA_ISO);
    await act(async () => { await ctx?.demoAssinar('PI-04', 'DPO'); });
    expect(isUnlocked(ctx.signatures, 5)).toBe(false);
    await act(async () => { await ctx?.demoAssinar('PI-04', 'DIR'); });
    expect(ctx.signatures['PI-04']).toBeDefined();
    expect(isUnlocked(ctx.signatures, 5)).toBe(true);
    expect(ctx.audit.length).toBe(eventosAntes + 4);
    expect(database.from).not.toHaveBeenCalled(); expect(database.rpc).not.toHaveBeenCalled();
  });
});
