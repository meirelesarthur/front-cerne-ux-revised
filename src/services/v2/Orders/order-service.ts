// src/services/v2/Orders/order-service.ts
// -----------------------------------------------------------------------------
// Order Service — API v1 do backend Laravel GB.Cerne (Pedidos — Operacional /
// Vendas, F-051, 97-Esteiras/043, PED-FE-01). Mirror exato de
// `budget-service.ts` (adaptador de envelope paginado → `ResponsePagination`).
//
// Contrato (envelope ApiResponse): { success, message, data, errors, meta }.
//   GET  /orders                → data: OrderListItem[], meta paginação
//                                  REAL (filtros search/product/client_id/
//                                  start_date/end_date, GAP-API-FE-03 a
//                                  confirmar para `product`)
//   GET  /orders/next-code      → data: { code: string } (CV-001)
//   GET  /orders/{uuid}         → data: OrderDetail (itens+parcelas)
//   POST /orders                → payload CreateOrderRequest →
//                                  data: OrderDetail (atômico)
//   PUT  /orders/{uuid}         → idem (diff itens por `olds[]`)
//   DELETE /orders/{uuid}       → 204, sem body (cascade em order_items)
//   GET  /orders/{uuid}/report  → Blob (PDF), `responseType: 'blob'`
//                                  (inline síncrono, NÃO é AsyncJob)
// -----------------------------------------------------------------------------

import api from '@/services/api';

import type { PaginationQueryParams } from '@/@types/pagination';
import type { Response, ResponsePagination } from '@/@types/response-api';
import type {
  CreateOrderRequest,
  OrderDetail,
  OrderListItem,
  OrdersListEnvelope,
  UpdateOrderRequest,
} from '@/@types/v2/Orders';
import type { CreateSaleFromOrderRequest, SaleDetail, SaleDraft } from '@/@types/v2/Sales';

// Params aceitos pela listagem — paginação real + filtros confirmados em
// `contrato-api-pedidos.md §3.3`. `product` = GAP-API-FE-03 (a confirmar).
export interface ListOrdersParams extends PaginationQueryParams {
  search?: string;
  product?: string;
  client_id?: string;
  start_date?: string;
  end_date?: string;
}

