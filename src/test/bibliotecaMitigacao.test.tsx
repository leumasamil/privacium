import { render, screen, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, expect, it, vi } from 'vitest';
import { derivarRisco, sugestaoMitigacao, type RiscoId } from '@/lib/privacium/bibliotecaMitigacao';
import { memoriaDosimetria } from '@/lib/priva/dosimetria';
import { DEMO_SIGNATURES, DEMO_PUBLIC_SIGNATURES } from '@/lib/priva/demo';
import { isUnlocked } from '@/lib/priva/store';

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
    for (const id of IDS) expect(sugestaoMitigacao(id, DEMO_SIGNATURES)).toMatchObject({ texto: expect.stringMatching(/^Sugerido a partir do PI-0\d .*Fonte: /) });
  });
  it('b) mesmo texto em três cargas', () => {
    const c = () => IDS.map((id) => JSON.stringify(sugestaoMitigacao(id, DEMO_SIGNATURES)));
    expect(c()).toEqual(c()); expect(c()).toEqual(c());
  });
  it('c) sem PI-03 o vazamento fica vazio com aviso', () => {
    const { 'PI-03': _x, ...sem } = DEMO_SIGNATURES;
    expect(sugestaoMitigacao('vazamento', sem)).toEqual({ aviso: 'Conclua o PI-03 para receber a sugestão.' });
  });
  it('e) riscos do seed: 2×4, 3×4, 3×3 descontam 29 pontos de 60 → 31%', () => {
    const r = IDS.map((id) => derivarRisco(id, DEMO_SIGNATURES));
    expect(r.map((x) => [x.prob, x.imp])).toEqual([[2, 4], [3, 4], [3, 3]]);
    const m = memoriaDosimetria(DEMO_SIGNATURES, r.map((v, i) => ({ ...v, label: IDS[i] ?? '' })), 100_000);
    expect(m.descontoResidual).toBe(29);
    expect(m.reducaoEfetiva).toBe(31);
  });
  it('sem PIs o risco é 5×5 e a redução é 0%', () => {
    expect(derivarRisco('vies', {})).toMatchObject({ prob: 5, imp: 5 });
    expect(memoriaDosimetria({}, [{ label: 'Viés', prob: 5, imp: 5 }], 100_000).reducaoEfetiva).toBe(0);
  });
  it('h) demonstração pública sem PI-04: Bloco 5 continua bloqueado', () => {
    expect(isUnlocked(DEMO_PUBLIC_SIGNATURES, 5)).toBe(false);
    expect(isUnlocked(DEMO_SIGNATURES, 5)).toBe(true);
  });
});

describe('PI-05 · tela', () => {
  it('a, d, f, g, j) sugestões, revisão manual, sobrescrita e responsáveis sem banco', async () => {
    ctx.signatures = DEMO_SIGNATURES; ctx.log.mockClear();
    await renderBloco5();
    for (const id of IDS) expect(screen.getByTestId(`rotulo-${id}`).textContent).toMatch(/^Sugerido a partir do PI-0/);
    expect(screen.getByTestId('reducao').textContent).toBe('−31%');
    fireEvent.change(screen.getByLabelText('Medidas de mitigação · Injeção de prompts'), { target: { value: 'Texto revisado pelo DPO com mais detalhes.' } });
    expect(screen.getByTestId('rotulo-injecao').textContent).toBe('Revisado manualmente pelo DPO');
    expect(ctx.log).toHaveBeenCalledWith('UPDATE', 'ripd_ia', expect.stringContaining('revisada manualmente pelo DPO'));
    fireEvent.change(screen.getByLabelText('Probabilidade · Vazamento por prompts'), { target: { value: '5' } });
    // vazamento 5×4=20: 60 − (20 + 12 + 9) = 19
    expect(screen.getByTestId('reducao').textContent).toBe('−19%');
    expect(screen.getByTestId('resp-sig-dpo').textContent).toContain('Aguardando assinatura de DPO_OPERACIONAL · DPO Cenográfico');
    expect(screen.getByTestId('resp-sig-dir').textContent).toContain('Aguardando assinatura de C_SUITE (Diretoria) · Diretoria Cenográfica');
    expect(database.from).not.toHaveBeenCalled(); expect(database.rpc).not.toHaveBeenCalled();
  });
  it('c) tela sem PI-03: campo vazio com aviso', async () => {
    const { 'PI-03': _x, ...sem } = DEMO_SIGNATURES; ctx.signatures = sem;
    await renderBloco5();
    expect(screen.getByTestId('rotulo-vazamento').textContent).toBe('Conclua o PI-03 para receber a sugestão.');
    expect((screen.getByLabelText('Medidas de mitigação · Vazamento por prompts') as HTMLTextAreaElement).value).toBe('');
  });
});

describe('Biblioteca A1-A4 · extensões determinísticas', () => {
  it('A1) descrição contextual sugerida com rótulo e aviso sem PI de origem', async () => {
    const { sugestaoDescricao } = await import('@/lib/privacium/bibliotecaMitigacao');
    for (const id of IDS) expect(sugestaoDescricao(id, DEMO_SIGNATURES)).toMatchObject({ rotulo: expect.stringMatching(/^Sugerido a partir do PI-0/), texto: expect.any(String) });
    const { 'PI-03': _x, ...sem } = DEMO_SIGNATURES;
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
    expect(buscarNorma('CIS Control 03')?.resumo).toContain('exfiltração');
    expect(buscarNorma('Lei Inexistente nº 0/0000')).toBeNull();
  });
});
