// src/services/v2/Relatorios/production-costing-area-report-service.ts
// -----------------------------------------------------------------------------
// Relatório "Produção/Custeio/Área" (F-298, `ProductionCostingAreaReportController`,
// esteira CORE_WORKSPACE/97-Esteiras/051, TASK-298-FE-01) — CANÁRIO da tela de
// relatório em código para o fan-out (F-279/F-238/F-315/F-326).
//
// Endpoints confirmados por leitura DIRETA de
// `GB.Cerne.Api/app/Http/Controllers/Api/V1/ProductionCostingAreaReportController.php`
// e `routes/api.php:1667-1670`:
//   - `GET /api/v1/production-costing-area-report/options` — envelope
//     `{success,message,data,errors,meta}`, `data.production_cycles`/
//     `data.areas` (mirror `AreaController::options()`).
//   - `GET /api/v1/production-costing-area-report` — PDF binário, SEM
//     envelope (mesma exceção documentada em `dre-report-service.ts`),
//     `responseType:'blob'` obrigatório.
//
// SEM `farm_id`/`X-Farm-Id` explícito no payload — o client já injeta o
// header automaticamente (`get_spa_api_client_pattern §2`).
// -----------------------------------------------------------------------------

import api from '@/services/api';

import type { Response } from '@/@types/response-api';
import type {
  ProductionCostingAreaReportOptionsData,
  ProductionCostingAreaReportParams,
} from '@/@types/v2/Relatorios/production-costing-area-report';

interface ProductionCostingAreaReportOptionsResponse {
  production_cycles: ProductionCostingAreaReportOptionsData['productionCycles'];
  areas: ProductionCostingAreaReportOptionsData['areas'];
}

async function getProductionCostingAreaReportOptions(): Promise<ProductionCostingAreaReportOptionsData> {
  const { data } = await api.V2.get<Response<ProductionCostingAreaReportOptionsResponse>>(
    '/production-costing-area-report/options'
  );
  return {
    productionCycles: data.data.production_cycles,
    areas: data.data.areas,
  };
}

async function downloadProductionCostingAreaReportPdf(
  params: ProductionCostingAreaReportParams
): Promise<Blob> {
  const { data } = await api.V2.get<Blob>(
    '/production-costing-area-report',
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

export { downloadProductionCostingAreaReportPdf, getProductionCostingAreaReportOptions };
