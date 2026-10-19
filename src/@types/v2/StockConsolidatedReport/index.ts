// src/@types/v2/StockConsolidatedReport/index.ts
// -----------------------------------------------------------------------------
// Tipos do relatório "Estoque Consolidado" (F-323, feature_id e70b8cad,
// esteira 97-Esteiras/079, F-323-plano-frontend.md). Mirror ESTRUTURAL DUPLO:
// `@/@types/v2/StockAbcReport` (casca de tela download-only, SEM grid/prévia)
// + `MovimentacaoEstoqueFilterForm` inline (`@/pages/Relatorios/Estoque/
// MovimentacaoEstoque/index.tsx`, warehouses/product farm/tenant-scoped) +
// `ProductFormFields.tsx` (cascata group→category→kind).
//
// `StockConsolidatedReportFormat` é um enum PRÓPRIO deste módulo — NUNCA
// reusar `StockAbcReportFormat`/`ReportFormat` de outros módulos (mirror
// `stock-abc-report`, mesmo domínio 'pdf'|'excel' mas namespace isolado).
//
// Chaves EXATAS do payload confirmadas por leitura direta de
// `StockConsolidatedReportRequest::rules()` (api_root, TASK-323-02):
// `warehouse_uuids` (required|array|min:1), `group_uuid`/`category_uuid`/
// `kind_uuid`/`product_uuid` (sometimes|uuid), `search` (sometimes|string),
// `date` (sometimes|date_format:Y-m-d), `report_type` (sometimes|enum).
// -----------------------------------------------------------------------------

import type { Option } from '@/@types/option';

export type StockConsolidatedReportFormat = 'pdf' | 'excel'; // NUNCA reusar outro enum de formato

export interface StockConsolidatedReportFilterForm {
  warehouses: Option<string>[];
  group: Option<string> | null;
  category: Option<string> | null;
  kind: Option<string> | null;
  search: string | null;
  product: Option<string> | null;
  date: string | null;
  format: Option<StockConsolidatedReportFormat> | null;
}

export interface StockConsolidatedReportParams {
  warehouse_uuids: string[];
  group_uuid?: string;
  category_uuid?: string;
  kind_uuid?: string;
  search?: string;
  product_uuid?: string;
  date?: string; // 'Y-m-d'
  report_type: StockConsolidatedReportFormat; // chave EXATA do FormRequest — NUNCA 'format'/'type'
}
