// src/services/v2/Incomes/income-service.ts
// -----------------------------------------------------------------------------
// Income Service — API v1 do backend Laravel GB.Cerne ("Contas a Receber").
// TASK-FE-036-310 — fundação de dados, greenfield (zero arquivo prévio).
//
// Contrato (envelope ApiResponse): { success, message, data, errors, meta }.
//   GET    /incomes                              → data: IncomeListItem[] + meta paginação
//   GET    /incomes/{uuid}                       → data: IncomeDetail
//   POST   /incomes                               → payload IncomePayload completo
//   PUT    /incomes/{uuid}                        → payload Partial<IncomePayload> (edita 1 parcela)
//   DELETE /incomes/{uuid}                        → 204
//   DELETE /incomes/multiple-destroy              → body { uuids: string[] } (GAP-FE-036-304)
//   PUT    /incomes/{uuid}/toggle-fiscal-document  → sem payload, devolve o Resource atualizado
//
// `listIncomes` ADAPTA o envelope paginado do backend ({ data: [], meta: {} })
// para o shape `ResponsePagination` que a infra de grid do projeto
// (useCustomGridQuery/TableProvider) consome — mesmo truque de
// `listPlanAccounts`/`listCostCenters`/`listAccounts`.
//
// Rota dentro de `farm.context` ESTRITO — `X-Farm-Id` é anexado
// automaticamente pelo interceptor genérico de `@/services/api.ts`.
// -----------------------------------------------------------------------------

import api from '@/services/api';

import type { PaginationQueryParams } from '@/@types/pagination';
import type { Response, ResponsePagination } from '@/@types/response-api';
import type {
  IncomeDetail,
  IncomeDuplicateDraft,
  IncomeListItem,
  IncomePayload,
  IncomeStatus,
  IncomesListEnvelope,
} from '@/@types/v2/Incomes';

// Params aceitos pela listagem — paginação padrão + filtros reais do backend
// (contrato §3.2). `client_id` é nome de parâmetro LEGADO — o valor esperado
// é o `uuid` do cliente (mirror `InvoiceFilterForm.provider_id`), nunca um id
// sequencial.
export interface ListIncomesParams extends PaginationQueryParams {
  search?: string;
  client_id?: string;
  status?: IncomeStatus;
  dt_emission_from?: string;
  dt_emission_to?: string;
  // ---- TASK-FE-036-323 (FID-G3F FM04/FM05/FM10/FM12) ----
  due_date_from?: string;
  due_date_to?: string;
  note?: string;
  amount?: number;
  // ---- TASK-FE-036-324 (FID-G3F FM13/FM16/FM17/FM19) — filtros de lookup;
  // `harvest_id` filtra pela safra DE CABEÇALHO (`harvest_uuid`), nunca por
  // linha de rateio. "conta" (FM18) fora de escopo — não implementado.
  proprietary_id?: string;
  category_id?: string;
  center_id?: string;
  harvest_id?: string;
  // ---- ONDA 3 sub-onda 3d (FM08/FM09/FM18) — filtros de baixa. ----
  account_id?: string;
  write_off_date_from?: string;
  write_off_date_to?: string;
  // DEC-115 (TASK-FE-036-344, mirror `ListExpensesParams.all_farms`
  // TASK-FE-036-125) — `?all_farms=1` amplia a listagem para todas as
  // fazendas do tenant (só aceito pelo backend quando
  // `tenant.list_all_farms===true`, `IncomeIndexRequest`/`applyFilters`).
  all_farms?: boolean;
}

