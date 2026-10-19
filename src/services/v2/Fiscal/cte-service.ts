// src/services/v2/Fiscal/cte-service.ts
// -----------------------------------------------------------------------------
// CT-e Service — API v1 do backend GB.Cerne.Api (Cte — domínio Fiscal,
// execução 045, Onda 1, TASK-CTE-FE-01/05/07). `BASE = '/ctes'` confirmado
// contra `routes/api.php` real (`Route::apiResource('ctes', CteController)`
// + `ctes/{uuid}/report`).
//
// Envelope `ApiResponse` (Lei do SPA overlay): `{ success, message, data,
// errors, meta }`. `X-Farm-Id`/Sanctum já injetados pelo interceptor de
// `api.V2` (get_spa_api_client_pattern §1/§2) — nenhum header manual aqui.
//
// `getCteReport` retorna Blob via `responseType: 'blob'` (axios, headers
// PROPAGADOS pelo interceptor) — NUNCA `window.open(url cru)`: a rota exige
// `X-Farm-Id` (header custom, `farm.context`), que uma navegação direta do
// browser não envia (mirror `BaixaEstoqueReport.tsx`/`DfeReport.tsx`, já em
// produção neste repositório — achado de reconciliação desta Tarefa,
// diverge do roteiro literal de `TASK-CTE-FE-07`, que sugeria `window.open`
// cru; devolvido no recibo).
//
// Nenhuma chamada Axios fora deste arquivo (Lei 3/7).
// -----------------------------------------------------------------------------

import api from '@/services/api';

import type { PaginationQueryParams } from '@/@types/pagination';
import type { Response, ResponsePagination } from '@/@types/response-api';
import type {
  CreateCteRequest,
  CteClientOptionItem,
  CteCityOptionItem,
  CteData,
  CteEquipmentOptionItem,
  CteFilterRequest,
  CteListItem,
  UpdateCteRequest,
} from '@/@types/v2/Fiscal/cte';

const BASE = '/ctes';

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

export interface ListCtesParams extends PaginationQueryParams, CteFilterRequest {}

