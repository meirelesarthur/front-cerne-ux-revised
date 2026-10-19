// src/services/v2/Dashboards/financialDashboard-service.ts
// Service da dashboard Financeiro (execução 048, TASK-04-FE).
//
//   GET /api/v1/dashboards/financial?year&month&cost_center_uuid
//     → data: FinancialDashboardData (agregado NÃO paginado)
//
// Endpoint ainda PLANEJADO no momento desta Tarefa (`CONTRATO-API-048-04`,
// contrato APPROVED_WITH_NOTES com readback MCP confirmado — Onda 1
// API-arch publica em paralelo). O `queryFn` aponta para o path já
// acordado; não é mock. **DEC-191: sem bloco de heatmap** — nenhum campo
// nem parâmetro relacionado a "receita por hora" existe aqui, de propósito.
// `X-Farm-Id` anexado automaticamente pelo interceptor de `@/services/api.ts`.

import api from '@/services/api';

import type { Response } from '@/@types/response-api';
import type {
  FinancialDashboardData,
  FinancialDashboardFilterRequest,
} from '@/@types/v2/Dashboards/financialDashboard';

async function getFinancialDashboard(
  params: FinancialDashboardFilterRequest
): Promise<Response<FinancialDashboardData>> {
  const { data } = await api.V2.get<Response<FinancialDashboardData>>('/dashboards/financial', {
    year: params.year,
    month: params.month,
    cost_center_uuid: params.cost_center_uuid,
  });
  return data;
}

export { getFinancialDashboard };
