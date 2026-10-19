// src/services/v2/HarvestProduct/harvestProduct-service.ts
// -----------------------------------------------------------------------------
// HarvestProduct Service — API v1 do backend Laravel GB.Cerne ("Colheita de
// Frutas", Operacional / Agricultura, F-040, execução 040, TASK-FE-1094).
//
// `BASE = '/harvest-products'` CONFIRMADO contra `routes/api.php` real do
// `api_root` (`harvest-products.index/show/store/update/destroy`, grupo
// `farm.context`).
//
// Contrato (envelope ApiResponse): { success, message, data, errors, meta }.
//   GET    /harvest-products            → paginado (ApiResponse::paginated),
//                                          filtros `area_uuid/client_uuid/
//                                          date_start/date_end` — nomes
//                                          CONFIRMADOS por leitura direta de
//                                          `HarvestProductFilterData`
//                                          (`#[MapInputName(SnakeCaseMapper::
//                                          class)]`) no `api_root` (D6 do
//                                          contrato §7.10, fechado).
//   GET    /harvest-products/{uuid}     → data: HarvestProductData (com
//                                          `boxes[]`/`boxes_count`/
//                                          `total_weight` já calculados)
//   POST   /harvest-products            → payload CreateHarvestProductRequest,
//                                          NUNCA `code` (gerado no servidor)
//   PUT    /harvest-products/{uuid}     → payload UpdateHarvestProductRequest
//                                          — cabeçalho SEMPRE completo
//                                          (`UpdateHarvestProductAtomicAction`
//                                          usa `fill()` incondicional, NÃO um
//                                          PATCH parcial) + `boxes[]` sempre
//                                          integral (reconciliação por uuid)
//   DELETE /harvest-products/{uuid}     → 204; pode responder 409
//                                          (`HarvestProductInUseException`)
//
// Lookups (contrato §7.4/§3.5 do arquitetural): `areas/options`/
// `clients/options` são FLAT (`ApiResponse::success`, SEM paginação real,
// confirmado por leitura direta de `AreaController::options()`/
// `ClientController::options()`) — usados por `Select` local, não
// `SelectAsyncPaginate`. `products/options`/`cities/options` SÃO paginados
// (`ApiResponse::paginated`) — usados por `SelectAsyncPaginate`, com guarda
// de "mínimo 3 caracteres" (paridade com o legado, Select2 AJAX) aplicada
// AQUI (sem chamada de rede antes disso), não no componente.
//
// Nenhuma chamada Axios fora deste arquivo (Lei 3/7).
// -----------------------------------------------------------------------------

import api from '@/services/api';

import type { PaginationQueryParams } from '@/@types/pagination';
import type { Response, ResponsePagination } from '@/@types/response-api';
import type {
  AreaOptionItem,
  ClientOptionItem,
  CityOptionItem,
  CreateHarvestProductRequest,
  HarvestProductData,
  HarvestProductFilterRequest,
  ProductOptionItem,
  UpdateHarvestProductRequest,
} from '@/@types/v2/HarvestProduct';

const BASE = '/harvest-products';

interface HarvestProductsListEnvelope {
  success: boolean;
  message: string;
  data: HarvestProductData[];
  meta?: { total?: number; per_page?: number; current_page?: number; last_page?: number };
}

export interface ListHarvestProductsParams
  extends PaginationQueryParams, HarvestProductFilterRequest {}

