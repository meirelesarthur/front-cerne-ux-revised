// src/utils/movementAllocationReport.ts
// -----------------------------------------------------------------------------
// Geração do documento HTML de impressão do relatório de Rateio do movimento
// (TASK-MV-FE-07 — addendum §8/8.3 item 3 do Movement-contrato-tela.md).
//
// SEM precedente 1:1 para copiar — mesma TÉCNICA client-side (HTML +
// `window.print()`) de `planAccountReport.ts`/`financialCategoryReport.ts`,
// mas a fonte de dados aqui NUNCA é uma chamada de API: os `rows` já chegam
// prontos (labels já formatados pelos `mapOptions` do
// `MovementAllocationEditor` via `watchedAllocations`/`headerValue`,
// Movement-contrato-tela.md §8, "Contrato de dados").
//
// Ordem de colunas fiel ao legado (`show.blade.php:152-209`): Categoria /
// Conta Contábil / Centro de Custo / Valor / Percentual — SEM coluna Safra
// (default §8.4/2, fidelidade estrita à referência citada pelo dono).
//
// `planAccountUuid`/`planAccountLabel` null → renderiza "—" (nunca
// `undefined`/`null` literal no HTML, DoD da Tarefa).
//
// EXCEÇÃO DELIBERADA ao "zero hardcoded" (mesma exceção já documentada em
// `planAccountReport.ts`/`financialCategoryReport.ts`): as cores do documento
// impresso são hex literal porque o HTML é escrito via `document.write` numa
// janela nova, fora da árvore React/Chakra desta SPA, sem acesso a
// `theme.ts`/tokens em runtime.
// -----------------------------------------------------------------------------

import { escapeHtml } from '@/utils/planAccountReport';

export interface MovementAllocationReportRow {
  categoryLabel: string;
  planAccountLabel: string | null;
  centerLabel: string;
  value: number;
}

export interface MovementAllocationReportText {
  documentTitle: string;
  columnCategory: string;
  columnPlanAccount: string;
  columnCenter: string;
  columnValue: string;
  columnPercent: string;
  totalLabel: string;
  planAccountEmpty: string;
}

function formatCurrencyBRL(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function formatPercent(value: number): string {
  return `${value.toFixed(2)}%`;
}

// Monta o documento HTML completo do relatório de rateio (ordem das linhas
// preservada — a mesma ordem de `watchedAllocations`/`useFieldArray` do
// formulário, nenhuma reordenação aplicada aqui).
export function buildMovementAllocationReportHtml(
  rows: MovementAllocationReportRow[],
  headerValue: number,
  text: MovementAllocationReportText
): string {
  const totalValue = rows.reduce((sum, row) => sum + (Number(row.value) || 0), 0);

  const bodyRows = rows
    .map((row) => {
      const rowValue = Number(row.value) || 0;
      const rowPercent = headerValue > 0 ? (rowValue / headerValue) * 100 : 0;

      return `<tr>
        <td>${escapeHtml(row.categoryLabel)}</td>
        <td>${row.planAccountLabel ? escapeHtml(row.planAccountLabel) : escapeHtml(text.planAccountEmpty)}</td>
        <td>${escapeHtml(row.centerLabel)}</td>
        <td>${escapeHtml(formatCurrencyBRL(rowValue))}</td>
        <td>${escapeHtml(formatPercent(rowPercent))}</td>
      </tr>`;
    })
    .join('');

  const totalPercent = headerValue > 0 ? (totalValue / headerValue) * 100 : 0;

  return `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8" />
<title>${escapeHtml(text.documentTitle)}</title>
<style>
  @page { size: A4; margin: 18mm 14mm; }
  body { font-family: Arial, Helvetica, sans-serif; font-size: 11px; color: #111827; margin: 0; }
  h1 { font-size: 16px; margin: 0 0 4px; }
  table { width: 100%; border-collapse: collapse; margin-top: 12px; }
  th { text-align: left; font-size: 10px; text-transform: uppercase; letter-spacing: .04em; color: #6b7280; border-bottom: 1.5px solid #111827; padding: 6px 8px; }
  td { padding: 5px 8px; border-bottom: 1px solid #e5e7eb; }
  tfoot td { font-weight: 700; border-top: 1.5px solid #111827; border-bottom: none; }
  th:nth-child(4), td:nth-child(4), th:nth-child(5), td:nth-child(5) { width: 100px; }
</style>
</head>
<body>
  <h1>${escapeHtml(text.documentTitle)}</h1>
  <table>
    <thead><tr>
      <th>${escapeHtml(text.columnCategory)}</th>
      <th>${escapeHtml(text.columnPlanAccount)}</th>
      <th>${escapeHtml(text.columnCenter)}</th>
      <th>${escapeHtml(text.columnValue)}</th>
      <th>${escapeHtml(text.columnPercent)}</th>
    </tr></thead>
    <tbody>${bodyRows}</tbody>
    <tfoot>
      <tr>
        <td colspan="3">${escapeHtml(text.totalLabel)}</td>
        <td>${escapeHtml(formatCurrencyBRL(totalValue))}</td>
        <td>${escapeHtml(formatPercent(totalPercent))}</td>
      </tr>
    </tfoot>
  </table>
</body>
</html>`;
}

// Abre o relatório numa aba nova e dispara a impressão nativa do navegador.
// Retorna `false` se o pop-up foi bloqueado (`window.open` devolveu `null`) —
// o chamador deve tratar isso com um toast de erro específico, nunca falha
// silenciosa.
export function openMovementAllocationReport(
  rows: MovementAllocationReportRow[],
  headerValue: number,
  text: MovementAllocationReportText
): boolean {
  const win = window.open('', '_blank');
  if (!win) return false;

  win.document.open();
  win.document.write(buildMovementAllocationReportHtml(rows, headerValue, text));
  win.document.close();
  win.focus();
  win.setTimeout(() => win.print(), 300);
  return true;
}
