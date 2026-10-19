// src/services/v2/Invoices/invoice-service.ts
// -----------------------------------------------------------------------------
// Invoice Service — API v1 do backend Laravel GB.Cerne ("Doc. Fiscal/Entrada").
// Casa própria (mirror `warehouse-service.ts`/`planRole-service.ts`), NÃO
// sub-pasta de CadastrosBase. TASK-FE-2760 (execução 033/Onda 3).
//
// Contrato REAL (leitura direta de `InvoiceController.php`/`routes/api.php`,
// branch `feature/refactor-plans-appropriations-invoices-nfe` — backend JÁ
// CONSTRUÍDO nesta rodada):
//   GET    /invoices           → paginado; eager-load SÓ provider.people+state
//                                 (SEM items/expenses/proprietary — só no show)
//   GET    /invoices/{uuid}    → detalhe completo (items[]+expenses[])
//   POST   /invoices           → cascata completa (Stock/Equipment/Expense)
//   PUT    /invoices/{uuid}    → reverte+recria itens; installments/categories
//                                 do payload são IGNORADOS pela Action (Contas
//                                 a Pagar imutáveis pós-criação) — mesmo assim
//                                 o `InvoiceRequest` exige os 2 arrays também
//                                 no update (`array|min:1` sem distinguir
//                                 verbo); `updateInvoice` sempre os envia.
//   DELETE /invoices/{uuid}    → 422 se parcela já movimentada (Expense.amount
//                                 != balance) — mensagem real do backend.
//
// Rota dentro de `farm.context` ESTRITO — X-Farm-Id anexado automaticamente
// pelo interceptor genérico de `@/services/api.ts`.
//
// `listInvoices` ADAPTA o envelope paginado do backend para o shape
// `ResponsePagination` que a infra de grid (useCustomGridQuery/TableProvider)
// consome — mesmo adaptador de `listWarehouses`/`listPlanRoles`.
// -----------------------------------------------------------------------------

import api from '@/services/api';

import type { PaginationQueryParams } from '@/@types/pagination';
import type { Response, ResponsePagination } from '@/@types/response-api';
import type {
  AppropriationTypeOption,
  InvoiceDetail,
  InvoiceListItem,
  InvoicePayload,
  InvoicesListEnvelope,
  InvoiceXmlDraft,
} from '@/@types/v2/Invoices';

export interface ListInvoicesParams extends PaginationQueryParams {
  number?: string;
  provider_id?: string;
  dt_emission_from?: string;
  dt_emission_to?: string;
  product_id?: string;
  proprietary_id?: string;
  vl_total?: number;
}

async function listInvoices(
  params: ListInvoicesParams
): Promise<ResponsePagination<InvoiceListItem[]>> {
  const { data } = await api.V2.get<InvoicesListEnvelope>('/invoices', {
    page: params.page,
    per_page: params.per_page,
    number: params.number || undefined,
    provider_id: params.provider_id || undefined,
    dt_emission_from: params.dt_emission_from || undefined,
    dt_emission_to: params.dt_emission_to || undefined,
    product_id: params.product_id || undefined,
    proprietary_id: params.proprietary_id || undefined,
    vl_total: params.vl_total ?? undefined,
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

async function getInvoice(invoiceUuid: string) {
  const { data } = await api.V2.get<Response<InvoiceDetail>>(`/invoices/${invoiceUuid}`);
  return data;
}

async function createInvoice(payload: InvoicePayload) {
  const { data } = await api.V2.post<Response<InvoiceDetail>>('/invoices', payload);
  return data;
}

// PUT — payload SEMPRE completo (mirror `updateGrazing`, sem PATCH parcial).
// `installments`/`categories` são exigidos pelo `InvoiceRequest` mas
// IGNORADOS pela `UpdateInvoiceAction` (ver cabeçalho do arquivo) — enviados
// mesmo assim, fidelidade ao contrato de validação.
async function updateInvoice(invoiceUuid: string, payload: InvoicePayload) {
  const { data } = await api.V2.put<Response<InvoiceDetail>>(`/invoices/${invoiceUuid}`, payload);
  return data;
}

// 422 quando alguma parcela já foi movimentada (Expense.amount != balance) —
// o `onError` genérico de `useRequest` já lê `resData.message`/`errors` real.
async function deleteInvoice(invoiceUuid: string) {
  const { data } = await api.V2.delete(`/invoices/${invoiceUuid}`);
  return data;
}

// TASK-FE-628 (DF-03, execução 035) — `POST /invoices/parse-xml` (multipart,
// campo `file`, TASK-BE-624), mirror `importPlanAccounts` (mesma técnica de
// `FormData`, axios define o `Content-Type: multipart/form-data` sozinho a
// partir da instância `FormData`). Devolve um DRAFT (`InvoiceXmlDraft`), SEM
// persistir nada — o Front usa a resposta para `reset()` do form raiz
// (`CreateOrUpdateInvoice.tsx`). 422 amigável ("Documento Fiscal já
// lançado"/"Este XML não é de NFe") vem em `message`
// (`BusinessRuleException`, `errors: []`) — `onError` do caller lê
// `resData.message`, mirror `PlanAccountImportModal.tsx`.
async function parseInvoiceXml(file: File): Promise<Response<InvoiceXmlDraft>> {
  const fd = new FormData();
  fd.append('file', file);
  const { data } = await api.V2.post<Response<InvoiceXmlDraft>>('/invoices/parse-xml', fd);
  return data;
}

// TASK-BE-625 — `GET /invoices/{uuid}/xml`, devolve o arquivo XML definitivo
// (`Content-Type: application/xml`, `Content-Disposition: attachment`), NÃO
// o envelope `ApiResponse` (mirror `downloadPlanAccountImportTemplate`,
// `responseType: 'blob'`). 404 amigável quando a Invoice nunca teve XML
// promovido (upload manual sem passar pelo parse).
async function downloadInvoiceXml(invoiceUuid: string): Promise<Blob> {
  const { data } = await api.V2.get<Blob>(`/invoices/${invoiceUuid}/xml`, undefined, {
    responseType: 'blob',
  });
  return data;
}

// TASK-FE-626/DF-06 (GAP-BE-622, sub-opção b) — `GET /invoices/appropriation-
// types/options`, lookup enxuto de elegibilidade por Centro de Custo do
// tenant corrente. `permission:invoices_view` (mesmo gate de index/show,
// leitura), envelope FLAT (`data` é o array direto, `meta` sempre `null`,
// sem paginação) — mirror `listWarehouseOptions`/`listProductGroupOptions`.
async function listAppropriationTypeOptions(): Promise<Response<AppropriationTypeOption[]>> {
  const { data } = await api.V2.get<Response<AppropriationTypeOption[]>>(
    '/invoices/appropriation-types/options'
  );
  return data;
}

export {
  createInvoice,
  deleteInvoice,
  downloadInvoiceXml,
  getInvoice,
  listAppropriationTypeOptions,
  listInvoices,
  parseInvoiceXml,
  updateInvoice,
};
