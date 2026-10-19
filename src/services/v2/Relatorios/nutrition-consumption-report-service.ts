// src/services/v2/Relatorios/nutrition-consumption-report-service.ts
// -----------------------------------------------------------------------------
// Relatório "Nutrição/Lote" (F-288, `NutritionConsumptionReportController`,
// esteira CORE_WORKSPACE/97-Esteiras/053, TASK-288-FE-01) — mirror
// ESTRUTURAL de `management-batch-report-service.ts` (F-279).
//
// Endpoints confirmados por leitura DIRETA de
// `GB.Cerne.Api/app/Http/Controllers/Api/V1/NutritionConsumptionReportController.php`
// e `routes/api.php:1732-1737`:
//   - `GET /api/v1/nutrition-consumption-report/options` — envelope
//     `{success,message,data,errors,meta}`, `data.categories`/`data.batches`
//     (`CategoryAnimalOptionResource`/`BatchOptionResource`, ambos
//     `{uuid,label}` — NÃO `{uuid,description}`).
//   - `GET /api/v1/nutrition-consumption-report` — binário
//     (`application/pdf` inline OU `.xlsx` conforme `format`), SEM envelope
//     (mesma exceção documentada em `management-batch-report-service.ts`/
//     `stock-provider-lot-report-service.ts`), `responseType:'blob'`
//     obrigatório.
//
// SEM `farm_id`/`X-Farm-Id` explícito no payload — o client já injeta o
// header automaticamente (`get_spa_api_client_pattern §2`).
// -----------------------------------------------------------------------------

import api from '@/services/api';

import type { Response } from '@/@types/response-api';
import type {
  NutritionConsumptionReportOptionsData,
  NutritionConsumptionReportParams,
} from '@/@types/v2/Relatorios/nutrition-consumption-report';

interface NutritionConsumptionReportOptionsResponse {
  categories: NutritionConsumptionReportOptionsData['categories'];
  batches: NutritionConsumptionReportOptionsData['batches'];
}

async function getNutritionConsumptionReportOptions(): Promise<NutritionConsumptionReportOptionsData> {
  const { data } = await api.V2.get<Response<NutritionConsumptionReportOptionsResponse>>(
    '/nutrition-consumption-report/options'
  );
  return {
    categories: data.data.categories,
    batches: data.data.batches,
  };
}

async function downloadNutritionConsumptionReport(
  params: NutritionConsumptionReportParams
): Promise<Blob> {
  const { data } = await api.V2.get<Blob>(
    '/nutrition-consumption-report',
    {
      category: params.category || undefined,
      batch: params.batch || undefined,
      start_date: params.start_date,
      end_date: params.end_date,
      format: params.format,
    },
    { responseType: 'blob' }
  );
  return data;
}

export { downloadNutritionConsumptionReport, getNutritionConsumptionReportOptions };
