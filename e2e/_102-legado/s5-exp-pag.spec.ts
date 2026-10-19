import { test } from '@playwright/test';
import { login, useFarm, headerFarm, setSel, rec, shot, fillExp, submitExp, dumpForm, listRows, stateAdd, stateGet, msgs, swalText, invalidos } from './lib';

async function acha(page: any, num: string) {
  await page.goto(`/expenses?number=${encodeURIComponent(num)}&pagination_quantity=50`); await page.waitForLoadState('networkidle');
  const rows = await listRows(page);
  return rows.filter((r: any) => r.cells.some((x: string) => x === num));
}
const PAG: { id: string; e: any; nota: string }[] = [
  { id: 'C01', e: { amount: '100,00', pay: '1' }, nota: 'a vista Indireta' },
  { id: 'C02', e: { amount: '300,00', pay: '2', parc: { qtd: '3', primeira: '20/11/2026' } }, nota: '3x Indireta' },
  { id: 'C03', e: { amount: '1200,00', pay: '2', parc: { qtd: '6', primeira: '05/11/2026', intervalo: '15' } }, nota: '6x a cada 15 dias' },
  { id: 'C04', e: { amount: '1000,00', pay: '2', parc: { qtd: '2', primeira: '30/11/2026', entrada: '100,00', dataEntrada: '16/10/2026' } }, nota: '2x com entrada 100' },
  { id: 'C05', e: { amount: '99,99', pay: '2', parc: { qtd: '12', primeira: '10/11/2026' } }, nota: '12x arredondamento' },
  { id: 'C06', e: { amount: '400,00', pay: '2', parc: { qtd: '4', primeira: '12/11/2026' }, aprop: '1', apropType: '2', pec: { area: '156', batch: 0, op: 9, act: 0 } }, nota: '4x Pecuaria direta' },
  { id: 'C07', e: { amount: '200,00', pay: '2', parc: { qtd: '2', primeira: '12/11/2026' }, aprop: '1', apropType: '4', man: { equip: 0, hor: '125' } }, nota: '2x Manutencao' },
  { id: 'C08', e: { amount: '150,00', pay: '1', aprop: '1', apropType: '2', pec: { area: '1436', batch: 1, op: 10, act: 0 } }, nota: 'a vista Pecuaria' },
  { id: 'C09', e: { amount: '180,00', pay: '1', aprop: '1', apropType: '4', man: { equip: 1, hor: '5' } }, nota: 'a vista Manutencao' },
  { id: 'C10', e: { amount: '100,00', pay: '2', parc: { qtd: '3', primeira: '25/11/2026' } }, nota: '3x de 100 (33,33)' },
  { id: 'C11', e: { amount: '50,00', pay: '2', parc: { qtd: '1', primeira: '25/11/2026' } }, nota: '1x parcelado' },
];
test('E12 - parcelado e a vista (cenarios 10/11)', async ({ page }) => {
  test.setTimeout(3_000_000);
  await login(page); await useFarm(page, '294');
  let k = 0;
  for (const c of PAG) {
    k++; if (process.env.ONLY && !process.env.ONLY.split(',').includes(c.id)) continue; const caso = 'E12-' + c.id; const obs: any = {}; const num = `QA102L-${caso}`;
    const farm = c.e.pec ? '80' : '294';
    try {
      obs.fazendaSessao = await useFarm(page, farm);
      const e = { number: num, fornecedor: 40 + k, nota: `QA102L ${caso} ${c.nota}`, ...c.e };
      const f = await fillExp(page, e); obs.preenchido = f;
      if (['C02', 'C04'].includes(c.id)) await shot(page, `796-E12-${c.id}-legado-parcelado-preenchido`);
      const r = await submitExp(page); obs.salvar = r;
      const g = await acha(page, num); obs.titulosNaLista = g.length; obs.linhas = g.map((x: any) => x.cells.slice(1, 12).join(' | '));
      if (c.id === 'C02' || c.id === 'C04') await shot(page, `796-E12-${c.id}-legado-lista-titulos`);
      if (g[0]?.edit) stateAdd('exps', { caso, num, tipo: 'pag', edit: g[0].edit, n: g.length });
    } catch (er: any) { obs.ERRO = String(er).slice(0, 300); try { await shot(page, `796-E12-${c.id}-legado-ERRO`); } catch {} }
    rec({ cenario: '10/11', caso, entrada: { ...c.e, nota: c.nota }, observado: obs });
  }
});

test('E13 - editar trocando tipo de apropriacao (cenarios 10/11)', async ({ page }) => {
  test.setTimeout(3_000_000);
  await login(page);
  const lista = stateGet().exps.filter((x: any) => x.edit && ['pec', 'man', 'pag'].includes(x.tipo));
  const trocas: [string, string][] = [['2', '4'], ['4', '2'], ['2', '3'], ['4', '3'], ['2', ''], ['4', ''], ['', '2'], ['', '4'], ['3', '2'], ['2', '2'], ['4', '4']];
  let i = 0;
  for (const x of lista.slice(0, 12)) {
    const [de, para] = trocas[i % trocas.length]; i++;
    const caso = `E13-${String(i).padStart(2, '0')}`; const obs: any = {};
    try {
      await useFarm(page, x.tipo === 'pec' ? '80' : (x.caso.includes('C06') || x.caso.includes('C08') ? '80' : '294'));
      await page.goto(x.edit); await page.waitForLoadState('networkidle'); await page.waitForTimeout(1200);
      obs.titulo = x.num; obs.tipoOriginal = await page.evaluate(() => ({ aprop: (document.getElementById('inp-appropriation') as HTMLSelectElement)?.value, tipo: (document.getElementById('inp-appropriation_type') as HTMLSelectElement)?.selectedOptions[0]?.text }));
      obs.antes = await page.evaluate(() => ({ pec: !!(document.getElementById('section-pecuaria') as any)?.offsetParent, man: !!(document.getElementById('section-manutencao') as any)?.offsetParent, geral: !!(document.getElementById('section-appropriation') as any)?.offsetParent }));
      const novoAprop = para === '' ? '2' : '1';
      await setSel(page, 'inp-appropriation', novoAprop);
      if (para) await setSel(page, 'inp-appropriation_type', para);
      obs.novaSelecao = { aprop: novoAprop, tipo: para || '(indireta)' };
      obs.depois = await page.evaluate(() => ({ pec: !!(document.getElementById('section-pecuaria') as any)?.offsetParent, man: !!(document.getElementById('section-manutencao') as any)?.offsetParent, geral: !!(document.getElementById('section-appropriation') as any)?.offsetParent, tipoOpcao: (document.getElementById('inp-appropriation_type') as HTMLSelectElement)?.selectedOptions[0]?.text }));
      if (i <= 3) await shot(page, `796-E13-${i}-legado-troca-tipo-antes-salvar`);
      const r = await submitExp(page); obs.salvar = r;
      if (i <= 3) await shot(page, `796-E13-${i}-legado-troca-tipo-apos-salvar`);
    } catch (er: any) { obs.ERRO = String(er).slice(0, 300); }
    rec({ cenario: '10/11', caso, entrada: { titulo: x.num, de, para }, observado: obs });
  }
});
