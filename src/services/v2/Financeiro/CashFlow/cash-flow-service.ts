// src/services/v2/Financeiro/CashFlow/cash-flow-service.ts
// -----------------------------------------------------------------------------
// Service HTTP do relatório "Fluxo Bancário" (F-107, esteira 070,
// TASK-CF-FE-01). Endpoint único, já `CONTRATO_AUTOAPROVADO`:
//   GET /cashflow → payload plano `CashFlowReport` (ApiResponse::success,
//   SEM meta/paginação — não é uma listagem CRUD).
//
// Client real: `api.V2.get` (namespace da instância Axios do wrapper
// `services/api.ts`) — o exemplo ilustrativo do contrato de tela §5/da
// Tarefa usa `api.get` genérico, que NÃO existe neste repositório
// (confirmado por leitura de `services/api.ts` + grep: 0 ocorrências de
// `api.get(` cru fora de mocks). Mirror exato de
// `account-service.ts::getAccount`. `X-Farm-Id` propagado pelo interceptor
// genérico — sem manipulação manual aqui.
// -----------------------------------------------------------------------------

import api from '@/services/api';

import type { Response } from '@/@types/response-api';
import type { CashFlowFilterParams, CashFlowReport } from '@/@types/v2/Financeiro/cash-flow';

export async function getCashFlowReport(params: CashFlowFilterParams) {
  const { data } = await api.V2.get<Response<CashFlowReport>>('/cashflow', params);
  return data;
}
