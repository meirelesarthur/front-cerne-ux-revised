// src/@types/v2/ImportExport/index.d.ts
// -----------------------------------------------------------------------------
// Tipos do módulo COMPARTILHADO de Import/Export de planilha (.xlsx) — esteira
// 036, Onda 3 sub-onda 3e (B-08). Consumido tanto por Contas a Pagar (Expense,
// `segment: 'expenses'`) quanto por Contas a Receber (Income, `segment:
// 'incomes'`) — mesmo racional de compartilhamento já usado por
// `@types/v2/WriteOff` (`WriteOffSegment`) e `@types/v2/Document`. NÃO
// DUPLICAR: qualquer tela nova com o mesmo contrato de import/export
// (download de modelo + export com filtro + import multipart) importa DESTE
// arquivo, nunca copia os tipos para dentro de `@types/v2/Financeiro/expense`
// ou `@types/v2/Incomes`.
//
// Contrato (B-08, backend já entregue/aprovado):
//   GET  /api/v1/{expenses|incomes}/download → binário .xlsx (modelo/template
//        em branco). Permissão `{expenses|incomes}_view`.
//   GET  /api/v1/{expenses|incomes}/export   → binário .xlsx (dados reais,
//        filtrados pelos MESMOS query params do filtro atual da listagem).
//        Permissão `{expenses|incomes}_view`.
//   POST /api/v1/{expenses|incomes}/import   → multipart, campo `file` →
//        `{ imported: number, errors: [{row, message}] }`. Permissão
//        `{expenses|incomes}_create`.
//
// Divergência REAL vs. o precedente `PlanAccountImportResult`/
// `OpeningBalanceImportResult` (que devolvem `created/updated/deleted/
// preserved`, modelo all-or-nothing com 422 quando há linhas inválidas) — o
// contrato B-08 é um modelo de SUCESSO PARCIAL: a resposta 200 sempre traz
// `imported` (contagem de linhas gravadas) + `errors[]` (linhas que falharam,
// mas não abortam o restante do lote). Por isso este módulo tem um tipo de
// resultado PRÓPRIO, não reaproveita `PlanAccountImportResult`.
// -----------------------------------------------------------------------------

/** Segmento — a única diferença entre Expense/Income é o path da URL (mirror `WriteOffSegment`). */
export type ImportExportSegment = 'expenses' | 'incomes';

export interface ImportExportRowError {
  row: number;
  message: string;
}

export interface ImportExportResult {
  imported: number;
  errors: ImportExportRowError[];
}
