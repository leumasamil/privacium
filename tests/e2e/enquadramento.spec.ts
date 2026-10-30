import { test, expect } from '@playwright/test';
const base = process.env['E2E_BASE_URL'] ?? 'http://localhost:8080';
test.use({ viewport:{width:1280,height:1800} });
test('porte altera badge, citações ROT e prazo sem gravação demo', async ({page}) => {
  const writes:string[]=[];
  page.on('request',r=>{if(['POST','PUT','PATCH','DELETE'].includes(r.method()) && /\/rest\/v1\/|\/_serverFn\//.test(r.url())) writes.push(r.url());});
  await page.goto(`${base}/demo?aba=bloco-1`);
  await expect(page.getByRole('heading',{name:'Enquadramento do agente',exact:true})).toBeVisible();
  for(const p of ['COMPLETO','PEQUENO'] as const){
    await page.getByLabel('Cenário demonstrativo de enquadramento').selectOption(p);
    await expect(page.getByTestId('cabecalho-porte')).toContainText(p==='PEQUENO'?'Agente de pequeno porte':'Agente de médio/grande porte');
    await page.locator('a[href*="aba=bloco-2"]').first().click();
    for(const id of ['PRIVA-RH-001','PRIVA-MARKETING-001','PRIVA-RECEPCAO-001']){
      const cell=page.getByTestId(`ciclo-${id}`);
      if(p==='PEQUENO') await expect(cell).toContainText('Res. CD/ANPD nº 2/2022');
      else await expect(cell).not.toContainText('Res. CD/ANPD nº 2/2022');
    }
    await page.getByRole('button',{name:'Ver documento',exact:true}).click();
    const doc=page.getByRole('dialog');
    if(p==='PEQUENO') await expect(doc).toContainText('Res. CD/ANPD nº 2/2022');
    else await expect(doc).not.toContainText('Res. CD/ANPD nº 2/2022');
    await page.keyboard.press('Escape');
    await page.locator('a[href*="aba=bloco-4"]').first().click();
    await expect(page.getByTestId('prazo-porte')).toContainText(`Prazo legal aplicável: ${p==='PEQUENO'?6:3} dias úteis`);
    await expect(page.getByTestId('prazo-porte')).toContainText('art. 6º, § 8º');
    await page.locator('a[href*="aba=bloco-1"]').first().click();
  }
  expect(writes).toEqual([]);
});