import { test } from '@playwright/test';
import { login, useFarm, FARM_MTZ, fillMov, movState, rec, shot, submitMov, fillExp, dumpForm, autoFillRequired, selRow, setCentro, stateAdd, msgs, swalText, headerFarm, Mov, invalidos } from './lib';

test.beforeEach(async ({ page }) => { await login(page); await useFarm(page, FARM_MTZ); });

type C = { id: string; m: Mov; draft?: boolean; nota: string };
const base = (o: Partial<Mov>): Mov => ({ tipo: 'E', tp: 'F', conta: '295', valor: '100,00', ...o } as Mov);
const casosE: C[] = [
  { id: 'C01', m: base({ valor: '1000,00', fornecedor: 3, prop: '189', data: '15/10/2026' }), draft: true, nota: 'inteiro, BRAD' },
  { id: 'C02', m: base({ valor: '2500,50', juros: '150,25', fornecedor: 7, prop: '230', conta: '293', data: '10/10/2026' }), draft: true, nota: 'centavos + juros, XP, prop 230' },
  { id: 'C03', m: base({ valor: '0,01', fornecedor: 12, conta: '294' }), nota: '1 centavo, SICO' },
  { id: 'C04', m: base({ valor: '12345678,90', fornecedor: 20, conta: '294', prop: '230' }), draft: true, nota: 'valor grande' },
  { id: 'C05', m: base({ valor: '500,00', fornecedor: 33, conta: '1172', rateio: [{ term: 'emp', valor: '300,00', centro: '761' }, { term: 'jur', valor: '200,00', centro: '761' }] }), draft: true, nota: '2 linhas de rateio, SANT' },
  { id: 'C06', m: base({ valor: '300,00', conta: '295' }), nota: 'sem fornecedor' },
  { id: 'C07', m: base({ valor: '750,00', fornecedor: 50, farm: '297', conta: '288' }), nota: 'com Fazenda do movimento = Santa Marta, CEF' },
  { id: 'C08', m: base({ valor: '750,00', fornecedor: 60, data: '01/01/2026', conta: '295' }), draft: true, nota: 'data passada' },
  { id: 'C09', m: base({ valor: '3000,00', fornecedor: 100, prop: '230', conta: '288', doc: 'DOC-QA102L-09', fiscal: '0' }), draft: true, nota: 'documento + dedutivel Nao' },
  { id: 'C10', m: base({ valor: '100,00', fornecedor: 150, conta: '404' }), nota: 'Caixa Fazenda' },
  { id: 'C11', m: base({ valor: '888,88', juros: '88,88', fornecedor: 200, conta: '1171', data: '14/10/2026' }), draft: true, nota: 'juros, LS Interbank' },
  { id: 'C12', m: base({ valor: '60,00', fornecedor: 300, conta: '357' }), nota: 'conta VOLN (baixa sem movimentacao)' },
];

