// src/@types/v2/Relatorios/products-exit-cost-center.ts
// -----------------------------------------------------------------------------
// Tipos de domínio do relatório "Saídas x Centro Custo" (F-301, execução
// 97-Esteiras/078, TASK-F301-F01). Endpoint DELIVERED (raiz, NÃO `/reports/...`):
// `GET /products-exit-cost-center` — params `start_date,end_date,center,product,
// warehouse,report_type(pdf|excel)`. Mirror ESTRUTURAL de
// `@/@types/v2/Relatorios/savings.ts` — 5 campos de filtro (2 obrigatórios +
// 3 opcionais), SEM campo decorativo (diferente de Savings).
//
// `ProductsExitCostCenterReportFormValues` (forma do form) ≠
// `ProductsExitCostCenterReportParams` (payload real) — a fronteira permitida
// entre os dois é `toProductsExitCostCenterReportParams()`
// (`products-exit-cost-center-report-service.ts`).
// -----------------------------------------------------------------------------

import type { Option } from '@/@types/option';

/** Forma INTERNA do form (react-hook-form) — 5 campos: 2 obrigatórios
 *  (`start_date`/`end_date`) + 3 opcionais (`center`/`warehouse`/`product`). */
export interface ProductsExitCostCenterReportFormValues {
  start_date: string | null;
  end_date: string | null;
  center: Option<string> | null;
  warehouse: Option<string> | null;
  product: Option<string> | null;
}

/** Payload REAL enviado ao servidor — `report_type` é sempre incluído pelos
 *  2 handlers de download (literal `pdf`/`excel`), nunca lido do form. */
export interface ProductsExitCostCenterReportParams {
  start_date: string;
  end_date: string;
  center?: string;
  warehouse?: string;
  product?: string;
  report_type: ProductsExitCostCenterReportType;
}

/** `type→report_type` do legado (LAC-02) — literal `pdf`/`excel`, mirror
 *  `DreReportRequest`. Dois botões no footer, cada um fixa o literal — NUNCA
 *  um Select "Tipo de Relatório" no front (FRONT-07, decisão já resolvida). */
export type ProductsExitCostCenterReportType = 'pdf' | 'excel';
