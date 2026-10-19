// src/services/v2/SaleContracts/sale-contract-service.ts
// -----------------------------------------------------------------------------
// SaleContract Service — API v1 do backend Laravel GB.Cerne (Operacional /
// Agricultura — "Contratos de Venda", esteira 036, TASK-FE-036-202). Mirror
// mecânico do precedente arquitetural direto apontado pelo contrato de tela
// (`Financeiro/Contrato` → `services/v2/Contracts/contract-service.ts`).
//
// Payload é sempre JSON puro (`api.V2.post`/`api.V2.put`) — nenhum upload de
// arquivo neste módulo, nenhum method spoofing.
//
//   GET    /sale-contracts            → listSaleContracts(params) — paginado
//                                        (search/client_uuid/product_uuid/
//                                        start_date/end_date/per_page/page,
//                                        contrato-api §3.3)
//   GET    /sale-contracts/{uuid}     → getSaleContract(uuid)
//   POST   /sale-contracts            → createSaleContract(payload) — JSON puro
//   PUT    /sale-contracts/{uuid}     → updateSaleContract(uuid, payload) —
//                                        JSON puro, `api.V2.put` nativo
//   DELETE /sale-contracts/{uuid}     → deleteSaleContract(uuid)
//
// `listSaleContracts` ADAPTA o envelope `ApiResponse::paginated` → shape
// `ResponsePagination` que `useCustomGridQuery`/`TableProvider` consomem —
// mesmo adaptador de `listContracts`/`listClients` (meta REAL, nunca
// fallback fake).
//
// `X-Farm-Id` é anexado automaticamente pelo interceptor genérico de
// `@/services/api.ts` (mesmo mecanismo de todos os services do fork) — este
// service não manipula o header manualmente.
//
// ⚠️ Armadilha ERRO-FE-016 (services que enumeram parâmetros manualmente
// descartam parâmetro novo em silêncio, `tsc` não acusa): os filtros de
// `ListSaleContractsParams` são TODOS repassados explicitamente na
// querystring abaixo — ao adicionar um filtro novo no futuro, repassar aqui
// também, não só no tipo.
// -----------------------------------------------------------------------------

import api from '@/services/api';

import type { PaginationQueryParams } from '@/@types/pagination';
import type { Response, ResponsePagination } from '@/@types/response-api';
import type {
  SaleContractData,
  SaleContractFilterRequest,
  SaleContractListItem,
  SaleContractPayload,
  SaleContractsListEnvelope,
} from '@/@types/v2/SaleContracts';

export interface ListSaleContractsParams extends PaginationQueryParams, SaleContractFilterRequest {}

async function listSaleContracts(
  params: ListSaleContractsParams
): Promise<ResponsePagination<SaleContractListItem[]>> {
  const { data } = await api.V2.get<SaleContractsListEnvelope>('/sale-contracts', {
    page: params.page,
    per_page: params.per_page,
    search: params.search || undefined,
    client_uuid: params.client_uuid || undefined,
    product_uuid: params.product_uuid || undefined,
    start_date: params.start_date || undefined,
    end_date: params.end_date || undefined,
  });

  // Adaptação envelope ApiResponse::paginated → ResponsePagination (grid) —
  // idêntico a `listContracts`/`listClients` (meta REAL, não fallback fake).
  return {
    success: data.success,
    message: data.message,
    data: {
      items: data.data,
      pagination: {
        total: data.meta?.total ?? data.data.length,
        count: data.data.length,
        per_page: data.meta?.per_page ?? params.per_page ?? data.data.length,
        current_page: data.meta?.current_page ?? params.page ?? 1,
        total_pages: data.meta?.last_page ?? 1,
      },
    },
  };
}

async function getSaleContract(uuid: string) {
  const { data } = await api.V2.get<Response<SaleContractData>>(`/sale-contracts/${uuid}`);
  return data;
}

async function createSaleContract(payload: SaleContractPayload) {
  const { data } = await api.V2.post<Response<SaleContractData>>('/sale-contracts', payload);
  return data;
}

// PUT nativo (`api.V2.put`) — payload JSON puro, sem method spoofing (mirror
// `updateContract`).
async function updateSaleContract(uuid: string, payload: SaleContractPayload) {
  const { data } = await api.V2.put<Response<SaleContractData>>(`/sale-contracts/${uuid}`, payload);
  return data;
}

async function deleteSaleContract(uuid: string) {
  const { data } = await api.V2.delete(`/sale-contracts/${uuid}`);
  return data;
}

// `GET /api/v1/sale-contracts/options` — fachada aditiva (F-331,
// TASK-RVC-FE-01), payload FLAT (`{uuid, number}[]`, SEM `meta`), diferente
// dos options PAGINADOS de `clients`/`products`. `routes/api.php:6438`
// declarada ANTES do `apiResource('sale-contracts')`, isolamento automático
// por `HasFarmTenantScope` (farm-scoped, igual ao legado). Mirror
// `listProprietaryOptions` (`proprietary-service.ts:164-173`), a fachada
// flat canônica do projeto. Consumir com `Select` + `useOptionsSelectQuery`,
// NUNCA com `SelectAsyncPaginate`.
export interface SaleContractOption {
  uuid: string;
  number: string;
}

async function listSaleContractOptions(search?: string): Promise<SaleContractOption[]> {
  const { data } = await api.V2.get<Response<SaleContractOption[]>>('/sale-contracts/options', {
    search: search || undefined,
  });
  return data.data ?? [];
}

export {
  createSaleContract,
  deleteSaleContract,
  getSaleContract,
  listSaleContractOptions,
  listSaleContracts,
  updateSaleContract,
};
