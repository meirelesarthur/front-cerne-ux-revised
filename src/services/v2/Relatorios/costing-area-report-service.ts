// src/services/v2/Relatorios/costing-area-report-service.ts
// -----------------------------------------------------------------------------
// Relatório "Custeio/Área" (F-252, `CostingAreaReportController`, esteira
// CORE_WORKSPACE/97-Esteiras/079, TASK-252-FE-01) — tela NOVA, distinta de
// `production-costing-area-report-service.ts` (F-298, endpoint/permissão
// diferentes).
//
// Endpoints confirmados por leitura DIRETA de
// `GB.Cerne.Api/app/Http/Controllers/Api/V1/CostingAreaReportController.php`
// e `routes/api.php:1839-1842`:
//   - `GET /api/v1/costing-area-report/options` — envelope
//     `{success,message,data,errors,meta}`, `data.production_cycles`/
//     `data.areas` (mirror `production-costing-area-report-service.ts`).
//   - `GET /api/v1/costing-area-report` — PDF binário, SEM envelope (mesma
//     exceção documentada em `dre-report-service.ts`), `responseType:'blob'`
//     obrigatório.
//
// SEM `farm_id`/`X-Farm-Id` explícito no payload — o client já injeta o
// header automaticamente (`get_spa_api_client_pattern §2`).
// -----------------------------------------------------------------------------

import api from '@/services/api';

import type { Response } from '@/@types/response-api';
import type {
  CostingAreaReportOptionsData,
  CostingAreaReportParams,
} from '@/@types/v2/Relatorios/costing-area-report';

interface CostingAreaReportOptionsResponse {
  production_cycles: CostingAreaReportOptionsData['productionCycles'];
  areas: CostingAreaReportOptionsData['areas'];
}

async function getCostingAreaReportOptions(): Promise<CostingAreaReportOptionsData> {
  const { data } = await api.V2.get<Response<CostingAreaReportOptionsResponse>>(
    '/costing-area-report/options'
  );
  return {
    productionCycles: data.data.production_cycles,
    areas: data.data.areas,
  };
}

async function downloadCostingAreaReportPdf(params: CostingAreaReportParams): Promise<Blob> {
  const { data } = await api.V2.get<Blob>(
    '/costing-area-report',
    {
      production_cycle_uuid: params.production_cycle_uuid || undefined,
      area_uuids: params.area_uuids?.length ? params.area_uuids : undefined,
      start_date: params.start_date,
      end_date: params.end_date,
    },
    { responseType: 'blob' }
  );
  return data;
}

export { downloadCostingAreaReportPdf, getCostingAreaReportOptions };
