// src/services/v2/BaseRegistrations/reversalExpenses-service.ts
// -----------------------------------------------------------------------------
// Reversal Expense Service — API v1 do backend Laravel GB.Cerne (Estorno).
//
// Contrato (envelope ApiResponse): { success, message, data, errors, meta }.
//   GET    /reversal-expenses          → data: ReversalExpenseListItem[] + meta
//                                         de paginação (UNIVERSAL do contrato
//                                         §6, default 10)
//   GET    /reversal-expenses/{uuid}   → data: ReversalExpenseDetail (alias
//                                         estrutural de ReversalExpenseListItem
//                                         — sem agregação extra)
//   POST   /reversal-expenses          → payload ReversalExpensePayload
//   PUT    /reversal-expenses/{uuid}   → payload ReversalExpensePayload
//   DELETE /reversal-expenses/{uuid}   → 204, ou 422 (BusinessRuleException,
//                                         mensagem "Estorno está em uso e não
//                                         pode ser excluída.") se referenciado
//                                         em charge_expense_ancillaries
//
// `listReversalExpenses` ADAPTA o envelope paginado do backend ({ data: [],
// meta: {} }) para o shape `ResponsePagination` ({ data: { items, pagination } })
// que a infra de grid do projeto (useCustomGridQuery/TableProvider) consome —
// mesmo truque de `listWarehouses`/`listPaymentTerms` — nenhum hook global
// precisa mudar.
// -----------------------------------------------------------------------------

import api from '@/services/api';

import type { PaginationQueryParams } from '@/@types/pagination';
import type { Response, ResponsePagination } from '@/@types/response-api';
import type {
  ReversalExpenseDetail,
  ReversalExpenseListItem,
  ReversalExpensePayload,
  ReversalExpensesListEnvelope,
} from '@/@types/v2/BaseRegistrations/reversalExpenses';

export interface ListReversalExpensesParams extends PaginationQueryParams {
  search?: string;
  is_enabled?: 'true' | 'false';
}

async function listReversalExpenses(
  params: ListReversalExpensesParams
): Promise<ResponsePagination<ReversalExpenseListItem[]>> {
  const { data } = await api.V2.get<ReversalExpensesListEnvelope>('/reversal-expenses', {
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

async function getReversalExpense(reversalExpenseUuid: string) {
  const { data } = await api.V2.get<Response<ReversalExpenseDetail>>(
    `/reversal-expenses/${reversalExpenseUuid}`
  );
  return data;
}

async function createReversalExpense(payload: ReversalExpensePayload) {
  const { data } = await api.V2.post<Response<ReversalExpenseDetail>>(
    '/reversal-expenses',
    payload
  );
  return data;
}

async function updateReversalExpense(reversalExpenseUuid: string, payload: ReversalExpensePayload) {
  const { data } = await api.V2.put<Response<ReversalExpenseDetail>>(
    `/reversal-expenses/${reversalExpenseUuid}`,
    payload
  );
  return data;
}

async function deleteReversalExpense(reversalExpenseUuid: string) {
  const { data } = await api.V2.delete(`/reversal-expenses/${reversalExpenseUuid}`);
  return data;
}

export {
  createReversalExpense,
  deleteReversalExpense,
  getReversalExpense,
  listReversalExpenses,
  updateReversalExpense,
};
