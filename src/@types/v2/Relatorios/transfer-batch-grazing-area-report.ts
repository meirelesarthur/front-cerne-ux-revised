// src/@types/v2/Relatorios/transfer-batch-grazing-area-report.ts
// -----------------------------------------------------------------------------
// Tipos de domínio do relatório "Transf/Lote/Módulo/Área" (F-329, esteira
// CORE_WORKSPACE/97-Esteiras/077, F-329-plano-front.md). Mirror ESTRUTURAL de
// `management-batch-report.ts` (F-279) REMOVENDO o campo `category` (e seu
// universo) — o contrato legado desta tela (§2) só lista 3 campos:
// `start_date`/`end_date`/`batch_id`; não há universo de categoria aqui.
//
// Nome do parâmetro: `batch_id` (não `batch`) — 1:1 com
// `TransferBatchGrazingAreaReportRequest::rules()` (`F-329-plano-api.md §2`),
// mesmo nome usado pelo legado nesta tela específica (sem divergência real).
// -----------------------------------------------------------------------------

import type { Option } from '@/@types/option';

export interface TransferBatchGrazingAreaBatchRef {
  uuid: string;
  label: string;
}

export interface TransferBatchGrazingAreaReportOptionsData {
  /** LK — lotes ATIVOS da fazenda (farm-scoped via HasFarmTenantScope), sem
   *  AJAX, mirror `ManagementBatchReportOptionsData['batches']` (F-279). */
  batches: TransferBatchGrazingAreaBatchRef[];
}

export interface TransferBatchGrazingAreaReportFilterForm {
  start_date: string | null;
  end_date: string | null;
  batch_id: Option<string> | null;
}

/** Payload REAL — nomes 1:1 com `TransferBatchGrazingAreaReportRequest::rules()`
 *  (`F-329-plano-api.md §2`). `batch_id` já é uuid cru no envio (NÃO objeto Option). */
export interface TransferBatchGrazingAreaReportParams {
  start_date: string;
  end_date: string;
  batch_id?: string;
}
