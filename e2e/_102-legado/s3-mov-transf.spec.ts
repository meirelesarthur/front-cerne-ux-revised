import { test } from '@playwright/test';
import { login, useFarm, FARM_MTZ, fillMov, movState, rec, shot, submitMov, listRows, listaFiltrada, deleteFromRow, stateAdd, stateGet, dumpForm, fillMoney, setSel, setDate, msgs, swalText, closeSwal, headerFarm, Mov } from './lib';
test.beforeEach(async ({ page }) => { await login(page); await useFarm(page, FARM_MTZ); });

const T = (o: Partial<Mov>): Mov => ({ tipo: 'S', tp: 'T', conta: '295', valor: '10,00', rateio: [{ term: 'mov', centro: '761' }], ...o } as Mov);
const casos: { id: string; m: Mov; nota: string }[] = [
  { id: 'C01', m: T({ destino: '293', valor: '10,00', data: '15/10/2026' }), nota: 'S BRAD->XP inteiro' },
  { id: 'C02', m: T({ destino: '294', valor: '25,50', prop: '230', data: '15/10/2026' }), nota: 'S BRAD->SICO centavos prop 230' },
  { id: 'C03', m: { ...T({ conta: '293', destino: '295', valor: '12,34', data: '15/10/2026' }), tipo: 'E' } as Mov, nota: 'E XP (recebe) <- BRAD (origem)' },
  { id: 'C04', m: T({ destino: '288', valor: '0,01', data: '15/10/2026' }), nota: 'S BRAD->CEF 1 centavo' },
  { id: 'C05', m: T({ conta: '293', destino: '295', valor: '5,00', data: '15/10/2026' }), nota: 'S XP->BRAD' },
  { id: 'C06', m: T({ conta: '404', destino: '295', valor: '100,00', data: '15/10/2026' }), nota: 'S CXF->BRAD (saldo baixo)' },
  { id: 'C07', m: T({ destino: '295', valor: '10,00', data: '15/10/2026' }), nota: 'S BRAD->BRAD mesma conta' },
  { id: 'C08', m: { ...T({ conta: '294', destino: '295', valor: '33,33', data: '15/10/2026' }), tipo: 'E' } as Mov, nota: 'E SICO <- BRAD' },
  { id: 'C09', m: T({ destino: '1171', valor: '7,77', data: '01/09/2026' }), nota: 'S BRAD->LS data passada' },
  { id: 'C10', m: T({ destino: '1172', valor: '9,99', juros: '1,00', data: '15/10/2026' }), nota: 'S BRAD->SANT com juros' },
  { id: 'C11', m: T({ destino: '288', valor: '20,00', data: '15/10/2026', rateio: [{ term: 'mov', valor: '10,00', centro: '761' }, { term: 'mov', valor: '10,00', centro: '761' }] }), nota: 'S BRAD->CEF 2 linhas de rateio' },
  { id: 'C12', m: T({ destino: '293', valor: '5000000,00', data: '15/10/2026' }), nota: 'S BRAD->XP valor acima do saldo' },
  { id: 'C13', m: T({ valor: '8,00', data: '15/10/2026' }), nota: 'S sem conta destino' },
];

test('E5a - criar Transferencia Interna (cenario 5)', async ({ page }) => {
  test.setTimeout(3_000_000);
  for (const c of casos) {
    const obs: any = {}; const caso = 'E5-' + c.id; const m = { ...c.m, nota: `QA102L ${caso} ${c.nota}` };
    try {
      obs.fazenda = await headerFarm(page);
      const f = await fillMov(page, m); obs.preenchido = f; obs.estado = await movState(page);
      if (c.id === 'C01' || c.id === 'C03') await shot(page, `796-E5-${c.id}-legado-form`);
      const r = await submitMov(page); obs.salvar = r;
      const gravou = r.url.endsWith('/movements');
      const dia = m.data!;
      if (gravou) {
        const l = await listaFiltrada(page, `start_date=${dia}&end_date=${dia}&pagination_quantity=200`);
        const cod = Number(f.codigo);
        obs.linhasNaLista = l.rows.filter(x => [String(cod), String(cod + 1), String(cod - 1)].includes(x.cells[1])).map(x => x.cells.slice(1, 12).join(' | '));
        obs.codigoPrincipal = f.codigo;
        if (c.id === 'C01' || c.id === 'C03' || c.id === 'C11') await shot(page, `796-E5-${c.id}-legado-lista`);
      } else if (c.id !== 'C01') await shot(page, `796-E5-${c.id}-legado-resultado`);
      stateAdd('transf', { caso, codigo: f.codigo, gravou, dia, valor: m.valor, tipo: m.tipo, conta: m.conta, destino: m.destino });
    } catch (e: any) { obs.ERRO = String(e).slice(0, 300); try { await shot(page, `796-E5-${c.id}-legado-ERRO`); } catch {} }
    rec({ cenario: 5, caso, entrada: m, observado: obs });
  }
});