async function run(page: any, cenario: number, prefix: string, casos0: C[], tipo: 'E' | 'S') {
  const casos = process.env.DRAFT_ONLY ? casos0.filter(x => x.draft) : casos0;
  for (const c of casos) {
    const caso = `${prefix}-${c.id}`;
    const obs: any = {};
    const m: Mov = { ...c.m, tipo, nota: `QA102L ${caso} ${c.nota}` };
    try {
      obs.fazenda = await headerFarm(page);
      const f = await fillMov(page, m); obs.preenchido = f;
      obs.estadoAntesSalvar = await movState(page);
      const codigo = f.codigo;
      if (c.id === 'C01' || c.id === 'C02') await shot(page, `796-${prefix}-${c.id}-legado-form-antes-salvar`);
      const r = await submitMov(page); obs.salvar = r;
      if (/\/(expenses|incomes)\/create/.test(r.url)) {
        obs.redirecionouPara = new URL(r.url).pathname;
        obs.preenchimentoDestino = await dumpForm(page, tipo === 'E' ? '#form-expense' : 'form[method=post]:has(input[name=movement_id])');
        obs.movementIdOculto = await page.evaluate(() => (document.querySelector('input[name=movement_id]') as any)?.value);
        obs.rateioDestino = await page.evaluate(() => [...(document.querySelectorAll('table.table-dynamic')[0] as HTMLElement).querySelectorAll('tbody tr')].map(r => ({ cat: (r.querySelector('select.select-categories') as any)?.selectedOptions[0]?.text || '', valor: (r.querySelector('.category-values') as any)?.value, pct: (r.querySelector('.category-percents') as any)?.value })));
        if (c.id === 'C01' || c.id === 'C02') await shot(page, `796-${prefix}-${c.id}-legado-destino-prefill`);
        stateAdd('movs', { caso, codigo, tipo, valor: m.valor, dia: m.data || '15/10/2026', conta: m.conta, destino: obs.redirecionouPara, titulo: null });
        if (c.draft) {
          const num = `QA102L-${caso}`;
          const formSel = tipo === 'E' ? '#form-expense' : 'form:has(input[name=movement_id])';
          await autoFillRequired(page, formSel, num);
          const nm = await page.evaluate(() => (document.querySelector('[name=number]') as any)?.value); if (!nm) await page.fill('[name=number]', num).catch(() => {});
          // categoria + centro das linhas do rateio
          const n = await page.locator('table.table-dynamic:visible tbody tr').count();
          for (let i = 0; i < n; i++) { await selRow(page, i, tipo === 'E' ? 'emp' : 'emp', 0); await setCentro(page.locator('table.table-dynamic:visible tbody tr').nth(i), '761'); }
          await autoFillRequired(page, formSel, num);
          const r2 = await page.locator(`${formSel} button[type=submit]`).last().click().then(async () => { await page.waitForTimeout(2500); await page.waitForLoadState('networkidle').catch(() => {}); return { url: page.url(), swal: await swalText(page), msgs: (await msgs(page)).filter((x: string) => !x.includes('Creditares')), invalidos: await invalidos(page) }; });
          obs.salvarRascunho = r2; obs.numeroTitulo = num;
          stateAdd('exps', { caso, codigo, num, tipo, dia: m.data || '15/10/2026', conta: m.conta, valor: m.valor, resultado: r2.msgs, url: r2.url });
          if (c.id === 'C01') await shot(page, `796-${prefix}-${c.id}-legado-titulo-salvo`);
        }
      } else {
        if (c.id !== 'C01') await shot(page, `796-${prefix}-${c.id}-legado-resultado`);
        stateAdd('movs', { caso, codigo, tipo, valor: m.valor, dia: m.data || '15/10/2026', conta: m.conta, destino: new URL(r.url).pathname, gravou: r.url.endsWith('/movements') });
      }
    } catch (e: any) { obs.ERRO = String(e).slice(0, 300); try { await shot(page, `796-${prefix}-${c.id}-legado-ERRO`); } catch {} }
    rec({ cenario, caso, entrada: { ...m, nota: m.nota }, observado: obs });
  }
}
test('E2 - Entrada + Financiamento (cenario 2)', async ({ page }) => { test.setTimeout(3_000_000); await run(page, 2, 'E2', casosE, 'E'); });

const casosS: C[] = [
  { id: 'C01', m: base({ valor: '1000,00', cliente: 2, prop: '189', data: '15/10/2026' }), draft: true, nota: 'inteiro, BRAD' },
  { id: 'C02', m: base({ valor: '2500,50', juros: '10,10', cliente: 9, prop: '230', data: '10/10/2026' }), draft: true, nota: 'centavos + juros' },
  { id: 'C03', m: base({ valor: '0,01', cliente: 15 }), nota: '1 centavo' },
  { id: 'C04', m: base({ valor: '40,00', cliente: 20, conta: '404' }), nota: 'Caixa Fazenda (saldo baixo)' },
  { id: 'C05', m: base({ valor: '500,00', cliente: 30, rateio: [{ term: 'emp', valor: '250,00', centro: '761' }, { term: 'jur', valor: '250,00', centro: '761' }] }), draft: true, nota: '2 linhas de rateio' },
  { id: 'C06', m: base({ valor: '300,00' }), nota: 'sem cliente' },
  { id: 'C07', m: base({ valor: '99999,99', cliente: 40, conta: '293' }), draft: true, nota: 'valor alto, XP' },
  { id: 'C08', m: base({ valor: '750,00', cliente: 50, data: '01/01/2026' }), draft: true, nota: 'data passada' },
  { id: 'C09', m: base({ valor: '1200,00', cliente: 60, doc: 'DOC-QA102L-S09', fiscal: '0' }), draft: true, nota: 'documento + dedutivel Nao' },
  { id: 'C10', m: base({ valor: '5000000,00', cliente: 70 }), nota: 'valor acima do saldo' },
  { id: 'C11', m: base({ valor: '20,00', cliente: 80, conta: '1172' }), nota: 'SANT' },
  { id: 'C12', m: base({ valor: '10,00', cliente: 90, conta: '357' }), nota: 'VOLN' },
];
test('E3 - Saida + Financiamento (cenario 3)', async ({ page }) => { test.setTimeout(3_000_000); await run(page, 3, 'E3', casosS, 'S'); });