// E1 — GET /api/v1/ctes (grid, LS01-LS09).
async function getAllCtes(params: ListCtesParams): Promise<ResponsePagination<CteListItem[]>> {
  const { data } = await api.V2.get<{
    success: boolean;
    message: string;
    data: CteListItem[];
    meta?: { total?: number; per_page?: number; current_page?: number; last_page?: number };
  }>(BASE, {
    page: params.page,
    per_page: params.per_page,
    estado: params.estado || undefined,
    start_date: params.start_date || undefined,
    end_date: params.end_date || undefined,
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

// E3 — GET /api/v1/ctes/{uuid} (show, hidratação da tela de edição).
async function getCte(uuid: string): Promise<Response<CteData>> {
  const { data } = await api.V2.get<Response<CteData>>(`${BASE}/${uuid}`);
  return data;
}

// E2 — POST /api/v1/ctes (store).
async function createCte(body: CreateCteRequest): Promise<Response<CteData>> {
  const { data } = await api.V2.post<Response<CteData>>(BASE, body);
  return data;
}

// E4 — PUT /api/v1/ctes/{uuid} (update) — payload SEMPRE completo, mirror
// `IG08`/Contrato §2.1 (nenhum PATCH parcial neste form).
async function updateCte(uuid: string, body: UpdateCteRequest): Promise<Response<CteData>> {
  const { data } = await api.V2.put<Response<CteData>>(`${BASE}/${uuid}`, body);
  return data;
}

// E5 — DELETE /api/v1/ctes/{uuid} (destroy). Servidor não revalida `estado`
// (CL08 preservado) — a UI só esconde a ação, TASK-CTE-FE-06.
async function deleteCte(uuid: string) {
  const { data } = await api.V2.delete(`${BASE}/${uuid}`);
  return data;
}

// E6 — GET /api/v1/ctes/{uuid}/report (PDF, TASK-CTE-FE-07). `responseType:
// 'blob'` propaga X-Farm-Id/cookie via o MESMO interceptor de `api.V2` — o
// call site converte para `URL.createObjectURL` + `window.open`.
async function getCteReport(uuid: string): Promise<Blob> {
  const response = await api.V2.get<Blob>(`${BASE}/${uuid}/report`, undefined, {
    responseType: 'blob',
  });
  return response.data;
}

// -----------------------------------------------------------------------------
// Lookups (TASK-CTE-FE-03/05) — `clients/options`/`equipments/options`/
// `cities/options`, reaproveitados de módulos JÁ MIGRADOS (fora do escopo
// desta feature). GAP-CTE-FE-03: todos devolvem só `uuid` — ver nota no
// `@types/v2/Fiscal/cte/index.d.ts`.
// -----------------------------------------------------------------------------

// `clients/options` — FLAT (`ApiResponse::success`), Select LOCAL, mirror
// `HarvestProduct/harvestProduct-service.ts::getClientsOptions`.
async function getClientsOptions(): Promise<CteClientOptionItem[]> {
  const { data } = await api.V2.get<FlatOptionsEnvelope<CteClientOptionItem>>('/clients/options');
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

// `equipments/options` — PAGINADO (`ApiResponse::paginated`), SelectAsyncPaginate,
// guarda de 3 caracteres (mirror `products/options` de HarvestProduct).
// `fiscal: true` (correção 045, GAP-CTE-FE-03) — o backend passou a aceitar
// o filtro opcional `fiscal` em `/equipments/options`; fixado aqui porque
// este helper é EXCLUSIVO do form de CTe (único consumidor) e o
// `CteRequest` só aceita equipamento com `use_fiscal=1 AND status=1`. Sem
// o filtro, o select listava equipamentos não-fiscais que o POST rejeitava
// com 422. Não propagar este default para `listEquipmentCatalogOptions`
// (`@/services/v2/Equipments/equipment-service`) — helper compartilhado por
// outros módulos (Depreciação, Ordens de Serviço, Pastagem, etc.) que não
// têm essa restrição.
async function getEquipmentsOptions(
  params: PaginationQueryParams & { search?: string }
): Promise<ResponsePagination<CteEquipmentOptionItem[]>> {
  if (!params.search || params.search.trim().length < 3) {
    return emptyResponsePagination<CteEquipmentOptionItem>(params.per_page);
  }

  const { data } = await api.V2.get<PaginatedOptionsEnvelope<CteEquipmentOptionItem>>(
    '/equipments/options',
    { page: params.page, per_page: params.per_page, search: params.search, fiscal: true }
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

// `cities/options` — PAGINADO, SelectAsyncPaginate, mesma guarda de 3
// caracteres (mirror `HarvestProduct::getCitiesOptions`). Reaproveitado por
// `cidadeTomador`/`municipioEnvio`/`municipioInicio`/`municipioFim`.
async function getCitiesOptions(
  params: PaginationQueryParams & { search?: string }
): Promise<ResponsePagination<CteCityOptionItem[]>> {
  if (!params.search || params.search.trim().length < 3) {
    return emptyResponsePagination<CteCityOptionItem>(params.per_page);
  }

  const { data } = await api.V2.get<PaginatedOptionsEnvelope<CteCityOptionItem>>(
    '/cities/options',
    {
      page: params.page,
      per_page: params.per_page,
      search: params.search,
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

// TASK-CTE-FE-05 — cascata `endereco_tomador` (IG07/AC16). Reaproveita
// `GET /api/v1/clients/{uuid}` (`ClientDetailResource`, GAP-CTE-01 Alternativa
// A) — 403 tratado localmente pelo call site (`clients_view` ausente).
export interface CteClientAddress {
  address: string | null;
  number: string | null;
  district: string | null;
  zipCode: string | null;
  city: { uuid: string; name: string } | null;
}

interface ClientDetailEnvelope {
  success: boolean;
  message: string;
  data: {
    address: string | null;
    number: string | null;
    district: string | null;
    zip_code: string | null;
    city: { uuid: string; name: string } | null;
  };
}

async function getClientAddressForCte(clientUuid: string): Promise<CteClientAddress> {
  const { data } = await api.V2.get<ClientDetailEnvelope>(`/clients/${clientUuid}`);
  return {
    address: data.data.address,
    number: data.data.number,
    district: data.data.district,
    zipCode: data.data.zip_code,
    city: data.data.city,
  };
}

export {
  createCte,
  deleteCte,
  getAllCtes,
  getCitiesOptions,
  getClientAddressForCte,
  getClientsOptions,
  getCte,
  getCteReport,
  getEquipmentsOptions,
  updateCte,
};
