// src/services/v2/Sales/sale-service.ts
// -----------------------------------------------------------------------------
// Sale Service — API v1 do backend Laravel GB.Cerne (Vendas COMERCIAL, venda
// de PRODUTOS — Operacional / Vendas, 97-Esteiras/043, SALE-FE-COM-01).
// Mirror exato de `order-service.ts` (adaptador de envelope paginado →
// `ResponsePagination`). Única camada HTTP do módulo (contrato-tela §4).
//
// Contrato (envelope ApiResponse): { success, message, data, errors, meta }.
//   GET    /sales            → data: SaleListItem[], meta paginação
//                               (filtros: search [ILIKE parcial, DEC-01],
//                               product_uuid, client_uuid, start_date/
//                               end_date sobre `dt_shipping`)
//   GET    /sales/{uuid}     → data: SaleDetail (itens hidratados)
//   POST   /sales            → payload CreateSaleRequest → data: SaleDetail
//   PUT    /sales/{uuid}     → payload UpdateSaleRequest (sync de itens por
//                               `items[].uuid`) → data: SaleDetail
//   DELETE /sales/{uuid}     → soft delete (guardas fail-closed no servidor:
//                               NFe vinculada / Income vinculado → 422)
//
// `api.V2` já traz Sanctum-cookie + `X-Farm-Id` (interceptor) — nenhuma
// instância axios nova (get_spa_api_client_pattern).
// -----------------------------------------------------------------------------

import api from '@/services/api';

import type { PaginationQueryParams } from '@/@types/pagination';
import type { Response, ResponsePagination } from '@/@types/response-api';
import type {
  CreateSaleRequest,
  SaleAdvanceIncomeDraft,
  SaleAdvanceIncomePayload,
  SaleAdvanceIncomeResult,
  SaleDetail,
  SaleListItem,
  SaleNfeDraft,
  SalesListEnvelope,
  UpdateSaleRequest,
} from '@/@types/v2/Sales';

// Params aceitos pela listagem — paginação real + filtros confirmados em
// `CONTRATO-API-SALE-COMERCIAL.md §3.2` (`SaleFilterData`).
export interface ListSalesParams extends PaginationQueryParams {
  search?: string;
  product_uuid?: string;
  client_uuid?: string;
  start_date?: string;
  end_date?: string;
}

async function listSales(params: ListSalesParams): Promise<ResponsePagination<SaleListItem[]>> {
  const { data } = await api.V2.get<SalesListEnvelope>('/sales', {
    page: params.page,
    per_page: params.per_page,
    search: params.search || undefined,
    product_uuid: params.product_uuid || undefined,
    client_uuid: params.client_uuid || undefined,
    start_date: params.start_date || undefined,
    end_date: params.end_date || undefined,
  });

  // Adaptação envelope ApiResponse::paginated → ResponsePagination (grid) —
  // idêntico a `listOrders`.
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

// GET /sales/{uuid} — hidrata cabeçalho + itens (round-trip create→get→update
// parcial→get, RT001 do contrato-tela §7.5).
async function getSale(saleUuid: string): Promise<Response<SaleDetail>> {
  const { data } = await api.V2.get<Response<SaleDetail>>(`/sales/${saleUuid}`);
  return data;
}

// POST /sales — cria Venda avulsa + itens em 1 transação atômica
// (`StoreSaleAction`, CV002-CV004).
async function createSale(payload: CreateSaleRequest): Promise<Response<SaleDetail>> {
  const { data } = await api.V2.post<Response<SaleDetail>>('/sales', payload);
  return data;
}

// PUT /sales/{uuid} — atualiza (sync de itens por `items[].uuid`,
// `SyncSaleItemsAction`). `422` quando `sale.nfe_id !== null` (guarda
// fail-closed, contrato-api §8 DEC-03).
async function updateSale(
  saleUuid: string,
  payload: UpdateSaleRequest
): Promise<Response<SaleDetail>> {
  const { data } = await api.V2.put<Response<SaleDetail>>(`/sales/${saleUuid}`, payload);
  return data;
}

// DELETE /sales/{uuid} — soft delete (`sale_items.sale_id` é `ON DELETE
// RESTRICT`, nunca DELETE físico). `422` quando há NFe ou `Income` vinculado
// (guardas fail-closed, contrato-api §8 DEC-03).
async function deleteSale(saleUuid: string) {
  const { data } = await api.V2.delete(`/sales/${saleUuid}`);
  return data;
}

// GET /sales/{uuid}/nfe-draft — A6/SE007 (SALE-FE-COM-06). Read-only,
// stateless (substitui `session('nfe')` do legado) — nenhuma queryKey
// invalidada, nenhuma mutação. NÃO existe `POST /sales/{uuid}/nfe-emit`
// (GAP-043-SALE-FE-COM-02, `[RESOLVIDO]`: modelo de HANDOFF) — o draft só
// alimenta `location.state.saleHandoff` em `/fiscal/nfe-emitidas/novo`.
async function getSaleNfeDraft(saleUuid: string): Promise<Response<SaleNfeDraft>> {
  const { data } = await api.V2.get<Response<SaleNfeDraft>>(`/sales/${saleUuid}/nfe-draft`);
  return data;
}

// GET /sales/{uuid}/advance-income — A8/SE010 (SALE-FE-COM-07). Devolve só
// saldo/pré-preenchimento da venda (`GAP-043-SALE-FE-COM-03 [RESOLVIDO]`) —
// catálogos (tipo de título/categoria/centro/conta contábil) vêm SEMPRE dos
// endpoints de options já migrados, nunca duplicados aqui.
async function getSaleAdvanceIncome(saleUuid: string): Promise<Response<SaleAdvanceIncomeDraft>> {
  const { data } = await api.V2.get<Response<SaleAdvanceIncomeDraft>>(
    `/sales/${saleUuid}/advance-income`
  );
  return data;
}

// POST /sales/{uuid}/advance-income — A9/SE010-012. Cria `Income`
// polimórfico (`incomeable=Sale`) + rateio, 1 parcela (`payment_type=4`,
// `installment=qtd_installments=1`, fixos no servidor). NENHUMA baixa
// automática (SE012 preservado) — a SPA navega para
// `/financeiro/receber/:incomeUuid` (`writeoff_hint`/`income.uuid`).
async function createSaleAdvanceIncome(
  saleUuid: string,
  payload: SaleAdvanceIncomePayload
): Promise<Response<SaleAdvanceIncomeResult>> {
  const { data } = await api.V2.post<Response<SaleAdvanceIncomeResult>>(
    `/sales/${saleUuid}/advance-income`,
    payload
  );
  return data;
}

export {
  createSale,
  createSaleAdvanceIncome,
  deleteSale,
  getSale,
  getSaleAdvanceIncome,
  getSaleNfeDraft,
  listSales,
  updateSale,
};
