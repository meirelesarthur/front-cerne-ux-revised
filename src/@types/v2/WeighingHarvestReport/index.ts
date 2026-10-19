// src/@types/v2/WeighingHarvestReport/index.ts
// -----------------------------------------------------------------------------
// Tipos do relatório "Pesagens/Colheita" (F-335, execução 053,
// roteiro-front-F335-pesagens-colheita.md §3/§4, TASK-053-335-FE-01). Mirror
// estrutural de `@/@types/v2/StockProviderLotReport` — tela de filtro +
// download binário, SEM grid/prévia. Diferente da irmã Lote/Fornecedor, esta
// tela TEM 2 datas OBRIGATÓRIAS (`start_date`/`end_date`, CORRIGE CL-09) e 5
// filtros opcionais (`product_uuid`/`area_uuid`/`warehouse_uuid`/
// `client_uuid`/`type`), além do `format` (PDF+Excel, DEC-225-alinhado).
//
// `WeighingHarvestReportFilterForm` valida a FORMA INTERNA do form
// (Option-based, react-hook-form) — `WeighingHarvestReportParams` é o
// payload 1:1 com `WeighingHarvestReportRequest` (backend), campos opcionais
// SEMPRE `undefined` quando vazios (nunca `''`/`null` na query string).
// -----------------------------------------------------------------------------

import type { Option } from '@/@types/option';
import type { ReportFormat } from '@/@types/v2/AccountsReports';
import type { ModuleWeighingType } from '@/@types/v2/ModuleWeighing/module-weighing';

export interface WeighingHarvestReportFilterForm {
  start_date: string | null;
  end_date: string | null;
  product_uuid: Option<string> | null;
  area_uuid: Option<string> | null;
  warehouse_uuid: Option<string> | null;
  client_uuid: Option<string> | null;
  type: Option<ModuleWeighingType> | null;
  format: Option<ReportFormat> | null;
}

export interface WeighingHarvestReportParams {
  start_date: string;
  end_date: string;
  product_uuid?: string;
  area_uuid?: string;
  warehouse_uuid?: string;
  client_uuid?: string;
  type?: ModuleWeighingType;
  format?: ReportFormat;
}
