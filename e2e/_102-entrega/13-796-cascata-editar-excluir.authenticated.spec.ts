import { test } from '@playwright/test';
import { apiGet, loadState, logCase, shot, accountBalance } from './lib';
test.use({ viewport: { width: 1700, height: 1200 } });

const st0 = loadState();
const fin: any[] = (st0.fin ?? []);
const pick = (id: string) => fin.filter((x) => x.id === id).slice(-1)[0];
const EDIT = ['F01', 'F02', 'F03', 'F04', 'F05', 'G01', 'G02', 'G03', 'G04', 'G05'];
const DEL = ['F06', 'F07', 'F08', 'F09', 'F10', 'G06', 'G07', 'G08', 'G09', 'G10'];

async function titleExists(page: any, kind: string, uuid: string) {
  const r = await apiGet(page, `/${kind === 'expense' ? 'expenses' : 'incomes'}/${uuid}`);
  return r.status === 200;
}

EDIT.forEach((id) => {
  test(`796-${id}-editar movimento Financiamento com título: confirmação de cascata`, async ({ page }) => {
    test.setTimeout(180_000);
    const f = pick(id);
    if (!f) { logCase({ ut: 796, scen: '6-editar', id, input: 'editar F com título', expected: 'cascata', got: 'caso de criação não executou', result: 'BLOCKED_DATA' }); throw new Error('sem dado do financiamento ' + id); }
    await page.goto('/home'); await page.waitForTimeout(1200);
    const before = { title: await titleExists(page, f.kind, f.titleUuid), bal: await accountBalance(page, loadState()[f.acc]) };
    await page.goto(`/financeiro/caixa/${f.movUuid}`);
    await page.locator('textarea').first().waitFor({ timeout: 40000 }); await page.waitForTimeout(4500);
    const ta = page.locator('textarea').first();
    await ta.fill(`QA102-${id}-editado`);
    await page.getByRole('button', { name: 'Salvar' }).first().click();
    await page.waitForTimeout(2500);
    const dlg = page.locator('[role=dialog], [role=alertdialog]').first();
    const dlgShown = await dlg.isVisible().catch(() => false);
    const dlgText = dlgShown ? (await dlg.innerText()).replace(/\s+/g, ' ') : '';
    await shot(page, `796-${id}-edicao-confirmacao-cascata`);
    const putP = page.waitForResponse((r) => /\/movements\/[0-9a-f-]+$/.test(r.url()) && r.request().method() === 'PUT', { timeout: 20000 }).catch(() => null);
    if (dlgShown) { const btns = dlg.getByRole('button'); const n = await btns.count(); await btns.nth(n - 1).click(); }
    const put = await putP;
    await page.waitForTimeout(4000);
    const after = { title: await titleExists(page, f.kind, f.titleUuid), url: page.url() };
    await shot(page, `796-${id}-edicao-apos-confirmar`);
    const putStatus = put ? put.status() : null;
    const ok = dlgShown && /t[ií]tulo/i.test(dlgText) && before.title === true && putStatus !== null && putStatus < 300 && after.title === false;
    logCase({ ut: 796, scen: '6-editar', id, input: `editar histórico do movimento F (${f.kind}) que gerou título; confirmar`, expected: 'aparece confirmação citando título(s); ao confirmar o PUT é feito e o título vinculado é excluído', got: JSON.stringify({ dialogo: dlgShown, texto: dlgText.slice(0, 300), tituloAntes: before.title, putStatus, tituloDepois: after.title, urlDepois: after.url }), result: ok ? 'PASSOU' : 'FALHOU' });
    if (!ok) { await shot(page, `796-${id}-edicao-FALHA`); throw new Error(JSON.stringify({ dlgShown, dlgText: dlgText.slice(0, 200), before, putStatus, after })); }
  });
});

