import { test } from '@playwright/test';
import { login, useFarm, FARM_MTZ, rec, shot, setSel, pickSelect2Ajax } from './lib';
test('E7b - filtro Tipo Cat + Categoria pela UI (cenario 7)', async ({ page }) => {
  test.setTimeout(900000);
  await login(page); await useFarm(page, FARM_MTZ);
  const casos: [string, string, string][] = [['U01', 'S', 'sal'], ['U02', 'E', 'ven'], ['U03', 'T', 'mov'], ['U04', 'F', 'emp'], ['U05', 'S', 'adu'], ['U06', 'E', 'jur'], ['U07', 'T', 'sal'], ['U08', 'F', 'jur'], ['U09', 'S', 'tra'], ['U10', 'E', 'rec']];
  for (const [id, tp, term] of casos) {
    const obs: any = {};
    try {
      await page.goto('/movements?start_date=01/10/2026&end_date=31/10/2026&pagination_quantity=200'); await page.waitForLoadState('networkidle');
      const totalSem = await page.evaluate(() => document.querySelector('table caption')?.textContent?.trim());
      await setSel(page, 'inp-type_category', tp); await page.waitForTimeout(600);
      obs.categoriaHabilitada = await page.evaluate(() => !document.getElementById('select-category')?.hasAttribute('readonly'));
      obs.categoriaEscolhida = await pickSelect2Ajax(page, '#select-category', term, 0);
      await page.locator('form[method=get] button[type=submit]').first().click(); await page.waitForLoadState('networkidle'); await page.waitForTimeout(800);
      obs.url = decodeURIComponent(page.url().replace('http://localhost:8081', '')).replace(/&(account|proprietary_id|harvest_id|start_value|end_value)=(?=&|$)/g, '');
      obs.captionSemFiltro = totalSem; obs.captionComFiltro = await page.evaluate(() => document.querySelector('table caption')?.textContent?.trim());
      obs.tipoCatMantido = await page.evaluate(() => (document.getElementById('inp-type_category') as HTMLSelectElement).value);
      obs.categoriaMantida = await page.evaluate(() => (document.getElementById('select-category') as HTMLSelectElement).selectedOptions[0]?.text || '(vazia)');
      obs.rodape = await page.evaluate(() => [...document.querySelectorAll('table tbody tr')].filter(r => /^total/i.test((r as HTMLElement).innerText.trim())).map(r => (r as HTMLElement).innerText.trim().replace(/\s+/g, ' ')));
      if (['U01', 'U03'].includes(id)) await shot(page, `796-E7-${id}-legado-filtro-ui`);
    } catch (e: any) { obs.ERRO = String(e).slice(0, 300); }
    rec({ cenario: 7, caso: 'E7-' + id, entrada: { tipoCat: tp, busca: term }, observado: obs });
  }
});
