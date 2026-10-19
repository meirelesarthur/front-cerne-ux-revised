// src/services/v2/Dashboards/depreciationDashboard-service.ts
// Service da dashboard Depreciações (execução 048, TASK-02-FE).
//
//   GET /api/v1/dashboards/depreciation?year=&asset_type=all|equipment|animal
//     → data: DepreciationDashboardData (agregado NÃO paginado)
//
// Contrato APROVADO/LIBERADO (`CONTRATO-API-048-02-depreciation-dashboard.md`)
// — shape final, não especulativo. `X-Farm-Id` anexado automaticamente pelo
// interceptor de `@/services/api.ts`.

import api from '@/services/api';

import type { Response } from '@/@types/response-api';
import type {
  DepreciationDashboardData,
  DepreciationDashboardFilterRequest,
} from '@/@types/v2/Dashboards/depreciationDashboard';

async function getDepreciationDashboard(
  params: DepreciationDashboardFilterRequest
): Promise<Response<DepreciationDashboardData>> {
  const { data } = await api.V2.get<Response<DepreciationDashboardData>>(
    '/dashboards/depreciation',
    {
      year: params.year,
      asset_type: params.asset_type,
    }
  );
  return data;
}

export { getDepreciationDashboard };
