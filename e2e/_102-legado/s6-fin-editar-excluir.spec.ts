import { test } from '@playwright/test';
import { login, useFarm, FARM_MTZ, rec, shot, listRows, listaFiltrada, deleteFromRow, stateGet, dumpForm, fillMoney, submitMov, movState, msgs, swalText, headerFarm } from './lib';

async function titulo(page: any, tipo: string, num: string) {
  const base = tipo === 'E' ? 'expenses' : 'incomes';
  await page.goto(`/${base}?number=${encodeURIComponent(num)}&pagination_quantity=50`); await page.waitForLoadState('networkidle');
  const rows = await listRows(page);
  return rows.filter((r: any) => r.cells.some((x: string) => x === num)).map((r: any) => r.cells.slice(1, 11).join(' | '));
}
test('E6 - editar/excluir movimento de Financiamento com titulo gerado (cenario 6)', async ({ page }) => {
  test.setTimeout(3_000_000);
  await login(page); await useFarm(page, FARM_MTZ);
  const lista = (stateGet().exps || []).filter((x: any) => x.num && x.dia && (x.tipo === 'E' || x.tipo === 'S') && (!process.env.TIPO6 || x.tipo === process.env.TIPO6));
  let n = Number(process.env.START6 || 0);
  for (const x of lista) {
    n++; const caso = `E6-${String(n).padStart(2, '0')}`; const obs: any = {};
    try {
      obs.origem = x.caso; obs.tituloAntes = await titulo(page, x.tipo, x.num);
      const l = await listaFiltrada(page, `start_date=${x.dia}&end_date=${x.dia}&pagination_quantity=200`);
      const idx = l.rows.findIndex((r: any) => r.cells[1] === String(x.codigo));
      obs.movNaLista = idx >= 0 ? l.rows[idx].cells.slice(1, 12).join(' | ') : 'NAO ENCONTRADO';
      if (idx < 0) { rec({ cenario: 6, caso, entrada: x, observado: obs }); continue; }
      const edit = l.rows[idx].edit;
      // abre a edicao
      await page.goto(edit); await page.waitForLoadState('networkidle'); await page.waitForTimeout(900);
      obs.mensagensNaEdicao = (await msgs(page)).filter((m: string) => !m.includes('Creditares')); obs.swalEdicao = await swalText(page);
      obs.formEdicao = await dumpForm(page, '#form-movements'); obs.estadoEdicao = await movState(page);
      if (n <= 2) await shot(page, `796-E6-${n}-legado-edicao-mov-com-titulo`);
      // alterna: impares alteram o valor, pares salvam sem alterar
      if (n % 2 === 1) await fillMoney(page, '#inp-value', '11,11');
      const r = await submitMov(page); obs.salvarEdicao = r;
      if (n <= 2) await shot(page, `796-E6-${n}-legado-apos-salvar-edicao`);
      obs.tituloAposEditar = await titulo(page, x.tipo, x.num);
      // excluir
      const l2 = await listaFiltrada(page, `start_date=${x.dia}&end_date=${x.dia}&pagination_quantity=200`);
      const idx2 = l2.rows.findIndex((r2: any) => r2.cells[1] === String(x.codigo));
      obs.movAposEditar = idx2 >= 0 ? l2.rows[idx2].cells.slice(1, 12).join(' | ') : 'sumiu da lista (codigo mudou?)';
      let alvo = idx2;
      if (alvo < 0) { // codigo pode ter mudado na recriacao; procura pelo valor/data/conta
        alvo = l2.rows.findIndex((r2: any) => r2.cells[8] && /E|S/.test(r2.cells[8]) && (r2.cells[10] || '').includes(n % 2 === 1 ? '11,11' : x.valor.replace('.', '')));
      }
      if (alvo >= 0) {
        if (n <= 2) await shot(page, `796-E6-${n}-legado-antes-excluir`);
        const d = await deleteFromRow(page, alvo); obs.exclusao = d;
        if (n <= 2) await shot(page, `796-E6-${n}-legado-apos-excluir`);
        obs.tituloAposExcluir = await titulo(page, x.tipo, x.num);
        const l3 = await listaFiltrada(page, `start_date=${x.dia}&end_date=${x.dia}&pagination_quantity=200`);
        obs.movAposExcluir = l3.rows.some((r3: any) => r3.cells[1] === String(x.codigo)) ? 'ainda na lista' : 'removido da lista';
      } else obs.exclusao = 'linha nao localizada para excluir';
    } catch (e: any) { obs.ERRO = String(e).slice(0, 300); try { await shot(page, `796-E6-${n}-legado-ERRO`); } catch {} }
    rec({ cenario: 6, caso, entrada: { origem: x.caso, codigo: x.codigo, titulo: x.num, valor: x.valor }, observado: obs });
  }
});
