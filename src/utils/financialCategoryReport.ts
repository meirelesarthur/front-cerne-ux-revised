// src/utils/financialCategoryReport.ts
// -----------------------------------------------------------------------------
// Geração do documento HTML de impressão do relatório de Categorias
// Financeiras (TASK-MV-FE-07 — addendum §8 do Movement-contrato-tela.md).
//
// Mirror EXATO de `src/utils/planAccountReport.ts` (TASK-PA-12) — mesma
// técnica client-side (HTML + `window.print()`), reaproveitando
// `compareAccountCode`/`escapeHtml` via import (não duplicados, DoD da
// Tarefa) porque `FinancialCategory.code` e `PlanAccount.code` usam o mesmo
// formato hierárquico ponto-separado
// (`GenerateFinancialCategoryCodeAction.php:84`).
//
// Coluna extra "Tipo" (`type?.description`) que `planAccountReport.ts` não
// tem — `FinancialCategoryListItem.type` é `{ uuid, description } | null`
// (eager-carregado pelo backend, `FinancialCategoryApiRepository::
// listPaginated`, linha 27).
//
// EXCEÇÃO DELIBERADA ao "zero hardcoded" (mesma exceção já documentada em
// `planAccountReport.ts`): as cores do documento impresso são hex literal
// porque o HTML é escrito via `document.write` numa janela nova, fora da
// árvore React/Chakra desta SPA, sem acesso a `theme.ts`/tokens em runtime.
// -----------------------------------------------------------------------------

import { compareAccountCode, escapeHtml } from '@/utils/planAccountReport';

import type { FinancialCategoryListItem } from '@/@types/v2/FinancialCategories';

export interface FinancialCategoryReportText {
  documentTitle: string;
  columnCode: string;
  columnClass: string;
  columnType: string;
  columnDescription: string;
  metaCountSingular: string;
  metaCountPlural: string;
}

// Monta o documento HTML completo do relatório, ordenado hierarquicamente por `code`.
export function buildFinancialCategoryReportHtml(
  items: FinancialCategoryListItem[],
  text: FinancialCategoryReportText
): string {
  const sorted = [...items].sort((a, b) => compareAccountCode(a.code, b.code));

  const rows = sorted
    .map((item) => {
      // class 1 = SYNTHETIC (grupo) — mesmo destaque visual de `planAccountReport.ts`.
      const isSynthetic = item.class === 1;
      const rowStyle = isSynthetic
        ? 'color:#b91c1c;font-weight:700;'
        : 'color:#111827;font-weight:400;';

      return `<tr style="${rowStyle}">
        <td>${escapeHtml(item.code)}</td>
        <td>${escapeHtml(item.class_label)}</td>
        <td>${escapeHtml(item.type?.description ?? '—')}</td>
        <td>${escapeHtml(item.description)}</td>
      </tr>`;
    })
    .join('');

  const countLabel = sorted.length === 1 ? text.metaCountSingular : text.metaCountPlural;

  return `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8" />
<title>${escapeHtml(text.documentTitle)}</title>
<style>
  @page { size: A4; margin: 18mm 14mm; }
  body { font-family: Arial, Helvetica, sans-serif; font-size: 11px; color: #111827; margin: 0; }
  h1 { font-size: 16px; margin: 0 0 4px; }
  p.meta { font-size: 10px; color: #6b7280; margin: 0 0 16px; }
  table { width: 100%; border-collapse: collapse; }
  th { text-align: left; font-size: 10px; text-transform: uppercase; letter-spacing: .04em; color: #6b7280; border-bottom: 1.5px solid #111827; padding: 6px 8px; }
  td { padding: 5px 8px; border-bottom: 1px solid #e5e7eb; }
  th:nth-child(1), td:nth-child(1) { width: 90px; }
  th:nth-child(2), td:nth-child(2) { width: 90px; }
  th:nth-child(3), td:nth-child(3) { width: 120px; }
</style>
</head>
<body>
  <h1>${escapeHtml(text.documentTitle)}</h1>
  <p class="meta">${sorted.length} ${escapeHtml(countLabel)}</p>
  <table>
    <thead><tr>
      <th>${escapeHtml(text.columnCode)}</th>
      <th>${escapeHtml(text.columnClass)}</th>
      <th>${escapeHtml(text.columnType)}</th>
      <th>${escapeHtml(text.columnDescription)}</th>
    </tr></thead>
    <tbody>${rows}</tbody>
  </table>
</body>
</html>`;
}

// Abre o relatório numa aba nova e dispara a impressão nativa do navegador.
// Retorna `false` se o pop-up foi bloqueado (`window.open` devolveu `null`) —
// o chamador deve tratar isso com um toast de erro específico, nunca falha
// silenciosa.
export function openFinancialCategoryReport(
  items: FinancialCategoryListItem[],
  text: FinancialCategoryReportText
): boolean {
  const win = window.open('', '_blank');
  if (!win) return false;

  win.document.open();
  win.document.write(buildFinancialCategoryReportHtml(items, text));
  win.document.close();
  win.focus();
  win.setTimeout(() => win.print(), 300);
  return true;
}
