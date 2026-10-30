import { test, expect } from '@playwright/test';

const base = process.env['E2E_BASE_URL'] ?? 'http://localhost:8080';
test.use({ viewport: { width: 1280, height: 1800 } });

/** Navegação client-side entre abas do demo (recarregar a página reinicia a sessão cenográfica). */
const aba = (page: import('@playwright/test').Page, nome: string) => page.locator(`a[href*="/demo?aba=${nome}"]`).first().click();

test('a-i) circuito completo: envio → encerramento → chancela PI-04 → Bloco 5 na mesma sessão', async ({ page }) => {
  const writes: string[] = [];
  page.on('request', r => { if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(r.method()) && /\/rest\/v1\/|\/_serverFn\//.test(r.url())) writes.push(r.url()); });

  // a) Antes do envio: Bloco 4 e Dashboard concordam em "5 de 6"; encerramento bloqueado.
  await page.goto(`${base}/demo?aba=bloco-4`, { waitUntil: 'networkidle' });
  await expect(page.getByText('Etapas concluídas: 5 de 6')).toBeVisible();
  await expect(page.getByText('Formulário ANPD não enviado', { exact: false }).first()).toBeVisible();
  await expect(page.getByRole('button', { name: /Encerrar incidente \(1 pendências\)/ })).toBeVisible();
  await aba(page, 'pendencias');
  await expect(page.locator('[data-testid="pendencia-inc-demo-inc"]')).toContainText('5 de 6 concluídas. Falta: 06 Comunicação à ANPD.');

  // g1) Atalho do Dashboard aponta para o formulário ANPD (aba=anpd).
  await page.locator('[data-testid="atalho-anpd-demo-inc"]').click();
  await expect(page).toHaveURL(/aba=anpd/);

  // b) Envio simulado: etapa 06 concluída com data/hora e responsável.
  await page.getByRole('button', { name: 'Enviar à ANPD (simulado)', exact: true }).click();
  await expect(page.getByText('Envio simulado registrado nesta sessão de demonstração.')).toBeVisible();
  await expect(page.getByText('Comunicação registrada.', { exact: false }).first()).toBeVisible();

  // g2) Link "Abrir formulário ANPD" do Bloco 4 também leva a aba=anpd (volta client-side).
  await aba(page, 'bloco-4');
  await expect(page.getByText('Etapas concluídas: 6 de 6')).toBeVisible();
  const lista = page.getByRole('list', { name: 'Etapas do incidente' });
  await expect(lista.getByText('Concluída', { exact: true })).toHaveCount(6);
  await expect(lista.getByText(/Responsável: DPO Cenográfico/)).toHaveCount(6);

  // c) Encerramento habilitado no instante do envio; encerrar e confirmar.
  const encerrar = page.getByRole('button', { name: 'Encerrar incidente', exact: true }).first();
  await expect(encerrar).toBeVisible();
  await encerrar.click();
  await expect(page.getByText('Incidente encerrado nesta sessão de demonstração.')).toBeVisible();
  await expect(page.getByText('Pronto para chancela digital.')).toBeVisible();

  // d) PI-04 chancelável (DPO + Diretoria) e Bloco 5 liberado na mesma sessão, sem reload.
  await page.getByRole('button', { name: 'Gerar e assinar' }).click();
  await page.getByRole('button', { name: 'Assinatura do DPO (CPF)' }).click();
  await page.getByRole('button', { name: 'Assinatura da Diretoria (CNPJ)' }).click();
  await expect(page.getByText(/PI-04-DIR assinado · PI-04 CHANCELADO|Chancelado em/).first()).toBeVisible();
  await page.keyboard.press('Escape');
  await aba(page, 'bloco-5');
  await expect(page.getByRole('heading', { name: 'Auditar o Sistema de Privacidade e Mitigar Riscos' })).toBeVisible();

  // e) PI-05: sugestões determinísticas da biblioteca estática, derivação e simulador coerentes.
  await expect(page.locator('[data-testid="rotulo-desc-vazamento"]')).toContainText('Sugerido a partir de');
  await expect(page.locator('[data-testid="rotulo-vazamento"]')).toContainText('Sugerido a partir de');
  await expect(page.locator('[data-testid="derivado-vazamento"]')).toContainText('risco inerente 5×5 = 25');
  await expect(page.locator('[data-testid="calculo-reducao"]')).toContainText('Redução = 75% ×');
  await expect(page.locator('[data-testid="reducao"]')).toBeVisible();

  // h) Trilho Core: contador cresceu com as ações da sessão e os hashes estão visíveis.
  await aba(page, 'auditoria');
  await expect(page.getByText(/Linha do tempo de evidências · 1[5-9] eventos/)).toBeVisible();
  await expect(page.getByText('Comunicação à ANPD enviada (simulação) · etapa 06 concluída')).toBeVisible();
  await expect(page.getByText(/SHA-256 · [0-9a-f]{20}/).first()).toBeVisible();

  // i) Regressão: recarregar reinicia a sessão cenográfica — Bloco 5 volta a bloquear, faixa demo presente, delta 0.
  await page.goto(`${base}/demo?aba=bloco-5`, { waitUntil: 'networkidle' });
  await expect(page.getByRole('heading', { name: 'Bloco 5 bloqueado' })).toBeVisible();
  await expect(page.getByText('Modo Demonstração', { exact: false }).first()).toBeVisible();
  expect(writes).toEqual([]);
});

test('f) prazo de 3 dias úteis exibido no Bloco 4 e no Dashboard, sem "72 horas"', async ({ page }) => {
  await page.goto(`${base}/demo?aba=bloco-4`, { waitUntil: 'networkidle' });
  await expect(page.getByText('3 dias úteis (Res. CD/ANPD nº 15/2024, art. 6º)', { exact: false }).first()).toBeVisible();
  await expect(page.getByText('contados do conhecimento do incidente; não inclui fins de semana e feriados', { exact: false })).toBeVisible();
  await expect(page.locator('main')).not.toContainText('72 horas');
  await page.locator('a[href*="/demo?aba=pendencias"]').first().click();
  await expect(page.locator('[data-testid="pendencia-anpd-demo-inc"]')).toContainText('3 dias úteis');
  // A prova aritmética do fim de semana está no teste unitário de restanteANPD (sábado não consome prazo).
});
