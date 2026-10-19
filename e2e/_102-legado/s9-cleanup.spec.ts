import { test } from '@playwright/test';
import fs from 'fs';
import { login, useFarm, FARM_MTZ, rec, shot, listRows, listaFiltrada, deleteFromRow, swalText, msgs, EVID } from './lib';

function codigos(): Set<string> {
  const s = new Set<string>(['13501', '13502']);
  for (const l of fs.readFileSync(EVID + '/casos.jsonl', 'utf8').split('\n').filter(Boolean)) {
    const d = JSON.parse(l); const o = d.observado || {};
    if (o.preenchido?.codigo) s.add(String(o.preenchido.codigo)); if (o.codigo) s.add(String(o.codigo));
  }
  return s;
}
test('E99 - limpeza dos dados QA102L (so o que este spec criou)', async ({ page }) => {
  test.setTimeout(3_000_000);
  await login(page); await useFarm(page, FARM_MTZ);
  const meus = codigos(); const log: any = { movimentosExcluidos: 0, titulosExcluidos: 0, falhas: [] as string[] };
  // 1) titulos QA102L (contas a pagar/receber) - antes dos movimentos, p/ nao deixar orfaos
  for (const [farm, base] of [[FARM_MTZ, 'expenses'], [FARM_MTZ, 'incomes'], ['80', 'expenses']] as [string, string][]) {
    await useFarm(page, farm);
    let fails = 0;
    for (let pass = 0; pass < 80; pass++) {
      await page.goto(`/${base}?number=QA102L&pagination_quantity=100`); await page.waitForLoadState('networkidle');
      const rows = await listRows(page);
      const idx = rows.findIndex((r: any) => r.cells.some((x: string) => x.startsWith('QA102L')));
      if (idx < 0) break;
      const row = page.locator('table tbody tr').nth(idx);
      if (pass === 0) await shot(page, `796-E99-lista-${base}-${farm}-antes-limpeza`);
      try {
        await row.locator('a[data-toggle=dropdown]').first().click(); await page.waitForTimeout(300);
        if (pass === 0) log['menu_' + base + '_' + farm] = await row.locator('.dropdown-menu').innerText().catch(() => '');
        const del = row.locator('button.btn-delete, a.btn-delete, .dropdown-item:has-text("Excluir")').first();
        await del.evaluate((e: any) => e.click()); await page.waitForTimeout(800);
        const t = await swalText(page); if (pass === 0) log['confirm_' + base] = t;
        const conf = page.locator('.swal-button--confirm, .swal2-confirm').first(); if (await conf.count()) await conf.click();
        await page.waitForLoadState('networkidle').catch(() => {}); await page.waitForTimeout(1200);
        log.titulosExcluidos++;
      } catch (e: any) { log.falhas.push(`${base}/${farm}: ${String(e).slice(0, 160)}`); if (++fails >= 4) break; }
    }
  }
  // 2) movimentos criados (por codigo) nas datas usadas
  await useFarm(page, FARM_MTZ);
  for (const dia of ['15/10/2026', '14/10/2026', '10/10/2026', '01/01/2026', '01/09/2026']) {
    for (let pass = 0; pass < 120; pass++) {
      const l = await listaFiltrada(page, `start_date=${dia}&end_date=${dia}&pagination_quantity=200`);
      const i = l.rows.findIndex((r: any) => meus.has(r.cells[1]));
      if (i < 0) break;
      try { await deleteFromRow(page, i); log.movimentosExcluidos++; } catch (e: any) { log.falhas.push(`mov ${dia}: ${String(e).slice(0, 120)}`); break; }
    }
    const l2 = await listaFiltrada(page, `start_date=${dia}&end_date=${dia}&pagination_quantity=200`);
    log['restantes_' + dia.replace(/\//g, '-')] = l2.rows.filter((r: any) => meus.has(r.cells[1])).map((r: any) => r.cells.slice(1, 12).join(' | '));
  }
  rec({ cenario: 'limpeza', caso: 'E99', entrada: { codigos: [...meus].length }, observado: log });
});
