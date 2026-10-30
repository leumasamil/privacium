import { render, screen, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, expect, it, vi } from 'vitest';
import { derivarRisco, reducaoPorRiscos, sugestaoMitigacao, type RiscoId } from '@/lib/privacium/bibliotecaMitigacao';
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
  it('e) riscos do seed e redução coerentes: 2×4, 3×4, 3×3 → 48%', () => {
    const r = IDS.map((id) => derivarRisco(id, DEMO_SIGNATURES));
    expect(r.map((x) => [x.prob, x.imp])).toEqual([[2, 4], [3, 4], [3, 3]]);
    expect(reducaoPorRiscos(r)).toBe(Math.round((75 * (16 + 13 + 16)) / 72));
    expect(reducaoPorRiscos(r)).toBe(47);
  });
  it('sem PIs o risco é 5×5 e a redução é 0%; no piso é o teto de 75%', () => {
    expect(derivarRisco('vies', {})).toMatchObject({ prob: 5, imp: 5 });
    expect(reducaoPorRiscos([{ prob: 5, imp: 5 }])).toBe(0);
    expect(reducaoPorRiscos([{ prob: 1, imp: 1 }])).toBe(75);
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
    expect(screen.getByTestId('reducao').textContent).toBe('−47%');
    fireEvent.change(screen.getByLabelText('Medidas de mitigação · Injeção de prompts'), { target: { value: 'Texto revisado pelo DPO com mais detalhes.' } });
    expect(screen.getByTestId('rotulo-injecao').textContent).toBe('Revisado manualmente pelo DPO');
    expect(ctx.log).toHaveBeenCalledWith('UPDATE', 'ripd_ia', expect.stringContaining('revisada manualmente pelo DPO'));
    fireEvent.change(screen.getByLabelText('Probabilidade · Vazamento por prompts'), { target: { value: '5' } });
    // vazamento 5×4=20: 75 × (5+13+16) / 72 = 35
    expect(screen.getByTestId('reducao').textContent).toBe('−35%');
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
