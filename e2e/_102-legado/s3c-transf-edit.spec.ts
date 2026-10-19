import { test } from '@playwright/test';
import { login, useFarm, FARM_MTZ, fillMov, rec, shot, submitMov, listaFiltrada, deleteFromRow, dumpForm, fillMoney, movState, headerFarm, Mov } from './lib';
test.beforeEach(async ({ page }) => { await login(page); await useFarm(page, FARM_MTZ); });
const T = (o: Partial<Mov>): Mov => ({ tipo: 'S', tp: 'T', conta: '295', valor: '10,00', data: '15/10/2026', rateio: [{ term: 'mov', centro: '761' }], ...o } as Mov);
const casos: { id: string; m: Mov; via: 'principal' | 'espelho'; acao: 'editar' | 'excluir' | 'ambos' }[] = [
  { id: 'C01', m: T({ destino: '293', valor: '11,00' }), via: 'principal', acao: 'ambos' },
  { id: 'C02', m: T({ destino: '294', valor: '12,25' }), via: 'espelho', acao: 'ambos' },
  { id: 'C03', m: { ...T({ conta: '293', destino: '295', valor: '13,00' }), tipo: 'E' } as Mov, via: 'principal', acao: 'ambos' },
  { id: 'C04', m: { ...T({ conta: '294', destino: '295', valor: '14,40' }), tipo: 'E' } as Mov, via: 'espelho', acao: 'ambos' },
  { id: 'C05', m: T({ destino: '288', valor: '15,00' }), via: 'principal', acao: 'editar' },
  { id: 'C06', m: T({ destino: '1171', valor: '16,60' }), via: 'espelho', acao: 'editar' },
  { id: 'C07', m: T({ destino: '1172', valor: '17,00', prop: '230' }), via: 'principal', acao: 'excluir' },
  { id: 'C08', m: T({ destino: '293', valor: '18,18' }), via: 'espelho', acao: 'excluir' },
  { id: 'C09', m: T({ destino: '294', valor: '19,00', data: '14/10/2026' }), via: 'principal', acao: 'ambos' },
  { id: 'C10', m: T({ destino: '288', valor: '20,20', data: '14/10/2026' }), via: 'espelho', acao: 'ambos' },
  { id: 'C11', m: T({ destino: '293', valor: '21,00' }), via: 'principal', acao: 'excluir' },
];
test('E5c - Transferencia: editar/excluir pela linha principal e espelho, exatos (cenario 5)', async ({ page }) => {
  test.setTimeout(3_000_000);
  for (const c of casos) {
    const caso = 'E5c-' + c.id; const obs: any = {}; const m = { ...c.m, nota: `QA102L ${caso}` };
    try {
      const f = await fillMov(page, m); const cod = f.codigo; obs.codigo = cod;
      const r = await submitMov(page); obs.criar = { msgs: r.msgs, url: r.url.replace('http://localhost:8081', '') };
      const q = `start_date=${m.data}&end_date=${m.data}&pagination_quantity=200`;
      let l = await listaFiltrada(page, q);
      const par = l.rows.map((x: any, i: number) => ({ x, i })).filter((o: any) => o.x.cells[1] === cod);
      obs.linhasCriadas = par.map((o: any) => o.x.cells.slice(1, 12).join(' | '));
      if (!par.length) { rec({ cenario: 5, caso, entrada: m, observado: obs }); continue; }
      const alvoLinha = c.via === 'principal' ? par[0] : par[par.length - 1];
      obs.linhaUsada = `${c.via}: ${alvoLinha.x.cells[4]} ${alvoLinha.x.cells[8]}`;
      if (c.acao !== 'excluir') {
        await page.goto(alvoLinha.x.edit); await page.waitForLoadState('networkidle'); await page.waitForTimeout(800);
        obs.edicao = { form: await dumpForm(page, '#form-movements'), estado: await movState(page) };
        if (['C01', 'C02'].includes(c.id)) await shot(page, `796-E5c-${c.id}-legado-edicao-${c.via}`);
        await fillMoney(page, '#inp-value', '3,33');
        const rr = await submitMov(page); obs.salvarEdicao = { msgs: rr.msgs, url: rr.url.replace('http://localhost:8081', ''), swal: rr.swal };
        l = await listaFiltrada(page, q);
        obs.linhasAposEditar = l.rows.filter((x: any) => x.cells[1] === cod).map((x: any) => x.cells.slice(1, 12).join(' | '));
        if (['C01', 'C02'].includes(c.id)) await shot(page, `796-E5c-${c.id}-legado-lista-apos-editar`);
      }
      if (c.acao !== 'editar') {
        l = await listaFiltrada(page, q);
        const p2 = l.rows.map((x: any, i: number) => ({ x, i })).filter((o: any) => o.x.cells[1] === cod);
        if (p2.length) {
          const tgt = c.via === 'principal' ? p2[0] : p2[p2.length - 1];
          const d = await deleteFromRow(page, tgt.i); obs.exclusao = { via: c.via, ...d };
          if (['C01', 'C02'].includes(c.id)) await shot(page, `796-E5c-${c.id}-legado-apos-excluir-${c.via}`);
          l = await listaFiltrada(page, q);
          obs.linhasAposExcluir = l.rows.filter((x: any) => x.cells[1] === cod).map((x: any) => x.cells.slice(1, 12).join(' | '));
        } else obs.exclusao = 'linha nao encontrada';
      }
    } catch (e: any) { obs.ERRO = String(e).slice(0, 300); }
    rec({ cenario: 5, caso, entrada: { ...m, via: c.via, acao: c.acao }, observado: obs });
  }
});
