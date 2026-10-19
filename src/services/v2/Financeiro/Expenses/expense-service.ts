// src/services/v2/Financeiro/Expenses/expense-service.ts
// -----------------------------------------------------------------------------
// Expense Service — API v1 do backend Laravel GB.Cerne ("Contas a Pagar"),
// esteira 036 (TASK-FE-036-101).
//
// Contrato (envelope ApiResponse): { success, message, data, errors, meta }.
//   GET    /expenses           → paginado; eager-load SÓ provider+type
//                                 (ExpenseRepository::listWithFilters — SEM
//                                 branch/proprietary/harvest/categories/
//                                 write_offs, só no show/store/update).
//   GET    /expenses/{uuid}    → detalhe completo (categories[]+write_offs[]).
//   POST   /expenses           → cascata completa (rateio + parcelamento +
//                                 baixa automática, quando aplicável).
//   PUT    /expenses/{uuid}    → `installments`/`document_ids` não se
//                                 aplicam (Action nunca os toca); campos
//                                 financeiros/rateio bloqueados com 422 se
//                                 houver baixa e o payload divergir do atual
//                                 (GAP-FE-036-106/107 — reenviar idêntico).
//   DELETE /expenses/{uuid}    → 422 se vinculada a Invoice com baixa
//                                 (mensagem real do backend).
//
// Rota dentro de `farm.context` — X-Farm-Id anexado automaticamente pelo
// interceptor genérico de `@/services/api.ts`.
//
// `listExpenses` ADAPTA o envelope paginado do backend para o shape
// `ResponsePagination` que a infra de grid (useCustomGridQuery/TableProvider)
// consome — mesmo adaptador de `listInvoices`/`listPlanAccounts`.
// -----------------------------------------------------------------------------

import api from '@/services/api';

import type { PaginationQueryParams } from '@/@types/pagination';
import type { Response, ResponsePagination } from '@/@types/response-api';
import type {
  ExpenseAppropriationTypeOption,
  ExpenseDetail,
  ExpenseDuplicateDraft,
  ExpenseListItem,
  ExpensePaymentTypeValue,
  ExpensePayload,
  ExpenseStatusFilterValue,
  ExpensesListEnvelope,
} from '@/@types/v2/Financeiro/expense';
import type {
  ServiceOrderActivityOption,
  ServiceOrderActivityOptionsListEnvelope,
  ServiceOrderOperationOption,
  ServiceOrderOperationOptionsListEnvelope,
} from '@/@types/v2/ServiceOrders';

export interface ListExpensesParams extends PaginationQueryParams {
  number?: string;
  provider_uuid?: string;
  proprietary_uuid?: string;
  type_title_uuid?: string;
  harvest_uuid?: string;
  dt_emission_from?: string;
  dt_emission_to?: string;
  due_date_from?: string;
  due_date_to?: string;
  amount?: number;
  payment_type?: ExpensePaymentTypeValue;
  type_note?: number;
  // TASK-FE-036-115 (ONDA 2) — 4 filtros novos, aplicados na API
  // (`ExpenseIndexRequest::rules()`); `product` (FM21) NÃO incluído aqui —
  // BLOQUEADO por GAP-036-113, ver `ExpenseFilterForm`.
  note?: string;
  category_uuid?: string;
  center_uuid?: string;
  status?: ExpenseStatusFilterValue;
  // ---- ONDA 3 sub-onda 3d (FM10/FM11/FM18) — filtros de baixa. ----
  account_uuid?: string;
  write_off_date_from?: string;
  write_off_date_to?: string;
  // DEC-115 (TASK-FE-036-125) — `?all_farms=1` amplia a listagem para todas
  // as fazendas do tenant (só aceito pelo backend quando
  // `tenant.list_all_farms===true`, `ExpenseIndexRequest`/`applyFilters`).
  all_farms?: boolean;
}

