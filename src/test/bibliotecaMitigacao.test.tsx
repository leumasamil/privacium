import { render, screen, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, expect, it, vi } from 'vitest';
import { derivarRisco, sugestaoMitigacao, type RiscoId } from '@/lib/privacium/bibliotecaMitigacao';
import { DEMO_SIGNATURES, DEMO_PUBLIC_SIGNATURES } from '@/lib/priva/demo';
import { isUnlocked } from '@/lib/priva/store';

/** Fixture local: PI-01 a PI-04 chancelados no teste, com SHA-256 de 64 hex (a demonstração pública nasce sem chancelas). */
const CHANCELADOS: Record<string, { by: string; ts: string; hash: string }> = Object.fromEntries(
  ['PI-01', 'PI-02', 'PI-03', 'PI-04'].map((k, i) => [k, { by: `Teste · ${k}`, ts: '2026-10-01T12:00:00.000Z', hash: `${'abcdef0123456789'.repeat(4).slice(i)}${'0'.repeat(i)}`.padEnd(64, 'f').slice(0, 64) }]),
);

const IDS: RiscoId[] = ['vazamento', 'vies', 'injecao'];
const database = vi.hoisted(() => ({ from: vi.fn(), rpc: vi.fn(), channel: vi.fn(), auth: { getUser: vi.fn() } }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: database }));
const ctx = vi.hoisted(() => ({ log: vi.fn(), signatures: {} as Record<string, unknown> }));
vi.mock('@/lib/priva/store', async (orig) => {
  const real = await orig<typeof import('@/lib/priva/store')>();
  return { ...real, useDemo: () => true, usePriva: () => ({ cnpj: '99999999000199', roles: ['DPO_OPERACIONAL'], signatures: ctx.signatures, set: vi.fn(), log: ctx.log, demo: true, email: 'dpo@cenografica.com.br', userId: null, audit: [] }) };
});
vi.mock('@tanstack/react-router', async (orig) => ({ ...(await orig<object>()), useNavigate: () => vi.fn() }));
vi.mock('@/components/priva/AjudaTarefa', () => ({ AjudaTarefa: () => null }));
vi.mock('@/components/priva/ui', async (orig) => ({ ...(await orig<object>()), PIOutput: () => null }));

async function renderBloco5() {
  const { Bloco5 } = await import('@/components/priva/views/Bloco5');
  return render(<QueryClientProvider client={new QueryClient()}><Bloco5 /></QueryClientProvider>);
}

describe('PI-05 · biblioteca determinística', () => {
  it('a) PIs 01-04 concluídos: três sugestões rotuladas', () => {
    for (const id of IDS) expect(sugestaoMitigacao(id, CHANCELADOS)).toMatchObject({ texto: expect.stringMatching(/^Sugerido a partir do PI-0\d .*Fonte: /) });
  });
  it('b) mesmo texto em três cargas', () => {
    const c = () => IDS.map((id) => JSON.stringify(sugestaoMitigacao(id, CHANCELADOS)));
    expect(c()).toEqual(c()); expect(c()).toEqual(c());
  });
  it('c) sem PI-03 o vazamento fica vazio com aviso', () => {
    const { 'PI-03': _x, ...sem } = CHANCELADOS;
    expect(sugestaoMitigacao('vazamento', sem)).toEqual({ aviso: 'Conclua o PI-03 para receber a sugestão.' });
  });
  it('e) riscos do seed derivados dos PIs', () => {
    const r = IDS.map((id) => derivarRisco(id, CHANCELADOS));
    expect(r.map((x) => [x.prob, x.imp])).toEqual([[2, 4], [3, 4], [3, 3]]);
  });
  it('sem PIs o risco é 5×5', () => {
    expect(derivarRisco('vies', {})).toMatchObject({ prob: 5, imp: 5 });
  });
  it('h) demonstração pública nasce sem chancelas: Bloco 5 bloqueado e nenhum hash sintético', () => {
    expect(isUnlocked(DEMO_PUBLIC_SIGNATURES, 5)).toBe(false);
    expect(isUnlocked(DEMO_SIGNATURES, 5)).toBe(false);
    expect(Object.keys(DEMO_SIGNATURES)).toEqual([]);
    for (const s of Object.values(DEMO_PUBLIC_SIGNATURES)) expect(s.hash).toMatch(/^[0-9a-f]{64}$/);
  });
});