async function findRow(page: any, code: string) {
  await page.goto('/financeiro/caixa'); await page.locator('tbody tr').first().waitFor({ timeout: 40000 }); await page.waitForTimeout(1500);
  for (let p = 1; p <= 20; p++) {
    const row = page.locator('tbody tr').filter({ has: page.locator('td', { hasText: new RegExp('^' + code + '$') }) });
    if (await row.count()) return row.first();
    const next = page.locator('button[aria-label*="róxima" i], button[aria-label*="next" i]').first();
    const nb = page.locator('button:has(svg)').filter({ hasText: '' }).last();
    // paginação: botão ">" após os números
    const arrow = page.locator('nav button, [data-scope=pagination] button').last();
    if (!(await arrow.isVisible().catch(() => false)) || (await arrow.isDisabled().catch(() => true))) break;
    await arrow.click(); await page.waitForTimeout(1200);
    void next; void nb;
  }
  return null;
}
DEL.forEach((id) => {
  test(`796-${id}-excluir movimento Financiamento pela lista: cascata`, async ({ page }) => {
    test.setTimeout(240_000);
    const f = pick(id);
    if (!f) { logCase({ ut: 796, scen: '6-excluir', id, input: 'excluir F com título', expected: 'cascata', got: 'caso de criação não executou', result: 'BLOCKED_DATA' }); throw new Error('sem dado do financiamento ' + id); }
    await page.goto('/home'); await page.waitForTimeout(1200);
    const mdet = (await apiGet(page, `/movements/${f.movUuid}`)).body?.data;
    const code = String(mdet?.code ?? '');
    const bBal = await accountBalance(page, loadState()[f.acc]);
    const tBefore = await titleExists(page, f.kind, f.titleUuid);
    const row = await findRow(page, code);
    if (!row) { logCase({ ut: 796, scen: '6-excluir', id, input: `código ${code}`, expected: 'achar linha', got: 'linha não localizada nas páginas', result: 'BLOCKED_DATA' }); throw new Error('linha ' + code + ' não localizada'); }
    await row.locator('button').last().click(); await page.waitForTimeout(600);
    await page.getByRole('menuitem', { name: /Excluir/ }).first().click().catch(async () => { await page.getByText('Excluir', { exact: true }).first().click(); });
    await page.waitForTimeout(1500);
    const dlg = page.locator('[role=dialog], [role=alertdialog]').first();
    const dlgShown = await dlg.isVisible().catch(() => false);
    const dlgText = dlgShown ? (await dlg.innerText()).replace(/\s+/g, ' ') : '';
    await shot(page, `796-${id}-exclusao-confirmacao-cascata`);
    const delP = page.waitForResponse((r) => /\/movements\/[0-9a-f-]+$/.test(r.url()) && r.request().method() === 'DELETE', { timeout: 20000 }).catch(() => null);
    if (dlgShown) { const btns = dlg.getByRole('button'); const n = await btns.count(); await btns.nth(n - 1).click(); }
    const del = await delP; await page.waitForTimeout(3000);
    const tAfter = await titleExists(page, f.kind, f.titleUuid);
    const mAfter = (await apiGet(page, `/movements/${f.movUuid}`)).status;
    const aBal = await accountBalance(page, loadState()[f.acc]);
    await shot(page, `796-${id}-exclusao-apos-confirmar`);
    const expDelta = f.kind === 'expense' ? -f.val : f.val; // desfaz o movimento
    const ok = dlgShown && /t[ií]tulo/i.test(dlgText) && tBefore && !!del && del.status() < 300 && !tAfter && mAfter === 404 && Math.abs((aBal - bBal) - expDelta) < 0.005;
    logCase({ ut: 796, scen: '6-excluir', id, input: `excluir pela lista o movimento F (${f.kind}) código ${code}; confirmar`, expected: 'confirmação citando título(s); DELETE ok; título excluído; movimento 404; saldo da conta desfeito', got: JSON.stringify({ dialogo: dlgShown, texto: dlgText.slice(0, 300), tituloAntes: tBefore, delStatus: del?.status(), tituloDepois: tAfter, movimentoDepois: mAfter, deltaSaldo: Number((aBal - bBal).toFixed(2)), esperado: expDelta }), result: ok ? 'PASSOU' : 'FALHOU' });
    if (!ok) { await shot(page, `796-${id}-exclusao-FALHA`); throw new Error(JSON.stringify({ dlgShown, dlgText: dlgText.slice(0, 200), tBefore, del: del?.status(), tAfter, mAfter, delta: aBal - bBal })); }
  });
});