async function listOrders(params: ListOrdersParams): Promise<ResponsePagination<OrderListItem[]>> {
  const { data } = await api.V2.get<OrdersListEnvelope>('/orders', {
    page: params.page,
    per_page: params.per_page,
    search: params.search || undefined,
    product: params.product || undefined,
    client_id: params.client_id || undefined,
    start_date: params.start_date || undefined,
    end_date: params.end_date || undefined,
  });

  // Adaptação envelope ApiResponse::paginated → ResponsePagination (grid) —
  // idêntico a `listBudgets`.
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

// GET /clients/options — FLAT (`ApiResponse::success`, leitura direta de
// `ClientController::options()`), SEM paginação real de servidor (só
// `search`, sem `page`/`per_page`) — diferente de `/products/options`
// (paginado). Adaptado aqui para o contrato `ResponsePagination` (1 única
// "página" com `total_pages: 1`, mirror da adaptação de envelope já usada
// por `listOrders`) para reusar `SelectAsyncPaginate` no filtro (FLT-003,
// contrato-tela §7.4) sem duplicar o mapeamento em cada tela consumidora
// (`FilterSideOrder.tsx` — PED-FE-02; reusável por `InlineClientModal.tsx`,
// PED-FE-07, se precisar do mesmo catálogo).
export interface OrderClientOptionItem {
  uuid: string;
  name: string | null;
}

export interface ListOrderClientOptionsParams extends PaginationQueryParams {
  search?: string;
}

async function listOrderClientOptions(
  params: ListOrderClientOptionsParams
): Promise<ResponsePagination<OrderClientOptionItem[]>> {
  const { data } = await api.V2.get<Response<OrderClientOptionItem[]>>('/clients/options', {
    search: params.search || undefined,
  });

  return {
    success: data.success,
    message: data.message,
    data: {
      items: data.data,
      pagination: {
        total: data.data.length,
        count: data.data.length,
        per_page: data.data.length || 1,
        current_page: 1,
        total_pages: 1,
      },
    },
  };
}

// GET /orders/{uuid} — hidrata itens, parcelas (installment_details).
async function getOrder(orderUuid: string): Promise<Response<OrderDetail>> {
  const { data } = await api.V2.get<Response<OrderDetail>>(`/orders/${orderUuid}`);
  return data;
}

// GET /orders/next-code — código sugerido (mirror `getNextBudgetCode`; CV-001,
// readonly no create, fallback '—').
async function getNextOrderCode(): Promise<Response<{ code: string }>> {
  const { data } = await api.V2.get<Response<{ code: string }>>('/orders/next-code');
  return data;
}

// POST /orders — cria Order+itens+parcelas em 1 transação atômica
// (DEC-PED-FE-ITENS — não há bulk separado).
async function createOrder(payload: CreateOrderRequest): Promise<Response<OrderDetail>> {
  const { data } = await api.V2.post<Response<OrderDetail>>('/orders', payload);
  return data;
}

// PUT /orders/{uuid} — atualiza (diff itens por `olds[]`).
async function updateOrder(
  orderUuid: string,
  payload: UpdateOrderRequest
): Promise<Response<OrderDetail>> {
  const { data } = await api.V2.put<Response<OrderDetail>>(`/orders/${orderUuid}`, payload);
  return data;
}

// DELETE /orders/{uuid} — 204, cascade em order_items (FK ON DELETE CASCADE).
async function deleteOrder(orderUuid: string) {
  const { data } = await api.V2.delete(`/orders/${orderUuid}`);
  return data;
}

// GET /orders/{uuid}/report — PDF binário inline síncrono, `responseType:
// 'blob'` (mirror `getBudgetReport`). Nunca `window.open` cru — perderia o
// header `X-Farm-Id` (contrato-tela §3).
async function getOrderReportBlob(orderUuid: string): Promise<Blob> {
  const { data } = await api.V2.get<Blob>(`/orders/${orderUuid}/report`, undefined, {
    responseType: 'blob',
  });
  return data;
}

// GET /orders/{uuid}/sale-draft — SALE-FE-COM-10 (borda Order→Sale já em
// produção desde a execução 043, `DraftSaleFromOrderAction`). Hidrata
// `GerarVendaFromOrder.tsx` — saldo por produto (`remaining_quantity`),
// formas de pagamento aceitas e o resumo do Pedido de origem. Permissão
// `sales_create`, gate `Order.status < 3` (senão `BusinessRuleException`,
// mapeada pelo interceptor genérico do `get_spa_api_client_pattern`).
async function getOrderSaleDraft(orderUuid: string): Promise<Response<SaleDraft>> {
  const { data } = await api.V2.get<Response<SaleDraft>>(`/orders/${orderUuid}/sale-draft`);
  return data;
}

// POST /orders/{uuid}/sales — SALE-FE-COM-10 (`CreateSaleFromOrderAction`,
// transação atômica: cria `Sale`+itens e move `Order.status→2`). Mesma
// permissão/gate de `getOrderSaleDraft`. `client_uuid`/`order_uuid`/
// `farm_id`/`status`/`code` NUNCA no payload — resolvidos no servidor.
async function createSaleFromOrder(
  orderUuid: string,
  payload: CreateSaleFromOrderRequest
): Promise<Response<SaleDetail>> {
  const { data } = await api.V2.post<Response<SaleDetail>>(`/orders/${orderUuid}/sales`, payload);
  return data;
}

export {
  createOrder,
  createSaleFromOrder,
  deleteOrder,
  getNextOrderCode,
  getOrder,
  getOrderReportBlob,
  getOrderSaleDraft,
  listOrderClientOptions,
  listOrders,
  updateOrder,
};
