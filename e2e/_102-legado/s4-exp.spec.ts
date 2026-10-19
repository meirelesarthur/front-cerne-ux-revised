import { test } from '@playwright/test';
import { login, useFarm, headerFarm, setSel, rec, shot, fillExp, submitExp, dumpForm, listRows, stateAdd, stateGet, msgs, swalText, invalidos, listaFiltrada } from './lib';

const FARMS: [string, string][] = [['294', 'MTZ'], ['297', 'SANTA MARTA'], ['299', 'BOA VISTA'], ['298', 'ENTRE RIOS'], ['296', 'FORTALEZA'], ['300', 'SAO JOAO'], ['295', 'TOCANTINS'], ['301', 'TRINDADE'], ['366', 'FILIAL MT'], ['80', 'MAIRA']];

test('E9 - Apropriacao Direta: tipos disponiveis (cenario 9)', async ({ page }) => {
  test.setTimeout(900000);
  await login(page);
  let i = 0;
  for (const [fid, nome] of FARMS) {
    i++; const obs: any = {};
    try {
      obs.fazendaSessao = await useFarm(page, fid);
      await page.goto('/expenses/create'); await page.waitForLoadState('networkidle'); await page.waitForTimeout(700);
      const lerTipos = () => page.evaluate(() => { const s = document.getElementById('inp-appropriation_type') as HTMLSelectElement; return { opcoes: [...s.options].map(o => `${o.value || '(vazio)'}=${o.text}${o.disabled ? ' [desabilitada]' : ''}`), valor: s.value, somenteLeitura: s.hasAttribute('readonly') }; });
      obs.inicial = await lerTipos();
      await setSel(page, 'inp-appropriation', '1'); obs.aposDireta = await lerTipos();
      if (i <= 2) await shot(page, `796-E9-${nome.replace(' ', '')}-legado-direta-tipos`);
      await setSel(page, 'inp-appropriation', '2'); obs.aposVoltarIndireta = await lerTipos();
      await setSel(page, 'inp-appropriation', ''); obs.aposVazio = await lerTipos();
      obs.fazendaDoTitulo = await page.evaluate(() => (document.getElementById('inp-farm_id') as HTMLSelectElement).selectedOptions[0]?.text);
    } catch (e: any) { obs.ERRO = String(e).slice(0, 300); }
    rec({ cenario: 9, caso: 'E9-' + nome, entrada: { fazendaSessao: fid + ' ' + nome }, observado: obs });
  }
});

