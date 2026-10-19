import { test } from '@playwright/test';
import { login, useFarm, FARM_MTZ, rec, shot, listaFiltrada } from './lib';
test('E7c - saldo inicial na lista (cenario 7)', async ({ page }) => {
  test.setTimeout(600000);
  await login(page); await useFarm(page, FARM_MTZ);
  const casos: [string, string, string][] = [
    ['C19', 'start_date=01/01/2000&end_date=31/12/2026&type_category=T&category=600&pagination_quantity=200', 'Tipo Cat T + categoria Saldo Inicial (600), todo o historico'],
    ['C20', 'start_date=01/01/2000&end_date=31/12/2026&type_category=T&category=600&account=295&pagination_quantity=200', 'idem, conta BRAD'],
    ['C21', 'start_date=01/01/2000&end_date=31/12/2026&type_category=T&category=600&account=294&pagination_quantity=200', 'idem, conta SICO'],
    ['C22', 'start_date=01/01/2000&end_date=31/12/2026&type_category=T&category=599&pagination_quantity=10', 'Mov. entre contas (599) todo historico, 10/pag'],
  ];
  for (const [id, qs, nota] of casos) {
    const obs: any = {};
    try {
      const l = await listaFiltrada(page, qs);
      obs.caption = l.caption; obs.rodape = l.foot; obs.linhas = l.rows.filter((r: any) => r.cells[1] && /^\d+$/.test(r.cells[1])).length;
      obs.primeiras = l.rows.filter((r: any) => r.cells[1] && /^\d+$/.test(r.cells[1])).slice(0, 5).map((r: any) => r.cells.slice(1, 12).join(' | '));
      if (id === 'C19') await shot(page, `796-E7-${id}-legado-saldo-inicial`);
    } catch (e: any) { obs.ERRO = String(e).slice(0, 200); }
    rec({ cenario: 7, caso: 'E7-' + id, entrada: { query: qs, descricao: nota }, observado: obs });
  }
});
