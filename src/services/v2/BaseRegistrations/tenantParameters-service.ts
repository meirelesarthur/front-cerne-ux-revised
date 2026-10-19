// src/services/v2/BaseRegistrations/tenantParameters-service.ts
// -----------------------------------------------------------------------------
// Tenant Parameter Service — API v1 do backend Laravel GB.Cerne
// (Parametrizações do Tenant).
//
// Contrato (envelope ApiResponse): { success, message, data, errors, meta }.
//   GET /tenant-parameters → data: TenantParameterData (defaults aplicados
//                             pelo backend quando o tenant ainda não tem
//                             nenhuma linha).
//   PUT /tenant-parameters → payload TenantParameterPayload (upsert,
//                             `sometimes` por campo — mas o form sempre
//                             envia o objeto completo hoje).
//
// Rota SINGULAR (sem `{uuid}`) — não há endereçamento individual de registro
// (D5 do contrato). Dentro do bloco `farm.context` ESTRITO do backend (D1) —
// X-Farm-Id é anexado automaticamente pelo interceptor de
// src/services/api.ts (localStorage 'app-active-farm') — NUNCA setar
// manualmente aqui; sem farm ativa, o backend responde 403 imediato (guard de
// UI feito na tela, ver TASK-FE-071).
// -----------------------------------------------------------------------------

import api from '@/services/api';

import type { Response } from '@/@types/response-api';
import type {
  TenantParameterData,
  TenantParameterPayload,
} from '@/@types/v2/BaseRegistrations/tenantParameters';

async function getTenantParameters() {
  const { data } = await api.V2.get<Response<TenantParameterData>>('/tenant-parameters');
  return data;
}

async function updateTenantParameters(payload: TenantParameterPayload) {
  const { data } = await api.V2.put<Response<TenantParameterData>>('/tenant-parameters', payload);
  return data;
}

export { getTenantParameters, updateTenantParameters };