test('E5b - editar pela linha principal/espelho e excluir (cenario 5)', async ({ page }) => {
  test.setTimeout(3_000_000);
  const st = stateGet().transf.filter((t: any) => t.gravou);
  let n = 0;
  for (const t of st) {
    n++; const caso = `E5b-${t.caso.replace('E5-', '')}`; const obs: any = {};
    try {
      const l = await listaFiltrada(page, `start_date=${t.dia}&end_date=${t.dia}&pagination_quantity=200`);
      const cod = Number(t.codigo);
      const pares = l.rows.filter(x => [String(cod), String(cod + 1), String(cod - 1)].includes(x.cells[1]));
      obs.linhasAntes = pares.map(x => x.cells.slice(1, 12).join(' | '));
      // editar: usa a 1a linha (principal) nas casas pares e a 2a (espelho) nas impares
      const alvo = pares[(n % 2 === 0 || pares.length < 2) ? 0 : pares.length - 1];
      if (alvo?.edit) {
        await page.goto(alvo.edit); await page.waitForLoadState('networkidle'); await page.waitForTimeout(800);
        obs.editarPorLinha = (n % 2 === 0 || pares.length < 2) ? 'principal' : 'espelho/ultima';
        obs.formEdicao = await dumpForm(page, '#form-movements');
        obs.estadoEdicao = await movState(page);
        if (n <= 3) await shot(page, `796-E5b-${t.caso}-legado-edicao`);
        await fillMoney(page, '#inp-value', '3,33');
        const r = await submitMov(page); obs.salvarEdicao = r;
        const l2 = await listaFiltrada(page, `start_date=${t.dia}&end_date=${t.dia}&pagination_quantity=200`);
        obs.linhasAposEditar = l2.rows.filter(x => [String(cod), String(cod + 1), String(cod - 1)].includes(x.cells[1])).map(x => x.cells.slice(1, 12).join(' | '));
      } else obs.editarPorLinha = 'sem linha encontrada';
      // excluir
      const l3 = await listaFiltrada(page, `start_date=${t.dia}&end_date=${t.dia}&pagination_quantity=200`);
      const idxs = l3.rows.map((x, i) => ({ x, i })).filter(o => [String(cod), String(cod + 1), String(cod - 1)].includes(o.x.cells[1]));
      if (idxs.length) {
        const pick = (n % 2 === 0) ? idxs[idxs.length - 1] : idxs[0];
        obs.excluirPelaLinha = pick.x.cells[1] + ((n % 2 === 0) ? ' (espelho/ultima)' : ' (principal/primeira)');
        const d = await deleteFromRow(page, pick.i); obs.exclusao = d;
        const l4 = await listaFiltrada(page, `start_date=${t.dia}&end_date=${t.dia}&pagination_quantity=200`);
        obs.linhasAposExcluir = l4.rows.filter(x => [String(cod), String(cod + 1), String(cod - 1)].includes(x.cells[1])).map(x => x.cells.slice(1, 12).join(' | '));
        if (n <= 3) await shot(page, `796-E5b-${t.caso}-legado-apos-excluir`);
      } else obs.excluir = 'linha nao encontrada (talvez ja excluida)';
    } catch (e: any) { obs.ERRO = String(e).slice(0, 300); }
    rec({ cenario: 5, caso, entrada: { de: t.caso, codigo: t.codigo, valor: t.valor }, observado: obs });
  }
});
