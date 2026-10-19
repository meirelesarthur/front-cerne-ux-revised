// src/services/v2/Dashboards/livestockDashboard-service.ts
// Service da dashboard Pecuária de Corte (execução 048, TASK-05-FE).
//
//   GET /api/v1/dashboards/livestock?harvest_uuid&start_date&end_date&breed_id&category_id
//     → data: LivestockDashboardData (agregado NÃO paginado, 3 "abas" no
//       mesmo payload — front só usa campos flat, nunca navegação por aba,
//       ver nota em `@/@types/v2/Dashboards/livestockDashboard`)
//
// Endpoint ainda PLANEJADO no momento desta Tarefa (`CONTRATO-API-048-05`,
// contrato APPROVED_WITH_NOTES com readback MCP confirmado — Onda 1
// API-arch publica em paralelo). Cascata Safra→datas REUSA `getHarvest`
// (`@/services/v2/Harvests/harvest-service`), mesmo padrão de
// `abcIndicators-service.ts` — nenhum endpoint novo de safra.
// `X-Farm-Id` anexado automaticamente pelo interceptor de `@/services/api.ts`.

import api from '@/services/api';

import type { Response } from '@/@types/response-api';
import type {
  LivestockDashboardData,
  LivestockDashboardFilterRequest,
} from '@/@types/v2/Dashboards/livestockDashboard';

async function getLivestockDashboard(
  params: LivestockDashboardFilterRequest
): Promise<Response<LivestockDashboardData>> {
  const { data } = await api.V2.get<Response<LivestockDashboardData>>('/dashboards/livestock', {
    harvest_uuid: params.harvest_uuid,
    start_date: params.start_date,
    end_date: params.end_date,
    breed_uuid: params.breed_uuid,
    category_uuid: params.category_uuid,
  });
  return data;
}

export { getLivestockDashboard };
