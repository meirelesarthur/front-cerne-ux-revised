// src/services/v2/Relatorios/management-batch-report-service.ts
// -----------------------------------------------------------------------------
// Relatório "Manejo/Lote" (F-279, `ManagementBatchReportController`, esteira
// CORE_WORKSPACE/97-Esteiras/051, TASK-279-FE-01) — fan-out do canário F-298
// (`production-costing-area-report-service.ts`).
//
// Endpoints confirmados por leitura DIRETA de
// `GB.Cerne.Api/app/Http/Controllers/Api/V1/ManagementBatchReportController.php`
// e `routes/api.php:1688-1691`:
//   - `GET /api/v1/management-batch-report/options` — envelope
//     `{success,message,data,errors,meta}`, `data.categories`/`data.batches`
//     (`CategoryAnimalOptionResource`/`BatchOptionResource`, ambos
//     `{uuid,label}` — NÃO `{uuid,description}`).
//   - `GET /api/v1/management-batch-report` — PDF binário, SEM envelope
//     (mesma exceção documentada em `dre-report-service.ts`/
//     `production-costing-area-report-service.ts`), `responseType:'blob'`
//     obrigatório.
//
// SEM `farm_id`/`X-Farm-Id` explícito no payload — o client já injeta o
// header automaticamente (`get_spa_api_client_pattern §2`).
// -----------------------------------------------------------------------------

import api from '@/services/api';

import type { Response } from '@/@types/response-api';
import type {
  ManagementBatchReportOptionsData,
  ManagementBatchReportParams,
} from '@/@types/v2/Relatorios/management-batch-report';

interface ManagementBatchReportOptionsResponse {
  categories: ManagementBatchReportOptionsData['categories'];
  batches: ManagementBatchReportOptionsData['batches'];
}

async function getManagementBatchReportOptions(): Promise<ManagementBatchReportOptionsData> {
  const { data } = await api.V2.get<Response<ManagementBatchReportOptionsResponse>>(
    '/management-batch-report/options'
  );
  return {
    categories: data.data.categories,
    batches: data.data.batches,
  };
}

async function downloadManagementBatchReportPdf(
  params: ManagementBatchReportParams
): Promise<Blob> {
  const { data } = await api.V2.get<Blob>(
    '/management-batch-report',
    {
      category: params.category || undefined,
      batch: params.batch || undefined,
      start_date: params.start_date,
      end_date: params.end_date,
    },
    { responseType: 'blob' }
  );
  return data;
}

export { downloadManagementBatchReportPdf, getManagementBatchReportOptions };
