// src/services/v2/Budgets/budget-service.ts
// -----------------------------------------------------------------------------
// Budget Service — API v1 do backend Laravel GB.Cerne (Orçamentos —
// Operacional / Vendas, F-018, 97-Esteiras/054, TASK-BG-FE-01). Mirror exato
// de `requisition-service.ts` (adaptador de envelope paginado →
// `ResponsePagination`) + `request-quotation-service.ts` (ações
// complementares sem tela própria, registradas já na fundação).
//
// Contrato (envelope ApiResponse): { success, message, data, errors, meta }.
//   GET  /budgets                → data: BudgetListItem[], meta paginação
//                                   REAL (filtros search/product_uuid/
//                                   client_uuid/start_date/end_date)
//   GET  /budgets/next-code      → data: { code: string } (mirror
//                                   `getServiceOrderNextCode`)
//   GET  /budgets/{uuid}         → data: BudgetData (itens+pagamentos)
//   POST /budgets                → payload CreateOrUpdateBudgetPayload →
//                                   data: BudgetData
//   PUT  /budgets/{uuid}         → idem (diff itens/pagamentos por uuid)
//   DELETE /budgets/{uuid}       → 204, sem body (soft delete)
//   GET  /budgets/{uuid}/report  → Blob (PDF), `responseType: 'blob'`
//                                   (mirror `getFoodBeatItemReport`)
//   POST /budgets/{uuid}/email   → sem payload — envia e-mail + regenera PDF
//                                   (mirror `deleteRequisition`/ação sem
//                                   corpo)
//
// ⚠️ Rota pública (`GET/PUT public/budgets/{hash}`) NÃO vive neste arquivo —
// mora em `budget-public-service.ts`, com client HTTP ISOLADO (SEM
// `withCredentials`/interceptors do client autenticado), mirror
// `request-quotation-public-service.ts` — exigência explícita de
// `budgets-frontend-contract.md §5.5` (isolamento obrigatório da página
// pública de aprovação por hash).
// -----------------------------------------------------------------------------

import api from '@/services/api';

import type { PaginationQueryParams } from '@/@types/pagination';
import type { Response, ResponsePagination } from '@/@types/response-api';
import type {
  BudgetData,
  BudgetListItem,
  BudgetsListEnvelope,
  CreateOrUpdateBudgetPayload,
} from '@/@types/v2/Budgets';

// Params aceitos pela listagem — paginação real + filtros confirmados em
// `budgets-api-contract.md §4.1`.
export interface ListBudgetsParams extends PaginationQueryParams {
  search?: string;
  product_uuid?: string;
  client_uuid?: string;
  start_date?: string;
  end_date?: string;
}

async function listBudgets(
  params: ListBudgetsParams
): Promise<ResponsePagination<BudgetListItem[]>> {
  const { data } = await api.V2.get<BudgetsListEnvelope>('/budgets', {
    page: params.page,
    per_page: params.per_page,
    search: params.search || undefined,
    product_uuid: params.product_uuid || undefined,
    client_uuid: params.client_uuid || undefined,
    start_date: params.start_date || undefined,
    end_date: params.end_date || undefined,
  });

  // Adaptação envelope ApiResponse::paginated → ResponsePagination (grid) —
  // idêntico a `listRequisitions`/`listFarmTransfers`.
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

// GET /budgets/{uuid} — hidrata itens.produto, pagamentos.
async function getBudget(budgetUuid: string): Promise<Response<BudgetData>> {
  const { data } = await api.V2.get<Response<BudgetData>>(`/budgets/${budgetUuid}`);
  return data;
}

// GET /budgets/next-code — código sugerido (mirror `getServiceOrderNextCode`,
// `CreateRequisition.tsx` quanto ao uso: prévia readonly, fallback '—').
async function getNextBudgetCode(): Promise<Response<{ code: string }>> {
  const { data } = await api.V2.get<Response<{ code: string }>>('/budgets/next-code');
  return data;
}

// POST /budgets — cria Budget+itens+pagamentos em 1 transação.
async function createBudget(payload: CreateOrUpdateBudgetPayload): Promise<Response<BudgetData>> {
  const { data } = await api.V2.post<Response<BudgetData>>('/budgets', payload);
  return data;
}

// PUT /budgets/{uuid} — atualiza (diff itens/pagamentos por uuid).
async function updateBudget(
  budgetUuid: string,
  payload: CreateOrUpdateBudgetPayload
): Promise<Response<BudgetData>> {
  const { data } = await api.V2.put<Response<BudgetData>>(`/budgets/${budgetUuid}`, payload);
  return data;
}

// DELETE /budgets/{uuid} — soft delete (GAP-BG-06).
async function deleteBudget(budgetUuid: string) {
  const { data } = await api.V2.delete(`/budgets/${budgetUuid}`);
  return data;
}

// GET /budgets/{uuid}/report — PDF binário, `responseType: 'blob'` (mirror
// `getFoodBeatItemReport`/`getRequisitionDocument`).
async function getBudgetReport(budgetUuid: string): Promise<Blob> {
  const { data } = await api.V2.get<Blob>(`/budgets/${budgetUuid}/report`, undefined, {
    responseType: 'blob',
  });
  return data;
}

// GET /budgets/{uuid}/whatsapp — GAP-BG-FE-07 (TASK-BG-FE-02): a fundação
// (TASK-BG-FE-01) e `budgets-frontend-contract.md §5.4` previam um util
// PURO client-side (`budgetWhatsApp.ts`) que montaria a mensagem a partir de
// `client.cellphone` (campo que o `BudgetResource` real NUNCA expõe — só
// `{uuid, name}`, confirmado por leitura direta). O backend real
// (`BudgetController::whatsapp()`/`BuildBudgetWhatsappLinkAction`, já
// roteado em `routes/api.php`) já monta o link `wa.me` PRONTO no servidor —
// a Tarefa 02 consome esta rota diretamente (sem util client-side, sem
// fabricar telefone/mensagem). Mirror de assinatura de `getNextBudgetCode`.
async function getBudgetWhatsappLink(budgetUuid: string): Promise<Response<{ url: string }>> {
  const { data } = await api.V2.get<Response<{ url: string }>>(`/budgets/${budgetUuid}/whatsapp`);
  return data;
}

// POST /budgets/{uuid}/email — sem payload; envia e-mail + regenera PDF
// (mirror `deleteRequisition`, ação sem corpo relevante de retorno).
async function sendBudgetEmail(budgetUuid: string): Promise<Response<null>> {
  const { data } = await api.V2.post<Response<null>>(`/budgets/${budgetUuid}/email`);
  return data;
}

export {
  createBudget,
  deleteBudget,
  getBudget,
  getBudgetReport,
  getBudgetWhatsappLink,
  getNextBudgetCode,
  listBudgets,
  sendBudgetEmail,
  updateBudget,
};
