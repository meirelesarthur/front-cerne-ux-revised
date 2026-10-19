// src/services/v2/Dashboards/userAnalysis-service.ts
// Service da dashboard Análise de Usuários (execução 046, TASK-UA-FE-02;
// atualizado por PLANO-ADMIN-USER-ANALYSIS §4).
//
//   GET /api/v1/dashboards/user-analysis?period=5|15|30|60|90&tenant_uuid=
//     → data: UserAnalysisDashboardData (agregado NÃO paginado — `meta` aqui
//       é o `DashboardMeta` de proxies/lacunas, não paginação).
//
// `X-Farm-Id` anexado automaticamente pelo interceptor de `@/services/api.ts`
// quando há farm ativa. Rota agora vive em `farm.context.optional` — o admin
// `Gestor_Plataf` farm-less chama SEM o header, propagando `tenant_uuid` no
// lugar (ver `CONTRATO-API-046-01-user-analysis.md §1`). `tenant_uuid` só
// deve chegar aqui já resolvido pela tela — a chamada NUNCA dispara para o
// admin sem contratante escolhido (`enabled: false` na query, `index.tsx`).

import api from '@/services/api';

import type { Response } from '@/@types/response-api';
import type {
  UserAnalysisDashboardData,
  UserAnalysisFilterRequest,
} from '@/@types/v2/Dashboards/userAnalysis';

async function getUserAnalysisDashboard(
  params: UserAnalysisFilterRequest
): Promise<Response<UserAnalysisDashboardData>> {
  const { data } = await api.V2.get<Response<UserAnalysisDashboardData>>(
    '/dashboards/user-analysis',
    { period: params.period, tenant_uuid: params.tenant_uuid }
  );
  return data;
}

export { getUserAnalysisDashboard };
