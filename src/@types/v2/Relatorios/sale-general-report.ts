// src/@types/v2/Relatorios/sale-general-report.ts
// -----------------------------------------------------------------------------
// Tipos de domínio do relatório "Vendas/Cliente" (F-317, esteira
// CORE_WORKSPACE/97-Esteiras/077, F-317-plano-front.md). Mirror ESTRUTURAL de
// `sale-client-report.ts` (F-313) — MESMO casco "download-only" (SEM prévia),
// namespace/módulo PRÓPRIO `SaleGeneralReport` para não colidir com F-313
// (endpoint distinto, permissão distinta, domínio de formato distinto).
//
// Shapes confirmados pelo contrato-alvo da API cirúrgica
// (`F-317-plano-CIRURGICO.md`, `GET /api/v1/sales-report`):
//   - `report_type: 'pdf' | 'excel'` (string) — NUNCA `0|1` (F-313) nem
//     `'pdf'|'xlsx'` (`AccountsReports.ReportFormat`). Nome do campo IDÊNTICO
//     ao parâmetro da API — sem tradução de nome entre form e payload.
//
// `client_uuid`/`product_uuid` reusam `Option<string>` (os lookups em si são
// `listClientOptions`/`ClientOptionItem`
// (`@/services/v2/CadastrosBase/Client/client-service.ts`) e
// `listProductOptions`/`ProductOptionItem`
// (`@/services/v2/Products/product-service.ts`) já existentes — nenhum tipo
// de Ref duplicado aqui).
// -----------------------------------------------------------------------------

import type { Option } from '@/@types/option';

/** `'pdf' | 'excel'` — NUNCA `0|1` (F-313) nem `'pdf'|'xlsx'` (AccountsReports). */
export type SaleGeneralReportFormat = 'pdf' | 'excel';

export interface SaleGeneralReportFilterForm {
  start_date: string | null;
  end_date: string | null;
  client_uuid: Option<string> | null;
  product_uuid: Option<string> | null;
  report_type: SaleGeneralReportFormat;
}

/** Payload REAL enviado ao servidor — nomes 1:1 com o contrato-alvo da API cirúrgica. */
export interface SaleGeneralReportParams {
  start_date: string;
  end_date: string;
  client_uuid?: string;
  product_uuid?: string;
  report_type: SaleGeneralReportFormat;
}