const PEC: { id: string; p: any; nota: string; salvar?: boolean }[] = [
  { id: 'C01', p: { area: '156', batch: 0, animal: 0, op: 9, act: 0 }, nota: 'Area Pasto 03, lote 1, animal 1, Nutricao Animal', salvar: true },
  { id: 'C02', p: { area: '1436', batch: 2, op: 10, act: 1 }, nota: 'Area Pasto 10, lote 3 sem animal, Sanidade', salvar: true },
  { id: 'C03', p: { grazing: '24', batch: 0, animal: 1, op: 9, act: 2 }, nota: 'Modulo 01, lote, animal 2', salvar: true },
  { id: 'C04', p: { grazing: '99', batch: 1, op: 11 }, nota: 'Modulo novo, lote, Reproducao (0 atividades)' },
  { id: 'C05', p: { area: '6645', op: 12, act: 0 }, nota: 'Area sem lotes, Identificacao', salvar: true },
  { id: 'C06', p: { op: 13, act: 0 }, nota: 'sem Area nem Modulo', salvar: true },
  { id: 'C07', p: { area: '2895', batch: 0, op: 14, act: 3 }, nota: 'Area Pasto 15, lote sem animais', salvar: true },
  { id: 'C08', p: { area: '4725', batch: 0, animal: 5, op: 15, act: 0 }, nota: 'Pasto 17 animal 6, Reposicao', salvar: true },
  { id: 'C09', p: { grazing: '26', op: 16, act: 1 }, nota: 'Modulo 02 sem lotes, Construcao', salvar: true },
  { id: 'C10', p: { area: '1435', batch: 0, animal: 0, op: 18, act: 1 }, nota: 'Pasto 09, Transporte', salvar: true },
  { id: 'C11', p: { area: '156', grazing: '24', batch: 0, op: 9, act: 0 }, nota: 'Area E Modulo (exclusao mutua)', salvar: true },
  { id: 'C12', p: { area: '156', batch: 0, animal: 0, op: 9 }, nota: 'sem Atividade (obrigatoria)' },
];
const VALS = ['250,00', '1234,56', '10,00', '99,99', '5000,00', '0,50', '42,42', '300,00', '77,70', '8,08', '123,45', '60,00'];
test('E10 - Pecuaria (cenario 10)', async ({ page }) => {
  test.setTimeout(3_000_000);
  await login(page); await useFarm(page, '80');
  let k = 0;
  for (const c of PEC) {
    const caso = 'E10-' + c.id; const obs: any = {}; const num = `QA102L-${caso}`;
    const e = { number: num, amount: VALS[k++], fornecedor: 5 + k, aprop: '1', apropType: '2', nota: `QA102L ${caso} ${c.nota}`, pec: c.p, venc: `${10 + k}/11/2026` };
    try {
      obs.fazenda = await headerFarm(page);
      const f = await fillExp(page, e); obs.preenchido = f;
      obs.camposVisiveis = await page.evaluate(() => [...document.querySelectorAll('#section-pecuaria select')].map((s: any) => `${s.name}${s.disabled ? '(desab)' : ''}${s.required ? '*' : ''} [${s.options.length - 1} op] sel=${s.selectedOptions[0]?.text.trim() || ''}`));
      if (c.id === 'C01' || c.id === 'C03' || c.id === 'C11') await shot(page, `796-E10-${c.id}-legado-pecuaria-preenchido`);
      const r = await submitExp(page); obs.salvar = r;
      const gravou = /\/expenses$/.test(r.url) || r.msgs.some((m: string) => /sucesso/i.test(m));
      obs.gravou = gravou;
      if (!gravou && c.id !== 'C01') await shot(page, `796-E10-${c.id}-legado-bloqueado`);
      if (gravou) {
        // visualizar e editar
        const l = await listaFiltrada2(page, num);
        obs.linhaLista = l.cells?.slice(1, 12).join(' | '); obs.hrefEditar = l.edit; 
        if (l.edit) {
          await page.goto(l.edit); await page.waitForLoadState('networkidle'); await page.waitForTimeout(1500);
          obs.edicao = { form: await dumpForm(page, '#form-expense'), pecuaria: await page.evaluate(() => [...document.querySelectorAll('#section-pecuaria select')].map((s: any) => `${s.name}${s.disabled ? '(desab)' : ''}=${s.selectedOptions[0]?.text.trim() || ''}`)), secaoVisivel: await page.evaluate(() => !!(document.getElementById('section-pecuaria') as HTMLElement | null)?.offsetParent), tipoApropriacao: await page.evaluate(() => (document.getElementById('inp-appropriation_type') as HTMLSelectElement)?.selectedOptions[0]?.text) };
          if (['C01', 'C03', 'C11'].includes(c.id)) await shot(page, `796-E10-${c.id}-legado-pecuaria-edicao`);
          const view = l.edit.replace('/edit', '');
          await page.goto(view); await page.waitForLoadState('networkidle'); await page.waitForTimeout(800);
          obs.visualizar = await page.evaluate(() => (document.querySelector('.card-body, main, .content') as HTMLElement)?.innerText.replace(/\s+/g, ' ').slice(0, 1500));
          if (['C01', 'C03'].includes(c.id)) await shot(page, `796-E10-${c.id}-legado-pecuaria-visualizar`);
        }
        stateAdd('exps', { caso, num, tipo: 'pec', edit: l.edit });
      }
    } catch (er: any) { obs.ERRO = String(er).slice(0, 300); try { await shot(page, `796-E10-${c.id}-legado-ERRO`); } catch {} }
    rec({ cenario: 10, caso, entrada: { ...e, pec: c.p }, observado: obs });
  }
});

async function listaFiltrada2(page: any, num: string) {
  await page.goto(`/expenses?number=${encodeURIComponent(num)}&pagination_quantity=50`); await page.waitForLoadState('networkidle');
  const rows = await listRows(page);
  return rows.find((r: any) => r.cells.some((x: string) => x === num)) || rows[0] || {};
}

const MAN: { id: string; fam?: string; idx?: number; hor?: string; km?: string; nota: string }[] = [
  { id: 'C01', fam: '2', idx: 0, hor: '0', nota: 'trator/familia 2 horimetro 0' },
  { id: 'C02', fam: '2', idx: 1, hor: '5', nota: 'horimetro 5' },
  { id: 'C03', fam: '2', idx: 2, hor: '125', nota: 'horimetro 125' },
  { id: 'C04', fam: '2', idx: 3, hor: '12345', nota: 'horimetro 12345' },
  { id: 'C05', fam: '2', idx: 4, hor: '1,5', nota: 'horimetro digitando 1,5' },
  { id: 'C06', fam: '5', idx: 0, km: '0', nota: 'veiculo km 0' },
  { id: 'C07', fam: '5', idx: 1, km: '5', nota: 'veiculo km 5' },
  { id: 'C08', fam: '5', idx: 2, km: '125', nota: 'veiculo km 125' },
  { id: 'C09', fam: '5', idx: 3, km: '12345', nota: 'veiculo km 12345' },
  { id: 'C10', fam: '5', idx: 4, km: '99999', nota: 'veiculo km 99999' },
  { id: 'C11', fam: '2', idx: 5, hor: '99999999', nota: 'horimetro muito grande' },
  { id: 'C12', fam: '2', idx: 6, nota: 'sem horimetro (obrigatorio?)' },
  { id: 'C13', fam: '5', idx: 5, nota: 'veiculo sem km' },
];
test('E11a - Equipamentos por fazenda (cenario 11)', async ({ page }) => {
  test.setTimeout(900000);
  await login(page);
  for (const [fid, nome] of FARMS) {
    const obs: any = {};
    try {
      obs.sessao = await useFarm(page, fid);
      await page.goto('/expenses/create'); await page.waitForLoadState('networkidle'); await page.waitForTimeout(700);
      await setSel(page, 'inp-appropriation', '1'); await setSel(page, 'inp-appropriation_type', '4');
      obs.equip = await page.evaluate(() => { const o = [...document.querySelectorAll('[name="aprop_equipment_id"] option')].filter((x: any) => x.value) as HTMLOptionElement[]; const fam: any = {}; o.forEach(x => { const f = x.getAttribute('data-family') || '?'; fam[f] = (fam[f] || 0) + 1; }); return { total: o.length, porFamilia: fam, primeiros: o.slice(0, 4).map(x => x.text.trim()) }; });
      // trocar a fazenda do titulo muda a lista?
      const outras = await page.evaluate(() => [...document.querySelectorAll('#inp-farm_id option')].filter((x: any) => x.value && !x.selected).slice(0, 1).map((x: any) => x.value));
      if (outras[0]) { await setSel(page, 'inp-farm_id', outras[0]); await page.waitForTimeout(1500); obs.apos_trocar_fazenda_do_titulo = await page.evaluate(() => document.querySelectorAll('[name="aprop_equipment_id"] option').length - 1); }
    } catch (e: any) { obs.ERRO = String(e).slice(0, 300); }
    rec({ cenario: 11, caso: 'E11a-' + nome, entrada: { fazendaSessao: fid + ' ' + nome }, observado: obs });
  }
});