async function getAllHarvestProducts(
  params: ListHarvestProductsParams
): Promise<ResponsePagination<HarvestProductData[]>> {
  const { data } = await api.V2.get<HarvestProductsListEnvelope>(BASE, {
    page: params.page,
    per_page: params.per_page,
    // D6 (contrato §7.10, CONFIRMADO) — `date_start`/`date_end` snake_case,
    // mirror `HarvestProductFilterData` real do `api_root`.
    area_uuid: params.areaUuid || undefined,
    client_uuid: params.clientUuid || undefined,
    date_start: params.dateStart || undefined,
    date_end: params.dateEnd || undefined,
  });

  // Adaptação envelope ApiResponse::paginated → ResponsePagination (grid) —
  // mesmo adaptador de listProtocolSeasons/listCities (meta REAL, nunca
  // fallback fake).
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

async function getHarvestProduct(uuid: string): Promise<Response<HarvestProductData>> {
  const { data } = await api.V2.get<Response<HarvestProductData>>(`${BASE}/${uuid}`);
  return data;
}

async function createHarvestProduct(
  body: CreateHarvestProductRequest
): Promise<Response<HarvestProductData>> {
  const { data } = await api.V2.post<Response<HarvestProductData>>(BASE, body);
  return data;
}

async function updateHarvestProduct(
  uuid: string,
  body: UpdateHarvestProductRequest
): Promise<Response<HarvestProductData>> {
  const { data } = await api.V2.put<Response<HarvestProductData>>(`${BASE}/${uuid}`, body);
  return data;
}

// 409 (`HarvestProductInUseException`) tratado no call site (useRequest,
// mensagem do backend já é a mensagem de negócio) — aqui só propaga o erro.
async function deleteHarvestProduct(uuid: string) {
  const { data } = await api.V2.delete(`${BASE}/${uuid}`);
  return data;
}

// -----------------------------------------------------------------------------
// Lookups — 4 selects do formulário (contrato §7.4/§3.5).
// -----------------------------------------------------------------------------

interface FlatOptionsEnvelope<T> {
  success: boolean;
  message: string;
  data: T[];
}

interface PaginatedOptionsEnvelope<T> {
  success: boolean;
  message: string;
  data: T[];
  meta?: { total?: number; per_page?: number; current_page?: number; last_page?: number };
}

// `areas/options` — FLAT (`ApiResponse::success`), Select LOCAL (não AJAX),
// confirmado por leitura direta de `AreaController::options()`.
async function getAreasOptions(): Promise<AreaOptionItem[]> {
  const { data } = await api.V2.get<FlatOptionsEnvelope<AreaOptionItem>>('/areas/options');
  return data.data;
}

// `clients/options` — GAP fechado (TASK-BE-1072, HarvestProduct-contrato-
// arquitetural.md §3.5), FLAT (`ApiResponse::success`), Select LOCAL,
// mirror EXATO de `getAreasOptions`.
async function getClientsOptions(): Promise<ClientOptionItem[]> {
  const { data } = await api.V2.get<FlatOptionsEnvelope<ClientOptionItem>>('/clients/options');
  return data.data;
}

function emptyResponsePagination<T>(perPage = 10): ResponsePagination<T[]> {
  return {
    success: true,
    data: {
      items: [],
      pagination: { total: 0, count: 0, per_page: perPage, current_page: 1, total_pages: 1 },
    },
  };
}

// `products/options` — PAGINADO (`ApiResponse::paginated`), SelectAsyncPaginate.
// Guarda "mínimo 3 caracteres" (paridade com o Select2 AJAX do legado, DIV-07)
// — sem chamada de rede antes disso, resolve localmente com lista vazia.
//
// `group_reference: 8` (TASK-BE-1076/TASK-FE-2781, FID-040-02) — FIXO desta
// tela: a Colheita de Frutas é sempre fruticultura, mirror `?group=8` do
// legado (`harvest-products/_forms.blade.php:136-146`). Enum
// `GroupProductReference::PRODUCTION` (backend) — NUNCA resolvido por
// descrição (editável pelo tenant). Este `getProductsOptions` é DEDICADO a
// esta tela (não o `listProductOptions` compartilhado de
// `Products/product-service.ts`, usado sem filtro por Apontamento/
// Inventário/Contrato/OS) — o parâmetro fica explícito aqui, não escondido
// num default de serviço compartilhado.
const HARVEST_PRODUCT_GROUP_REFERENCE = 8;

async function getProductsOptions(
  params: PaginationQueryParams & { search?: string }
): Promise<ResponsePagination<ProductOptionItem[]>> {
  if (!params.search || params.search.trim().length < 3) {
    return emptyResponsePagination<ProductOptionItem>(params.per_page);
  }

  const { data } = await api.V2.get<PaginatedOptionsEnvelope<ProductOptionItem>>(
    '/products/options',
    {
      page: params.page,
      per_page: params.per_page,
      search: params.search,
      group_reference: HARVEST_PRODUCT_GROUP_REFERENCE,
    }
  );

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

// `cities/options` — PAGINADO (`ApiResponse::paginated`), SelectAsyncPaginate,
// mesma guarda de 3 caracteres.
async function getCitiesOptions(
  params: PaginationQueryParams & { search?: string }
): Promise<ResponsePagination<CityOptionItem[]>> {
  if (!params.search || params.search.trim().length < 3) {
    return emptyResponsePagination<CityOptionItem>(params.per_page);
  }

  const { data } = await api.V2.get<PaginatedOptionsEnvelope<CityOptionItem>>('/cities/options', {
    page: params.page,
    per_page: params.per_page,
    search: params.search,
  });

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

export {
  createHarvestProduct,
  deleteHarvestProduct,
  getAllHarvestProducts,
  getAreasOptions,
  getCitiesOptions,
  getClientsOptions,
  getHarvestProduct,
  getProductsOptions,
  updateHarvestProduct,
};
