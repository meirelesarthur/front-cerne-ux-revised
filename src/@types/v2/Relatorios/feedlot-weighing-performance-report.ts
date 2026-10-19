// src/@types/v2/Relatorios/feedlot-weighing-performance-report.ts
// -----------------------------------------------------------------------------
// Tipos do relatório "Desempenho Pesagem Confinamento" (F-263, lote 076,
// `FeedlotWeighingPerformanceReport-contrato-api.md`). Mirror ESTRUTURAL de
// `Relatorios/costing-livestock-area-report.ts` (par `start_date`/`end_date`
// obrigatório + lookups opcionais `Option<string>|null`), mas SINGLE-select
// para os 2 filtros (`corral`/`batch`, mirror `FiscalDifferenceReport.center_id`)
// — o contrato de API (`FeedlotWeighingPerformanceReportRequest::rules()`)
// aceita 1 `corral_uuid` e 1 `batch_uuid`, nunca array.
//
// `report_type` NÃO entra no form — decidido pelo botão clicado na tela
// (mirror `CusteioLote`/`FiscalNaoFiscal`), repassado como parâmetro
// separado às funções `download*Pdf`/`download*Xlsx` do service.
// -----------------------------------------------------------------------------

import type { Option } from '@/@types/option';

export interface FeedlotWeighingPerformanceReportFilterForm {
  corral: Option<string> | null;
  batch: Option<string> | null;
  start_date: string | null;
  end_date: string | null;
}

export interface FeedlotWeighingPerformanceReportParams {
  corral_uuid?: string;
  batch_uuid?: string;
  start_date: string;
  end_date: string;
}

export type FeedlotWeighingPerformanceReportOutputType = 'pdf' | 'excel';
