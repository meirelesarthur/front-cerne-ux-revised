// src/services/v2/Fiscal/accounting-entry-service.ts
// Service de Partida Dobrada (AccountingEntry — domínio Fiscal, F-128,
// esteira 97-Esteiras/068, TASK-PD-FE-05). CRUD simples — os 5 endpoints já
// existem+testados na API (`AccountingEntryControllerTest`). Mirror
// estrutural de `dfe-service.ts`/`nfe-service.ts` (mesmo domínio Fiscal,
// mesma convenção de envelope/params).
//
// ⚠️ Nenhum service novo para o lookup de conta contábil — `listPlanAccountOptions`
// já existe em `src/services/v2/PlanAccounts/plan-account-service.ts` e já
// aceita `{ class: 2, is_enabled: 'true' }` (mirror `ExpenseApportionmentTab.tsx`).
// Import direto nas Tarefas de tela (06/07), NÃO duplicado aqui.
//
// ⚠️ PROIBIDO no payload de create/update: `total_amount`, `code`, `user_id`,
// `farm_id` — a API NUNCA os aceita no corpo da requisição, mesmo que os
// devolva na resposta (contrato de tela §2, GAP-PD-02/03/04).
//
// `api.V2.get<T>(endpoint, params)` — `params` é o 2º argumento POSICIONAL
// (o wrapper injeta `{ params, ...config }` internamente); NÃO envolver em
// `{ params }` de novo (armadilha confirmada nos services reais do módulo
// Fiscal — ver `dfe-service.ts`/`nfe-service.ts`/`xml-document-service.ts`).

import api from '@/services/api';

import type { PaginationQueryParams } from '@/@types/pagination';
import type { Response, ResponsePagination } from '@/@types/response-api';
import type {
  AccountingEntriesListEnvelope,
  AccountingEntryData,
  AccountingEntryFilterRequest,
  CreateOrUpdateAccountingEntryRequest,
} from '@/@types/v2/Fiscal/accountingEntry';

const BASE = '/double-entry-accountings';

export async function getAllAccountingEntries(
  params?: PaginationQueryParams & AccountingEntryFilterRequest
): Promise<ResponsePagination<AccountingEntryData[]>> {
  const { data } = await api.V2.get<AccountingEntriesListEnvelope>(BASE, params);

  // Adaptação envelope ApiResponse::paginated → ResponsePagination (grid) —
  // idêntico a `listNutritions`/`getAllBudgetPlannings`/`listInvoices`
  // (meta REAL, nunca fabricada). TASK-PD-FE-FIX-LIST.
  return {
    success: data.success,
    message: data.message,
    data: {
      items: data.data,
      pagination: {
        total: data.meta?.total ?? data.data.length,
        count: data.data.length,
        per_page: data.meta?.per_page ?? params?.per_page ?? data.data.length,
        current_page: data.meta?.current_page ?? 1,
        total_pages: data.meta?.last_page ?? 1,
      },
    },
  };
}

export async function getAccountingEntry(uuid: string): Promise<Response<AccountingEntryData>> {
  const { data } = await api.V2.get<Response<AccountingEntryData>>(`${BASE}/${uuid}`);
  return data;
}

export async function createAccountingEntry(
  body: CreateOrUpdateAccountingEntryRequest
): Promise<Response<AccountingEntryData>> {
  const { data } = await api.V2.post<Response<AccountingEntryData>>(BASE, body);
  return data;
}

export async function updateAccountingEntry(
  uuid: string,
  body: CreateOrUpdateAccountingEntryRequest
): Promise<Response<AccountingEntryData>> {
  const { data } = await api.V2.patch<Response<AccountingEntryData>>(`${BASE}/${uuid}`, body);
  return data;
}

export async function deleteAccountingEntry(uuid: string) {
  const { data } = await api.V2.delete(`${BASE}/${uuid}`);
  return data;
}
