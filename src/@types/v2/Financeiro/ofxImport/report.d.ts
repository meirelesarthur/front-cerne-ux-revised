// src/@types/v2/Financeiro/ofxImport/report.d.ts
// -----------------------------------------------------------------------------
// Tipos do Relatório "Meses Conciliados" (agregação mensal de
// `Movement.is_reconciled=true`, TASK-065-OFX-FE-03, 97-Esteiras/065). Mirror
// 1:1 de `OfxReportResource`/`OfxReportItemData` (api_root, leitura direta):
//
//   GET /ofx-imports/report → permissão GENÉRICA `import_ofx` (mirror
//   `navigationPermissions.ts:835`, item de menu `fin-cnc-mes`), farm.context
//   ESTRITO (`X-Farm-Id`), SEM parâmetro nenhum (`OfxReportRequest::rules()`
//   vazio — agrega TODO o tenant do contexto atual, sem filtro de conta nem
//   período).
//
// Endpoint NÃO pagina — `ApiResponse::success(OfxReportResource::collection(...))`
// devolve `data: OfxImportReportItem[]` direto, `meta: null`. Não confundir
// com o motor de `OfxImportsListEnvelope` (CRUD paginado, `index.d.ts`) —
// este é um agregado simples, mirror `Response<T>` (`@/@types/response-api`).
//
// Substitui o `getOfxReport()`/`GET /ofx-report` (PDF) DELES, descartado na
// reconciliação de merge 065 — endpoint REMOVIDO pelo backend (ver
// `97-Esteiras/065/ROTEIROS/arquitetura-reconciliacao-ofx-frontend.md §3`).
// -----------------------------------------------------------------------------

export interface OfxImportReportItem {
  /** Rótulo já formatado pelo backend (mirror legado `DATE_FORMAT('%m/%Y')`),
   *  ex. "08/2026" — o front NUNCA recalcula a partir de `year`/`month`. */
  month_year: string;
  year: number;
  month: number;
  /** Quantidade de `Movement` conciliados (`is_reconciled=true`) no mês. */
  quantity: number;
}
