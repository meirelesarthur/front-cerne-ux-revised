// src/services/v2/SupplyDashboard/supply-dashboard-service.ts
// -----------------------------------------------------------------------------
// Supply Dashboard Service — API v1 (GB.Cerne.Api), Tarefa 38.
//
// GET /api/v1/supply-dashboard — leitura agregada, envelope `ApiResponse`
// PADRÃO (`Response<T>`) — DIFERENTE de `supply-status-sla-report-service.ts`
// (aquele é download/blob de relatório; este é JSON normal, mirror
// `farm-service.ts`/`harvest-service.ts::getHarvest`).
//
// `farm_ids` vai como array de verdade na querystring (`farm_ids[]=uuid...`,
// serialização default do axios para arrays) — AD-04 do contrato corrige por
// construção o bug de encoding HTML do legado (nunca filtrava nada).
// `harvest_id` é enviado só por simetria (AD-05) — o backend não o usa para
// filtrar o dataset.
// -----------------------------------------------------------------------------

import api from '@/services/api';

import type { Response } from '@/@types/response-api';
import type {
  SupplyDashboardData,
  SupplyDashboardFilterRequest,
} from '@/@types/v2/SupplyDashboard';

async function getSupplyDashboard(
  filters: SupplyDashboardFilterRequest
): Promise<Response<SupplyDashboardData>> {
  const { data } = await api.V2.get<Response<SupplyDashboardData>>('/supply-dashboard', {
    farm_ids: filters.farm_ids?.length ? filters.farm_ids : undefined,
    harvest_id: filters.harvest_id || undefined,
    start_date: filters.start_date || undefined,
    end_date: filters.end_date || undefined,
  });
  return data;
}

export { getSupplyDashboard };
