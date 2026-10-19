// src/services/v2/Dashboards/feedlotDashboard-service.ts
// Service da dashboard Lotação de Currais (execução 046, TASK-LC-FE-02).
//
//   GET /api/v1/dashboards/feedlot?yard_uuid&sector_uuids[]
//     → data: FeedlotDashboardData (agregado NÃO paginado)
//   GET /api/v1/dashboards/feedlot/sectors?yard_uuid
//     → data: FeedlotDashboardSectorOption[] (cascata `LC-CASCADE-01`,
//       `ORDER BY priority ASC` já resolvido no servidor)
//
// `X-Farm-Id` anexado automaticamente pelo interceptor de `@/services/api.ts`.

import api from '@/services/api';

import type { Response } from '@/@types/response-api';
import type {
  FeedlotDashboardData,
  FeedlotDashboardFilterRequest,
  FeedlotDashboardSectorOption,
} from '@/@types/v2/Dashboards/feedlotDashboard';

async function getFeedlotDashboard(
  params: FeedlotDashboardFilterRequest
): Promise<Response<FeedlotDashboardData>> {
  const { data } = await api.V2.get<Response<FeedlotDashboardData>>('/dashboards/feedlot', {
    yard_uuid: params.yard_uuid,
    sector_uuids: params.sector_uuids,
  });
  return data;
}

async function listSectorsByYard(
  yardUuid: string
): Promise<Response<FeedlotDashboardSectorOption[]>> {
  const { data } = await api.V2.get<Response<FeedlotDashboardSectorOption[]>>(
    '/dashboards/feedlot/sectors',
    { yard_uuid: yardUuid }
  );
  return data;
}

export { getFeedlotDashboard, listSectorsByYard };
