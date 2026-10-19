// src/services/v2/Relatorios/costing-livestock-area-report-service.ts
// -----------------------------------------------------------------------------
// Relatório "Custeio/Área Pecuária" (F-251, CusteioAreaPecuaria-contrato-api.md
// §7, lote 076) — mirror ESTRUTURAL de `production-costing-area-report-service.ts`
// (F-298, precedente mais próximo), acrescido de `grazings` (3º universo de
// options desta tela) e `grazing_uuids` (3º filtro de array do PDF).
//
// Endpoints confirmados por leitura DIRETA de
// `GB.Cerne.Api/app/Http/Controllers/Api/V1/CostingLivestockAreaReportController.php`
// e `routes/api.php:1741-1744`:
//   - `GET /api/v1/costing-livestock-area-report/options` — envelope
//     `{success,message,data,errors,meta}`, `data.production_cycles`/
//     `data.areas`/`data.grazings` (mirror `AreaController::options()`).
//   - `GET /api/v1/costing-livestock-area-report` — PDF binário, SEM
//     envelope (mesma exceção documentada em `dre-report-service.ts`),
//     `responseType:'blob'` obrigatório.
//
// SEM `farm_id`/`X-Farm-Id` explícito no payload — o client já injeta o
// header automaticamente (`get_spa_api_client_pattern §2`).
// -----------------------------------------------------------------------------

import api from '@/services/api';

import type { Response } from '@/@types/response-api';
import type {
  CostingLivestockAreaReportOptionsData,
  CostingLivestockAreaReportParams,
} from '@/@types/v2/Relatorios/costing-livestock-area-report';

interface CostingLivestockAreaReportOptionsResponse {
  production_cycles: CostingLivestockAreaReportOptionsData['productionCycles'];
  areas: CostingLivestockAreaReportOptionsData['areas'];
  grazings: CostingLivestockAreaReportOptionsData['grazings'];
}

async function getCostingLivestockAreaReportOptions(): Promise<CostingLivestockAreaReportOptionsData> {
  const { data } = await api.V2.get<Response<CostingLivestockAreaReportOptionsResponse>>(
    '/costing-livestock-area-report/options'
  );
  return {
    productionCycles: data.data.production_cycles,
    areas: data.data.areas,
    grazings: data.data.grazings,
  };
}

async function downloadCostingLivestockAreaReportPdf(
  params: CostingLivestockAreaReportParams
): Promise<Blob> {
  const { data } = await api.V2.get<Blob>(
    '/costing-livestock-area-report',
    {
      production_cycle_uuid: params.production_cycle_uuid || undefined,
      area_uuids: params.area_uuids?.length ? params.area_uuids : undefined,
      grazing_uuids: params.grazing_uuids?.length ? params.grazing_uuids : undefined,
      start_date: params.start_date,
      end_date: params.end_date,
    },
    { responseType: 'blob' }
  );
  return data;
}

export { downloadCostingLivestockAreaReportPdf, getCostingLivestockAreaReportOptions };
