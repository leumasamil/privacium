import { test, expect } from '@playwright/test';

const base = process.env['E2E_BASE_URL'] ?? 'http://localhost:8080';
const aviso = 'Esta ação está disponível apenas na versão completa. Entre com sua conta para operar.';
test.use({ viewport: { width: 1280, height: 1800 } });

test('a) envio demo responde mesmo com validação pendente', async ({ page }) => {
  await page.goto(`${base}/demo?aba=anpd`, { waitUntil: 'networkidle' });
  const enviar = page.getByRole('button', { name: 'Enviar à ANPD (simulado)', exact: true });
  await expect(enviar).toBeEnabled();
  await enviar.click();
  await expect(page.getByText(aviso).last()).toBeVisible();
  await page.locator('#anpd-titulares').fill('0');
  await expect(page.locator('#anpd-motivos')).toContainText('mínimo 1');
  await expect(enviar).toBeEnabled();
  await enviar.click();
  await expect(page.getByText(aviso).last()).toBeVisible();
});

test('b) ANPD abre completo e sem pendências de etapa', async ({ page }) => {
  await page.goto(`${base}/demo?aba=anpd`, { waitUntil: 'networkidle' });
  await expect(page.getByText('6 de 6 campos obrigatórios preenchidos')).toBeVisible();
  await expect(page.locator('#anpd-motivos li')).toHaveCount(0);
  await expect(page.getByText('Comunicação registrada.', { exact: false })).toHaveCount(0);
});

test('c) incidente demo apresenta seis etapas concluídas sem envio', async ({ page }) => {
  await page.goto(`${base}/demo?aba=bloco-4`, { waitUntil: 'networkidle' });
  await expect(page.getByText('Etapas concluídas: 6 de 6')).toBeVisible();
  await expect(page.getByText('6 de 6 concluídas', { exact: true })).toBeVisible();
  await expect(page.getByRole('list', { name: 'Etapas do incidente' }).getByText('Concluída', { exact: true })).toHaveCount(6);
  await expect(page.getByRole('list', { name: 'Etapas do incidente' }).getByText(/Responsável: DPO Cenográfico/)).toHaveCount(6);
  await expect(page.locator('main')).not.toContainText('sem responsável registrado');
  await expect(page.getByText('Formulário ANPD não enviado', { exact: false }).first()).toBeVisible();
});

test('d) Bloco 5 bloqueado oferece ação e detalhes clicáveis', async ({ page }) => {
  await page.goto(`${base}/demo?aba=bloco-5`, { waitUntil: 'networkidle' });
  await expect(page.getByRole('heading', { name: 'Bloco 5 bloqueado' })).toBeVisible();
  await expect(page.getByText('Falta concluir o Bloco 4 para liberar esta etapa.')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'O que falta no Bloco 4' })).toBeVisible();
  const action = page.getByRole('link', { name: /^Preencher e enviar o formulário ANPD/ }).last();
  await action.click();
  await expect(page).toHaveURL(/aba=anpd/);
  await page.goto(`${base}/demo?aba=bloco-5`, { waitUntil: 'networkidle' });
  await page.getByRole('link', { name: 'Ver o que falta neste bloco em detalhes' }).click();
  await expect(page).toHaveURL(/aba=manual/);
});

test('e) cinco blocos não contêm botões desabilitados e operações respondem', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  for (const n of [1, 2, 3, 4, 5]) {
    await page.goto(`${base}/demo?aba=bloco-${n}`, { waitUntil: 'networkidle' });
    await expect(page.locator('main button:disabled')).toHaveCount(0);
    await expect(page.locator('main')).not.toContainText('sem responsável registrado');
    if (n === 1) await page.getByRole('button', { name: /^SIM/ }).first().click();
    if (n === 2) await page.getByRole('button', { name: 'Novo processo' }).click();
    if (n === 3) await page.getByRole('button', { name: 'Enviar com Segurança' }).click();
    if (n === 4) await page.getByRole('button', { name: /Extrair lote/ }).click();
    if (n < 5) await expect(page.getByText(aviso).last()).toBeVisible();
    else {
      await page.getByRole('button', { name: /Solicitar/ }).first().click();
      await expect(page.getByText(aviso).last()).toBeVisible();
    }
  }
  expect(errors).toEqual([]);
});

test('f) fluxo completo não faz requisições ao banco nem funções internas', async ({ page }) => {
  const calls: string[] = [];
  page.on('request', request => {
    if (/\/rest\/v1\/|\/_serverFn\//.test(request.url())) calls.push(`${request.method()} ${request.url()}`);
  });
  for (const aba of ['painel', 'bloco-1', 'bloco-2', 'bloco-3', 'bloco-4', 'anpd', 'bloco-5', 'kanban', 'encarregado', 'auditoria', 'manual', 'glossario']) {
    await page.goto(`${base}/demo?aba=${aba}`, { waitUntil: 'networkidle' });
    if (aba === 'anpd') await page.getByRole('button', { name: 'Enviar à ANPD (simulado)' }).click();
    if (aba === 'bloco-4') await page.getByRole('button', { name: /^Encerrar incidente/ }).click();
    if (aba === 'bloco-2') await page.getByRole('button', { name: 'Novo processo' }).click();
    if (aba === 'encarregado') await page.getByRole('button', { name: 'Salvar dados do encarregado' }).click();
    if (aba === 'kanban') await page.getByRole('button', { name: 'Adicionar', exact: true }).click();
  }
  expect(calls).toEqual([]);
});