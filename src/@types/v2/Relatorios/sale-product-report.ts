// src/@types/v2/Relatorios/sale-product-report.ts
// -----------------------------------------------------------------------------
// Tipos de domínio do relatório "Vendas/Produto" (F-315, esteira
// CORE_WORKSPACE/97-Esteiras/051, TASK-315-FE-01). Mirror ESTRUTURAL de
// `management-batch-report.ts` (F-279) e `production-costing-area-report.ts`
// (F-298) — mesmo fan-out do casco "Dre-style" (download-only, SEM prévia).
//
// Shapes confirmados por leitura DIRETA do código real da API já
// materializada (`GB.Cerne.Api`), não adivinhados a partir do roteiro:
//   - `app/Data/Sale/SaleReportFilterData.php` (`type: int`, default `0`)
//   - `app/Http/Requests/Api/V1/SaleReportRequest.php` (`'type' => ['sometimes','nullable','in:0,1']`)
//   - `app/Http/Controllers/Api/V1/SaleProductReportController.php` (`GET /sales-product-report`)
//
// DECISÃO DE TIPO (roteiro-front-F315 §"Decisão de tipo"): `type` é
// `0 | 1` (`number`), NÃO `'pdf' | 'xlsx'` (`string`) — mirror literal do
// legado herdado pelo DTO da API nova (`SaleReportFilterData.type: int`).
// NÃO reaproveita `reportFormatOptions` (`AccountsReports`, domínio
// `string`) — as 2 telas usam domínios de valor DIFERENTES por decisão do
// contrato de API, não por descuido.
//
// `product_uuid` reusa `Option<string>` (o lookup em si é o
// `listProductOptions`/`ProductOption` já existente em
// `@/services/v2/Products/product-service.ts` — nenhum tipo de Ref
// duplicado aqui).
// -----------------------------------------------------------------------------

import type { Option } from '@/@types/option';

export interface SaleProductReportFilterForm {
  start_date: string | null;
  end_date: string | null;
  product_uuid: Option<string> | null;
  /** `0` = PDF (default) | `1` = Excel — mirror `SaleReportFilterData.type`. */
  type: 0 | 1;
}

/** Payload REAL enviado ao servidor — nomes 1:1 com `SaleReportRequest::rules()`. */
export interface SaleProductReportParams {
  start_date: string;
  end_date: string;
  product_uuid?: string;
  type: 0 | 1;
}
