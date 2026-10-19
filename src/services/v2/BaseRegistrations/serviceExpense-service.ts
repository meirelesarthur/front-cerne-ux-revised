// src/services/v2/BaseRegistrations/serviceExpense-service.ts
// -----------------------------------------------------------------------------
// Service Expense Service — API v1 do backend Laravel GB.Cerne (Serviços).
//
// Contrato (envelope ApiResponse): { success, message, data, errors, meta }.
//   GET    /service-expenses          → data: ServiceExpenseListItem[] + meta
//                                        de paginação (UNIVERSAL do contrato
//                                        §6, default 10)
//   GET    /service-expenses/{uuid}   → data: ServiceExpenseDetail (alias
//                                        estrutural de ServiceExpenseListItem
//                                        — sem agregação extra)
//   POST   /service-expenses          → payload ServiceExpensePayload
//   PUT    /service-expenses/{uuid}   → payload ServiceExpensePayload
//   DELETE /service-expenses/{uuid}   → 204, ou 422 (BusinessRuleException,
//                                        "Serviço está em uso...") se
//                                        referenciado em
//                                        charge_expense_ancillaries
//
// `listServiceExpenses` ADAPTA o envelope paginado do backend ({ data: [],
// meta: {} }) para o shape `ResponsePagination` ({ data: { items, pagination } })
// que a infra de grid do projeto (useCustomGridQuery/TableProvider) consome —
// mesmo truque de `listReversalExpenses`/`listWarehouses` — nenhum hook global
// precisa mudar.
// -----------------------------------------------------------------------------

import api from '@/services/api';

import type { PaginationQueryParams } from '@/@types/pagination';
import type { Response, ResponsePagination } from '@/@types/response-api';
import type {
  ServiceExpenseDetail,
  ServiceExpenseListItem,
  ServiceExpensePayload,
  ServiceExpensesListEnvelope,
} from '@/@types/v2/BaseRegistrations/serviceExpense';

export interface ListServiceExpensesParams extends PaginationQueryParams {
  search?: string;
  is_enabled?: 'true' | 'false';
}

async function listServiceExpenses(
  params: ListServiceExpensesParams
): Promise<ResponsePagination<ServiceExpenseListItem[]>> {
  const { data } = await api.V2.get<ServiceExpensesListEnvelope>('/service-expenses', {
    page: params.page,
    per_page: params.per_page,
    search: params.search || undefined,
    is_enabled: params.is_enabled || undefined,
  });

  // Adaptação envelope ApiResponse::paginated → ResponsePagination (grid).
  return {
    success: data.success,
    message: data.message,
    data: {
      items: data.data,
      pagination: {
        total: data.meta?.total ?? data.data.length,
        count: data.data.length,
        per_page: data.meta?.per_page ?? data.data.length,
        current_page: data.meta?.current_page ?? 1,
        total_pages: data.meta?.last_page ?? 1,
      },
    },
  };
}

async function getServiceExpense(serviceExpenseUuid: string) {
  const { data } = await api.V2.get<Response<ServiceExpenseDetail>>(
    `/service-expenses/${serviceExpenseUuid}`
  );
  return data;
}

async function createServiceExpense(payload: ServiceExpensePayload) {
  const { data } = await api.V2.post<Response<ServiceExpenseDetail>>('/service-expenses', payload);
  return data;
}

async function updateServiceExpense(serviceExpenseUuid: string, payload: ServiceExpensePayload) {
  const { data } = await api.V2.put<Response<ServiceExpenseDetail>>(
    `/service-expenses/${serviceExpenseUuid}`,
    payload
  );
  return data;
}

async function deleteServiceExpense(serviceExpenseUuid: string) {
  const { data } = await api.V2.delete(`/service-expenses/${serviceExpenseUuid}`);
  return data;
}

export {
  createServiceExpense,
  deleteServiceExpense,
  getServiceExpense,
  listServiceExpenses,
  updateServiceExpense,
};
