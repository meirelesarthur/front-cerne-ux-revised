// src/services/v2/Dashboards/cashbookDashboard-service.ts
// Service da dashboard Livro Caixa (execução 048, TASK-03-FE).
//
//   GET /api/v1/cash-book-dashboard?year&proprietary_id&operation
//     → data: CashbookDashboardData (agregado NÃO paginado)
//   GET /api/v1/cash-book-dashboard/movements?year&month&proprietary_id&operation
//     → data: CashbookMovementRow[]
//
// Backend JÁ EXISTE (`CashBookDashboardController`) — este service só
// consome, sem recriar rota. `X-Farm-Id` anexado automaticamente pelo
// interceptor de `@/services/api.ts`.

import api from '@/services/api';

import type { Response } from '@/@types/response-api';
import type {
  CashbookDashboardData,
  CashbookDashboardFilterRequest,
  CashbookMovementRow,
  CashbookMovementsFilterRequest,
} from '@/@types/v2/Dashboards/cashbookDashboard';

async function getCashbookDashboard(
  params: CashbookDashboardFilterRequest
): Promise<Response<CashbookDashboardData>> {
  const { data } = await api.V2.get<Response<CashbookDashboardData>>('/cash-book-dashboard', {
    year: params.year,
    proprietary_id: params.proprietary_id,
    operation: params.operation,
  });
  return data;
}

async function getCashbookMovements(
  params: CashbookMovementsFilterRequest
): Promise<Response<CashbookMovementRow[]>> {
  const { data } = await api.V2.get<Response<CashbookMovementRow[]>>(
    '/cash-book-dashboard/movements',
    {
      year: params.year,
      month: params.month,
      proprietary_id: params.proprietary_id,
      operation: params.operation,
    }
  );
  return data;
}

export { getCashbookDashboard, getCashbookMovements };