test('E11b - Manutencao horimetro/km (cenario 11)', async ({ page }) => {
  test.setTimeout(3_000_000);
  await login(page); await useFarm(page, '294');
  let k = 0;
  for (const c of MAN) {
    const caso = 'E11b-' + c.id; const obs: any = {}; const num = `QA102L-${caso}`;
    try {
      obs.fazenda = await headerFarm(page);
      // escolhe equipamento da familia
      await page.goto('/expenses/create'); await page.waitForLoadState('networkidle'); await page.waitForTimeout(500);
      const eqv = await page.evaluate(([fam, idx]) => { const o = [...document.querySelectorAll('[name="aprop_equipment_id"] option')].filter((x: any) => x.value && ((fam === '5') ? x.getAttribute('data-family') === '5' : x.getAttribute('data-family') !== '5')) as HTMLOptionElement[]; return o.length ? o[(idx as number) % o.length].value : ''; }, [c.fam, c.idx] as any);
      const e = { number: num, amount: VALS[k++ % VALS.length], fornecedor: 20 + k, aprop: '1', apropType: '4', nota: `QA102L ${caso} ${c.nota}`, man: { equip: eqv, hor: c.hor, km: c.km }, venc: `${10 + k}/11/2026` };
      const f = await fillExp(page, e); obs.preenchido = f;
      if (['C01', 'C04', 'C06', 'C09'].includes(c.id)) await shot(page, `796-E11b-${c.id}-legado-manutencao-preenchido`);
      const r = await submitExp(page); obs.salvar = r;
      const gravou = /\/expenses$/.test(r.url) || r.msgs.some((m: string) => /sucesso/i.test(m)); obs.gravou = gravou;
      if (!gravou) await shot(page, `796-E11b-${c.id}-legado-bloqueado`);
      if (gravou) {
        const l = await listaFiltrada2(page, num); obs.hrefEditar = l.edit;
        if (l.edit) {
          await page.goto(l.edit); await page.waitForLoadState('networkidle'); await page.waitForTimeout(1500);
          obs.edicao = await page.evaluate(() => ({ equip: (document.querySelector('[name="aprop_equipment_id"]') as HTMLSelectElement)?.selectedOptions[0]?.text.trim(), horimetro: (document.querySelector('.aprop-hour-meter') as HTMLInputElement)?.value, km: (document.querySelector('.aprop-mileage') as HTMLInputElement)?.value, contHor: !!(document.querySelector('.aprop-hour-meter-container') as HTMLElement)?.offsetParent, contKm: !!(document.querySelector('.aprop-mileage-container') as HTMLElement)?.offsetParent }));
          if (['C01', 'C04', 'C06', 'C09'].includes(c.id)) await shot(page, `796-E11b-${c.id}-legado-manutencao-edicao`);
          await page.goto(l.edit.replace('/edit', '')); await page.waitForLoadState('networkidle'); await page.waitForTimeout(800);
          obs.visualizar = await page.evaluate(() => (document.querySelector('.card-body, main, .content') as HTMLElement)?.innerText.replace(/\s+/g, ' ').slice(0, 1200));
          if (['C04', 'C09'].includes(c.id)) await shot(page, `796-E11b-${c.id}-legado-manutencao-visualizar`);
        }
        stateAdd('exps', { caso, num, tipo: 'man', edit: l.edit });
      }
    } catch (er: any) { obs.ERRO = String(er).slice(0, 300); try { await shot(page, `796-E11b-${c.id}-legado-ERRO`); } catch {} }
    rec({ cenario: 11, caso, entrada: c, observado: obs });
  }
});
