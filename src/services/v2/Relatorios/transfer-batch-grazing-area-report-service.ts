// src/services/v2/Relatorios/transfer-batch-grazing-area-report-service.ts
// -----------------------------------------------------------------------------
// Relatório "Transf/Lote/Módulo/Área" (F-329, esteira
// CORE_WORKSPACE/97-Esteiras/077, F-329-plano-front.md). Mirror ESTRUTURAL de
// `management-batch-report-service.ts` (F-279) REMOVENDO `category`.
//
// Endpoints (F-329-plano-api.md):
//   - `GET /api/v1/transfer-batch-grazing-area-report/options` — envelope
//     `{success,message,data,errors,meta}`, `data.batches` (agregado,
//     `{uuid,label}`).
//   - `GET /api/v1/transfer-batch-grazing-area-report` — PDF binário, SEM
//     envelope (mesma exceção documentada em `management-batch-report-
//     service.ts`), `responseType:'blob'` obrigatório. SEM `report_type`
//     (PDF-only, sem seletor de formato).
//
// SEM `farm_id`/`X-Farm-Id` explícito no payload — o client já injeta o
// header automaticamente (`get_spa_api_client_pattern §2`).
// -----------------------------------------------------------------------------

import api from '@/services/api';

import type { Response } from '@/@types/response-api';
import type {
  TransferBatchGrazingAreaReportOptionsData,
  TransferBatchGrazingAreaReportParams,
} from '@/@types/v2/Relatorios/transfer-batch-grazing-area-report';

interface TransferBatchGrazingAreaReportOptionsResponse {
  batches: TransferBatchGrazingAreaReportOptionsData['batches'];
}

async function getTransferBatchGrazingAreaReportOptions(): Promise<TransferBatchGrazingAreaReportOptionsData> {
  const { data } = await api.V2.get<Response<TransferBatchGrazingAreaReportOptionsResponse>>(
    '/transfer-batch-grazing-area-report/options'
  );
  return { batches: data.data.batches };
}

async function downloadTransferBatchGrazingAreaReportPdf(
  params: TransferBatchGrazingAreaReportParams
): Promise<Blob> {
  const { data } = await api.V2.get<Blob>(
    '/transfer-batch-grazing-area-report',
    {
      start_date: params.start_date,
      end_date: params.end_date,
      batch_id: params.batch_id || undefined,
    },
    { responseType: 'blob' }
  );
  return data;
}

export { downloadTransferBatchGrazingAreaReportPdf, getTransferBatchGrazingAreaReportOptions };
