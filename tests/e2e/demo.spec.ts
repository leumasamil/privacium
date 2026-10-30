import { test, expect } from '@playwright/test';

const base = process.env['E2E_BASE_URL'] ?? 'http://localhost:8080';
const aviso = 'Esta ação está disponível apenas na versão completa. Entre com sua conta para operar.';
test.use({ viewport: { width: 1280, height: 1800 } });
test('a) retorno OAuth publicado — exige sessão Google interativa', async () => {
  test.skip(true, 'Requer autorização interativa Google e publicação das mudanças; não substituir por sessão injetada.');
});
test('b) tentativa com senha mostra orientação Google sem enumerar contas', async ({ page }) => {
  await page.route('**/auth/v1/token*', route => route.fulfill({ status: 400, contentType: 'application/json', body: JSON.stringify({ error: 'invalid_grant', error_description: 'Invalid login credentials' }) }));
  await page.route('**/rest/v1/rpc/registrar_falha_login', route => route.fulfill({ status: 200, body: 'null' }));
  await page.goto(`${base}/auth`, { waitUntil: "networkidle" }); await page.getByLabel('E-mail corporativo').fill('conta-cenografica@example.com');
  await page.getByLabel('Senha corporativa').fill('SenhaCenografica123'); await page.getByRole('button', { name: 'Entrar', exact: true }).click();
  await expect(page.getByText(/Se esta conta foi criada com Google/)).toBeVisible();
});
test('c) visitante anônimo entra com faixa visível', async ({ page }) => {
  await page.goto(`${base}/demo`, { waitUntil: "networkidle" }); await expect(page.getByRole('status').filter({ hasText: 'Modo demonstração' })).toBeVisible();
  await expect(page.getByRole('heading', { name: /Onboarding Industrial/ })).toBeVisible();
});
test('d) cinco blocos navegam; operações respondem e Bloco 5 continua bloqueado', async ({ page }) => {
  const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
  await page.goto(`${base}/demo`, { waitUntil: "networkidle" });
  for (const n of [1,2,3,4,5]) {
    await page.locator('nav a').filter({ hasText: new RegExp(`^${n}`) }).click();
    await expect(page).toHaveURL(new RegExp(`aba=bloco-${n}`));
    await expect(page.locator('main h1')).toBeVisible();
    if (n === 1) await page.getByRole('button', { name: /^SIM/ }).first().click();
    if (n === 2) await page.getByRole('button', { name: 'Novo processo' }).click();
    if (n === 3) await page.getByRole('button', { name: 'Enviar com Segurança' }).click();
    if (n === 4) await page.getByRole('button', { name: /Extrair lote/ }).click();
    if (n < 5) await expect(page.getByText(aviso).last()).toBeVisible();
    if (n === 5) await expect(page.getByRole('heading', { name: 'Bloco 5 bloqueado' })).toBeVisible();
  }
  expect(errors).toEqual([]);
});
test('e) ANPD preenche seletores e fontes', async ({ page }) => {
  await page.goto(`${base}/demo?aba=anpd`, { waitUntil: "networkidle" });
  await expect(page.locator('#anpd-titulares')).toHaveValue('1250'); await expect(page.locator('#anpd-processo')).toHaveValue('demo-rot-1');
  await expect(page.locator('#anpd-encarregado')).toHaveValue('dpo@cenografica.com.br');
  await expect(page.getByText('6 de 6 campos obrigatórios preenchidos')).toBeVisible();
  expect(await page.getByRole('checkbox', { checked: true }).count()).toBeGreaterThanOrEqual(7);
  await expect(page.getByText('LGPD art. 5º, I', { exact: false }).first()).toBeVisible();
});
test('f) enviar ANPD conclui a etapa 06 em memória, sem gravação HTTP', async ({ page }) => {
  const writes: string[] = []; page.on('request', request => { if (['POST','PUT','PATCH','DELETE'].includes(request.method()) && request.url().includes('/rest/v1/')) writes.push(request.url()); });
  await page.goto(`${base}/demo?aba=anpd`, { waitUntil: "networkidle" }); await page.getByRole('button', { name: 'Enviar à ANPD (simulado)' }).click();
  await expect(page.getByText('Envio simulado registrado nesta sessão de demonstração.')).toBeVisible();
  await expect(page.getByText('Comunicação registrada.', { exact: false }).first()).toBeVisible();
  expect(writes).toEqual([]);
});
test('g) sair da demonstração retorna ao login', async ({ page }) => {
  await page.goto(`${base}/demo`, { waitUntil: "networkidle" }); await page.getByRole('button', { name: 'Sair do modo demonstração' }).click(); await expect(page).toHaveURL(/\/auth/);
});
test('h) fluxo demo completo não consulta ou grava banco', async ({ page }) => {
  const calls: string[] = []; page.on('request', request => { if (request.url().includes('/rest/v1/') || request.url().includes('/_serverFn/')) calls.push(request.url()); });
  for (const aba of ['painel','bloco-1','bloco-2','bloco-3','bloco-4','bloco-5','anpd','kanban','encarregado','auditoria','manual','glossario']) {
    await page.goto(`${base}/demo?aba=${aba}`, { waitUntil: "networkidle" }); await expect(page.locator('main')).toBeVisible();
    if (aba === 'kanban') await page.getByRole('button', { name: 'Adicionar', exact: true }).click();
    if (aba === 'encarregado') await page.getByRole('button', { name: 'Salvar dados do encarregado' }).click();
  }
  expect(calls).toEqual([]);
});
test('i) página protegida sem sessão redireciona ao login', async ({ page }) => {
  await page.goto(`${base}/bloco-1`, { waitUntil: "networkidle" }); await expect(page).toHaveURL(/\/auth\?redirect=/);
});
test('j) demonstração contém noindex, nofollow', async ({ page }) => {
  await page.goto(`${base}/demo`, { waitUntil: "networkidle" }); await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex, nofollow');
});