async function listIncomes(
  params: ListIncomesParams
): Promise<ResponsePagination<IncomeListItem[]>> {
  const { data } = await api.V2.get<IncomesListEnvelope>('/incomes', {
    page: params.page,
    per_page: params.per_page,
    search: params.search || undefined,
    client_id: params.client_id || undefined,
    status: params.status || undefined,
    dt_emission_from: params.dt_emission_from || undefined,
    dt_emission_to: params.dt_emission_to || undefined,
    due_date_from: params.due_date_from || undefined,
    due_date_to: params.due_date_to || undefined,
    note: params.note || undefined,
    amount: params.amount ?? undefined,
    proprietary_id: params.proprietary_id || undefined,
    category_id: params.category_id || undefined,
    center_id: params.center_id || undefined,
    harvest_id: params.harvest_id || undefined,
    account_id: params.account_id || undefined,
    write_off_date_from: params.write_off_date_from || undefined,
    write_off_date_to: params.write_off_date_to || undefined,
    // ATENÇÃO: `1` numérico, NUNCA o booleano cru — mirror `listExpenses`
    // (TASK-FE-036-125). `IncomeIndexRequest::rules()` valida `all_farms`
    // com a rule nativa `boolean` do Laravel (só aceita
    // `true|false|0|1|'0'|'1'`, `in_array` estrito), que rejeitaria as
    // strings `'true'`/`'false'` produzidas pelo axios ao serializar um
    // booleano JS cru na querystring — devolveria 422 silencioso e
    // quebraria o toggle. `params.all_farms ? 1 : undefined` garante
    // `all_farms=1` na URL ou a chave omitida.
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

async function getIncome(incomeUuid: string) {
  const { data } = await api.V2.get<Response<IncomeDetail>>(`/incomes/${incomeUuid}`);
  return data;
}

async function createIncome(payload: IncomePayload) {
  const { data } = await api.V2.post<Response<IncomeDetail>>('/incomes', payload);
  return data;
}

// Update edita UMA parcela — `installments[]` nunca populado (contrato §3.4/
// §4.3), `categories[]` só enviado quando `is_locked === false` (montagem do
// payload delta é responsabilidade do chamador, `CreateOrUpdateIncome.tsx`).
async function updateIncome(incomeUuid: string, payload: Partial<IncomePayload>) {
  const { data } = await api.V2.put<Response<IncomeDetail>>(`/incomes/${incomeUuid}`, payload);
  return data;
}

async function deleteIncome(incomeUuid: string) {
  const { data } = await api.V2.delete(`/incomes/${incomeUuid}`);
  return data;
}

// DELETE /incomes/multiple-destroy — corpo `{ uuids }` (nome do campo real do
// backend, NÃO `ids` — contrato §3.5). `api.V2.delete` aceita
// `AxiosRequestConfig` como 2º argumento para corpo em DELETE, mirror
// `deleteSession`/`disable 2FA` (únicos precedentes já confirmados no fork de
// DELETE com body real).
async function multipleDestroyIncomes(uuids: string[]) {
  const { data } = await api.V2.delete('/incomes/multiple-destroy', { data: { uuids } });
  return data;
}

// PUT /incomes/{uuid}/toggle-fiscal-document — sem payload; o servidor
// inverte o valor atual e propaga aos Movements ligados via pivot (contrato
// §3.6). Resposta: IncomeResource atualizado.
async function toggleFiscalDocumentIncome(incomeUuid: string) {
  const { data } = await api.V2.put<Response<IncomeDetail>>(
    `/incomes/${incomeUuid}/toggle-fiscal-document`
  );
  return data;
}

// GET /incomes/{uuid}/duplicate — leitura pura, NUNCA persiste (mirror
// stateless do `replicate()` legado, `DuplicateIncomeAction`). Devolve o
// DRAFT de prefill (`IncomeDuplicateDraft`); o front navega para a CRIAÇÃO
// com o draft no `state` do router (TASK-FE-036-320, B-11) — 1 GET e
// navegação, SEM módulo compartilhado (mirror EXATO `deleteIncome` e da
// Tarefa irmã de Contas a Pagar, `duplicateExpense`).
async function duplicateIncome(incomeUuid: string) {
  const { data } = await api.V2.get<Response<IncomeDuplicateDraft>>(
    `/incomes/${incomeUuid}/duplicate`
  );
  return data;
}

// GET /incomes/{uuid}/receipt — binário puro (PDF, SEM envelope
// ApiResponse), mirror 1:1 de `downloadNfeDanfe` (`nfe-service.ts:211-216`)
// e da fatia irmã de Contas a Pagar (`getExpenseReceipt`). B-12 (esteira
// 036, `TASK-BE-036-319`, `GB.Cerne.Api@4cf91540e`) — backend devolve
// `Content-Disposition: inline`, mas o consumo aqui é sempre via
// `responseType:'blob'` + `downloadBlob` (força download, ver
// `CONTRATO-FRONT-B12-recibo-CaP-CaR.md` §1/§2 — o `Content-Disposition` do
// servidor é irrelevante para o `<a download>`). Gate `permission:
// incomes_view` no middleware (2ª barreira, o front também gateia por
// `can('incomes_view')`).
async function getIncomeReceipt(incomeUuid: string): Promise<Blob> {
  const { data } = await api.V2.get<Blob>(`/incomes/${incomeUuid}/receipt`, undefined, {
    responseType: 'blob',
  });
  return data;
}

export {
  createIncome,
  deleteIncome,
  duplicateIncome,
  getIncome,
  getIncomeReceipt,
  listIncomes,
  multipleDestroyIncomes,
  toggleFiscalDocumentIncome,
  updateIncome,
};