describe('PI-05 · tela', () => {
  it('a, d, f, g, j) sugestões, revisão manual, sobrescrita e responsáveis sem banco', async () => {
    ctx.signatures = CHANCELADOS; ctx.log.mockClear();
    await renderBloco5();
    for (const id of IDS) expect(screen.getByTestId(`rotulo-${id}`).textContent).toMatch(/^Sugerido a partir do PI-0/);
    expect(screen.getByTestId('simulador-em-revisao').textContent).toBe('Simulador em revisão — percentuais em conferência com a Res. CD/ANPD nº 4/2023'); expect(screen.queryByTestId('reducao')).toBeNull();
    fireEvent.change(screen.getByLabelText('Medidas de mitigação · Injeção de prompts'), { target: { value: 'Texto revisado pelo DPO com mais detalhes.' } });
    expect(screen.getByTestId('rotulo-injecao').textContent).toBe('Revisado manualmente pelo DPO');
    expect(ctx.log).toHaveBeenCalledWith('UPDATE', 'ripd_ia', expect.stringContaining('revisada manualmente pelo DPO'));
    fireEvent.change(screen.getByLabelText('Probabilidade · Vazamento por prompts'), { target: { value: '5' } });
    // Alterar o escore não inventa pontos percentuais de desconto.
    expect(screen.getByTestId('simulador-em-revisao').textContent).toBe('Simulador em revisão — percentuais em conferência com a Res. CD/ANPD nº 4/2023'); expect(screen.queryByTestId('reducao')).toBeNull();
    expect(screen.getByTestId('resp-sig-dpo').textContent).toContain('Aguardando assinatura de DPO_OPERACIONAL · DPO Cenográfico');
    expect(screen.getByTestId('resp-sig-dir').textContent).toContain('Aguardando assinatura de C_SUITE (Diretoria) · Diretoria Cenográfica');
    expect(database.from).not.toHaveBeenCalled(); expect(database.rpc).not.toHaveBeenCalled();
  });
  it('c) tela sem PI-03: campo vazio com aviso', async () => {
    const { 'PI-03': _x, ...sem } = CHANCELADOS; ctx.signatures = sem;
    await renderBloco5();
    expect(screen.getByTestId('rotulo-vazamento').textContent).toBe('Conclua o PI-03 para receber a sugestão.');
    expect((screen.getByLabelText('Medidas de mitigação · Vazamento por prompts') as HTMLTextAreaElement).value).toBe('');
  });
});

describe('Biblioteca A1-A4 · extensões determinísticas', () => {
  it('A1) descrição contextual sugerida com rótulo e aviso sem PI de origem', async () => {
    const { sugestaoDescricao } = await import('@/lib/privacium/bibliotecaMitigacao');
    for (const id of IDS) expect(sugestaoDescricao(id, CHANCELADOS)).toMatchObject({ rotulo: expect.stringMatching(/^Sugerido a partir do PI-0/), texto: expect.any(String) });
    const { 'PI-03': _x, ...sem } = CHANCELADOS;
    expect(sugestaoDescricao('vazamento', sem)).toEqual({ aviso: 'Conclua o PI-03 para receber a sugestão.' });
  });
  it('A2) estrutura de cofre sugerida a partir dos setores do ROT, determinística', async () => {
    const { estruturaSugerida } = await import('@/lib/privacium/bibliotecaMitigacao');
    const s = estruturaSugerida(['RH', 'Marketing']);
    expect(s.rotulo).toBe('Sugerido a partir do ROT (PI-02)');
    expect(s.estrutura).toContain('holerites/');
    expect(s.estrutura).toContain('bases-consentidas/');
    expect(estruturaSugerida(['RH', 'Marketing'])).toEqual(s);
    expect(estruturaSugerida([]).cenarios).toEqual(['Uso geral']);
  });
  it('A3) padrão de hostname vira placeholder de formato, nunca valor inventado', async () => {
    const { padraoHostname } = await import('@/lib/privacium/bibliotecaMitigacao');
    expect(padraoHostname(['NB-FIN-01'])).toContain('NB-<SETOR>-NN');
    expect(padraoHostname([])).toBeNull();
  });
  it('A4) quatro exemplos do Escudo com antes/depois fixos e fonte normativa', async () => {
    const { EXEMPLOS_ESCUDO } = await import('@/lib/privacium/bibliotecaMitigacao');
    expect(EXEMPLOS_ESCUDO.map((e) => e.id)).toEqual(['cpf', 'email', 'bancario', 'titular']);
    for (const e of EXEMPLOS_ESCUDO) {
      expect(e.higienizado).toMatch(/_TOKEN/);
      expect(e.higienizado).not.toBe(e.prompt);
      expect(e.fonte.length).toBeGreaterThan(3);
      expect(e.mascara).toMatch(/\*/);
    }
  });
  it('C) pedagogia normativa: resumo e relevância fixos; desconhecida sem tooltip', async () => {
    const { buscarNorma } = await import('@/lib/priva/pedagogia');
    const n = buscarNorma('LGPD art. 5º, I');
    expect(n?.resumo).toContain('pessoa natural identificada');
    expect(n?.porque).toContain('ROT');
    expect(buscarNorma('CIS Controls v8')?.resumo).toContain('Center for Internet Security');
    expect(buscarNorma('Lei Inexistente nº 0/0000')).toBeNull();
  });
});
