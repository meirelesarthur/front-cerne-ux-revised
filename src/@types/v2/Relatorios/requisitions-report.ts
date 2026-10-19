// src/@types/v2/Relatorios/requisitions-report.ts
// -----------------------------------------------------------------------------
// Tipos de domínio do relatório "Requisição/Saída" (F-312, execução
// 97-Esteiras/078, TASK-F312-F01). Endpoint DELIVERED (raiz, NÃO
// `/reports/...`): `GET /requisitions-report` — params `start_date,end_date,
// warehouse,product,report_type(pdf|excel)`. Mirror ESTRUTURAL de
// `@/@types/v2/Relatorios/products-exit-cost-center.ts` MENOS o campo
// `center` — 4 campos de filtro (2 obrigatórios + 2 opcionais).
//
// `RequisitionsReportFormValues` (forma do form) ≠ `RequisitionsReportParams`
// (payload real) — a fronteira permitida entre os dois é
// `toRequisitionsReportParams()` (`requisitions-report-service.ts`).
// -----------------------------------------------------------------------------

import type { Option } from '@/@types/option';

/** Forma INTERNA do form (react-hook-form) — 4 campos: 2 obrigatórios
 *  (`start_date`/`end_date`) + 2 opcionais (`warehouse`/`product`). */
export interface RequisitionsReportFormValues {
  start_date: string | null;
  end_date: string | null;
  warehouse: Option<string> | null;
  product: Option<string> | null;
}

/** Payload REAL enviado ao servidor — `report_type` é sempre incluído pelos
 *  2 handlers de download (literal `pdf`/`excel`), nunca lido do form. */
export interface RequisitionsReportParams {
  start_date: string;
  end_date: string;
  warehouse?: string;
  product?: string;
  report_type: RequisitionsReportType;
}

/** `type→report_type` do legado — literal `pdf`/`excel`, mirror
 *  `ProductsExitCostCenterReportType`. Dois botões no footer, cada um fixa o
 *  literal — NUNCA um Select "Tipo de Relatório" no front (FRONT-06, decisão
 *  já resolvida). */
export type RequisitionsReportType = 'pdf' | 'excel';
