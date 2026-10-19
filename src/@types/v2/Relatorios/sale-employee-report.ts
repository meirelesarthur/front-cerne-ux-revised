// src/@types/v2/Relatorios/sale-employee-report.ts
// -----------------------------------------------------------------------------
// Tipos de domínio do relatório "Vendas/Funcionário" (F-314, esteira
// CORE_WORKSPACE/97-Esteiras/079). Mirror ESTRUTURAL de
// `sale-product-report.ts` (F-315) — mesmo fan-out do casco "Dre-style"
// (download-only, SEM prévia).
//
// Shapes confirmados por leitura DIRETA do contrato de API (esteira 079):
//   - `GET /api/v1/sales-employee-report` (`sale-employees.report`)
//   - `app/Http/Requests/Api/V1/SaleReportRequest.php` (compartilhado pelos
//     5 relatórios comerciais A10-A14 — `type: 'sometimes','nullable','in:0,1'`)
//
// DECISÃO DE TIPO (mirror F-315): `type` é `0 | 1` (`number`), NÃO
// `'pdf' | 'xlsx'` (`string`) — mesmo domínio de `SaleProductReportParams`.
//
// `user_uuid` reusa `Option<string>` — o lookup em si é a função local
// `listSaleEmployeeReportUserOptions` (`@/services/v2/Relatorios/
// sale-employee-report-service.ts`, mirror `listServiceOrderExecutorOptions`
// de `service-order-service.ts` sobre `GET /users/options`).
// -----------------------------------------------------------------------------

import type { Option } from '@/@types/option';

export interface SaleEmployeeReportFilterForm {
  start_date: string | null;
  end_date: string | null;
  user_uuid: Option<string> | null;
  /** `0` = PDF (default) | `1` = Excel — mirror `SaleReportRequest.type`. */
  type: 0 | 1;
}

/** Payload REAL enviado ao servidor — nomes 1:1 com `SaleReportRequest::rules()`. */
export interface SaleEmployeeReportParams {
  start_date: string;
  end_date: string;
  user_uuid?: string;
  type: 0 | 1;
}
