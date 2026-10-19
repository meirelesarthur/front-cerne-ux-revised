// src/@types/v2/Relatorios/financings-report.ts
// -----------------------------------------------------------------------------
// Tipos de domínio do relatório "Financiamentos" (F-265, execução
// 97-Esteiras/078, TASK-F265-F01). Endpoint DELIVERED (COM prefixo
// `reports/`, evidência viva `routes/api.php:2274` — DIFERENTE do F-301, que
// é raiz): `GET /reports/financings` — params `start_date,end_date,
// report_type(pdf|excel)`. Mirror ESTRUTURAL de
// `@/@types/v2/Relatorios/products-exit-cost-center.ts`, porém MAIS ENXUTO —
// F-265 é o relatório mais simples do lote: SEM selects (sem
// `center`/`warehouse`/`product`), só as 2 datas obrigatórias.
//
// `FinancingsReportFormValues` (forma do form) ≠ `FinancingsReportParams`
// (payload real) — a fronteira permitida entre os dois é
// `toFinancingsReportParams()` (`financings-report-service.ts`).
// -----------------------------------------------------------------------------

/** Forma INTERNA do form (react-hook-form) — 2 campos, AMBOS obrigatórios
 *  (RN-04 do contrato legado). Sem selects (diferente de
 *  `ProductsExitCostCenterReportFormValues`, que tem 3 opcionais). */
export interface FinancingsReportFormValues {
  start_date: string | null;
  end_date: string | null;
}

/** Payload REAL enviado ao servidor — `report_type` é sempre incluído pelos
 *  2 handlers de download (literal `pdf`/`excel`), nunca lido do form. */
export interface FinancingsReportParams {
  start_date: string;
  end_date: string;
  report_type: FinancingsReportType;
}

/** `type→report_type` do legado (DIV-02: legado tinha bug `if($request->type)`
 *  truthy fazendo "PDF" gerar Excel; API corrige com branch literal). Dois
 *  botões no footer, cada um fixa o literal — NUNCA um Select "Tipo de
 *  Relatório" no front (FRONT-04, decisão já resolvida DEC-049). */
export type FinancingsReportType = 'pdf' | 'excel';
