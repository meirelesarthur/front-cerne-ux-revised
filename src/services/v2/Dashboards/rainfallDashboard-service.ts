// src/services/v2/Dashboards/rainfallDashboard-service.ts
// Service da dashboard Pluviometria (execução 048, TASK-01-FE).
//
//   GET /api/v1/dashboards/rainfall?area_uuid=&period=30d|90d|12m
//     → data: RainfallDashboardData (agregado NÃO paginado)
//
// Endpoint ainda PLANEJADO no momento desta Tarefa (`CONTRATO-API-048-01`,
// status "handover BLOQUEADO" — Onda 1 API-arch em paralelo). O `queryFn`
// aponta para o path já acordado no contrato; não é mock — é o contrato
// esperado, consumido assim que o backend publicar (TASK-01-FE §"Riscos").
// `X-Farm-Id` anexado automaticamente pelo interceptor de `@/services/api.ts`
// — a fazenda corrente nunca é enviada como parâmetro (contrato §3, tenancy
// resolvida sempre no backend).

import api from '@/services/api';

import type { Response } from '@/@types/response-api';
import type {
  RainfallDashboardData,
  RainfallDashboardFilterRequest,
} from '@/@types/v2/Dashboards/rainfallDashboard';

async function getRainfallDashboard(
  params: RainfallDashboardFilterRequest
): Promise<Response<RainfallDashboardData>> {
  const { data } = await api.V2.get<Response<RainfallDashboardData>>('/dashboards/rainfall', {
    area_uuid: params.area_uuid,
    period: params.period,
  });
  return data;
}

export { getRainfallDashboard };