async function listExpenses(
  params: ListExpensesParams
): Promise<ResponsePagination<ExpenseListItem[]>> {
  const { data } = await api.V2.get<ExpensesListEnvelope>('/expenses', {
    page: params.page,
    per_page: params.per_page,
    number: params.number || undefined,
    provider_uuid: params.provider_uuid || undefined,
    proprietary_uuid: params.proprietary_uuid || undefined,
    type_title_uuid: params.type_title_uuid || undefined,
    harvest_uuid: params.harvest_uuid || undefined,
    dt_emission_from: params.dt_emission_from || undefined,
    dt_emission_to: params.dt_emission_to || undefined,
    due_date_from: params.due_date_from || undefined,
    due_date_to: params.due_date_to || undefined,
    amount: params.amount ?? undefined,
    payment_type: params.payment_type ?? undefined,
    type_note: params.type_note ?? undefined,
    note: params.note || undefined,
    category_uuid: params.category_uuid || undefined,
    center_uuid: params.center_uuid || undefined,
    status: params.status ?? undefined,
    account_uuid: params.account_uuid || undefined,
    write_off_date_from: params.write_off_date_from || undefined,
    write_off_date_to: params.write_off_date_to || undefined,
    // ATENÇÃO: `1` numérico, NUNCA o booleano cru. `ExpenseIndexRequest::
    // rules()` valida `all_farms` com a rule nativa `boolean` do Laravel, que
    // aceita SÓ `true|false|0|1|'0'|'1'` (`in_array` estrito) — NÃO aceita as
    // strings `'true'`/`'false'` que o axios produz ao serializar um
    // booleano JS cru na querystring (`String(true) === 'true'`), o que
    // devolveria 422 silencioso e quebraria o toggle. `params.all_farms ?
    // 1 : undefined` garante `all_farms=1` na URL (mirror literal do
    // contrato) ou a chave omitida — nunca `all_farms=false`/`'true'`.
    all_farms: params.all_farms ? 1 : undefined,
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

async function getExpense(expenseUuid: string) {
  const { data } = await api.V2.get<Response<ExpenseDetail>>(`/expenses/${expenseUuid}`);
  return data;
}

async function createExpense(payload: ExpensePayload) {
  const { data } = await api.V2.post<Response<ExpenseDetail>>('/expenses', payload);
  return data;
}

// PUT — payload SEMPRE completo (mirror `updateInvoice`, sem PATCH parcial).
// Campos financeiros/rateio devem ser reenviados IDÊNTICOS quando houver
// baixa (GAP-FE-036-106/107) — nunca omitidos pelo caller.
async function updateExpense(expenseUuid: string, payload: ExpensePayload) {
  const { data } = await api.V2.put<Response<ExpenseDetail>>(`/expenses/${expenseUuid}`, payload);
  return data;
}

// 422 quando a Expense está vinculada a uma Invoice com baixa (Doc Bruta:
// "não é possível excluir uma fatura com baixa") — `onError` genérico do
// `useRequest` já lê `resData.message` real.
async function deleteExpense(expenseUuid: string) {
  const { data } = await api.V2.delete(`/expenses/${expenseUuid}`);
  return data;
}

// DELETE /expenses/multiple-destroy — corpo `{ uuids }` (mesmo contrato do
// backend de `multipleDestroyIncomes`, mirror `income-service.ts`).
// `api.V2.delete` aceita `AxiosRequestConfig` como 2º argumento para corpo em
// DELETE, mesmo precedente já usado por `multipleDestroyIncomes`.
async function multipleDestroyExpenses(uuids: string[]) {
  const { data } = await api.V2.delete('/expenses/multiple-destroy', { data: { uuids } });
  return data;
}

// GET /expenses/{uuid}/duplicate — leitura pura, NUNCA persiste (mirror
// stateless do `replicate()` legado, `DuplicateExpenseAction`). Devolve o
// DRAFT de prefill (`ExpenseDuplicateDraft`); o front navega para a
// CRIAÇÃO com o draft no `state` do router (TASK-FE-036-122, B-11) — 1 GET
// e navegação, SEM módulo compartilhado (mirror EXATO `deleteExpense`).
async function duplicateExpense(expenseUuid: string) {
  const { data } = await api.V2.get<Response<ExpenseDuplicateDraft>>(
    `/expenses/${expenseUuid}/duplicate`
  );
  return data;
}

// GET /expenses/{uuid}/receipt — binário puro (PDF, SEM envelope
// ApiResponse), mirror 1:1 de `downloadNfeDanfe` (`nfe-service.ts:211-216`).
// B-12 (esteira 036, `TASK-BE-036-129`, `GB.Cerne.Api@4cf91540e`) — backend
// devolve `Content-Disposition: inline`, mas o consumo aqui é sempre via
// `responseType:'blob'` + `downloadBlob` (força download, ver
// `CONTRATO-FRONT-B12-recibo-CaP-CaR.md` §1/§2 — o `Content-Disposition` do
// servidor é irrelevante para o `<a download>`). Gate `permission:
// expenses_view` no middleware (2ª barreira, o front também gateia por
// `canView`).
async function getExpenseReceipt(expenseUuid: string): Promise<Blob> {
  const { data } = await api.V2.get<Blob>(`/expenses/${expenseUuid}/receipt`, undefined, {
    responseType: 'blob',
  });
  return data;
}

// GET /expenses/appropriation-types/options — tipos oferecidos por centro de
// custo do tenant (UT-000795, D-102-15). Envelope FLAT `[{value,label}]`
// (mirror `listAppropriationTypeOptions` de `invoice-service.ts`).
async function listExpenseAppropriationTypeOptions(): Promise<
  Response<ExpenseAppropriationTypeOption[]>
> {
  const { data } = await api.V2.get<Response<ExpenseAppropriationTypeOption[]>>(
    '/expenses/appropriation-types/options'
  );
  return data;
}

export interface ListExpenseAppropriationLookupParams extends PaginationQueryParams {
  search?: string;
}

export interface ListExpenseActivityOptionsParams extends ListExpenseAppropriationLookupParams {
  operation_uuid?: string;
}

function toExpenseLookupPagination<T>(data: {
  success: boolean;
  message: string;
  data: T[];
  meta: { total?: number; per_page?: number; current_page?: number; last_page?: number } | null;
}): ResponsePagination<T[]> {
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

// GET /operations/options — Select "Operação" do bloco Pecuária. Mesmo
// endpoint do módulo de OS, sem `category` (não acopla Contas a Pagar à OS).
async function listExpenseOperationOptions(
  params: ListExpenseAppropriationLookupParams
): Promise<ResponsePagination<ServiceOrderOperationOption[]>> {
  const { data } = await api.V2.get<ServiceOrderOperationOptionsListEnvelope>(
    '/operations/options',
    {
      page: params.page,
      per_page: params.per_page,
      search: params.search || undefined,
    }
  );
  return toExpenseLookupPagination(data);
}

// GET /activities/options?operation_uuid= — Select "Atividade" (cascata por uuid).
async function listExpenseActivityOptions(
  params: ListExpenseActivityOptionsParams
): Promise<ResponsePagination<ServiceOrderActivityOption[]>> {
  const { data } = await api.V2.get<ServiceOrderActivityOptionsListEnvelope>(
    '/activities/options',
    {
      page: params.page,
      per_page: params.per_page,
      search: params.search || undefined,
      operation_uuid: params.operation_uuid || undefined,
    }
  );
  return toExpenseLookupPagination(data);
}

export {
  createExpense,
  deleteExpense,
  duplicateExpense,
  getExpense,
  getExpenseReceipt,
  listExpenseActivityOptions,
  listExpenseAppropriationTypeOptions,
  listExpenseOperationOptions,
  listExpenses,
  multipleDestroyExpenses,
  updateExpense,
};
