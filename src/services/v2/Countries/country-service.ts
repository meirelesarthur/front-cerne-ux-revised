// src/services/v2/Countries/country-service.ts
// -----------------------------------------------------------------------------
// Country Service — API v1 do backend Laravel GB.Cerne (Países).
//
// Contrato (envelope ApiResponse): { success, message, data, errors, meta }.
//   GET /countries/options → data: CountryOptionItem[], payload enxuto
//                            (`uuid`+`nome`+`codigo`), SEM gate de permissão
//                            (mirror `listCityOptions`/`listStateOptions`).
//
// `listCountryOptions` ADAPTA o envelope `ApiResponse::paginated` para o shape
// `ResponsePagination` que `SelectAsyncPaginate` consome — mesmo adaptador
// estrutural de `listCityOptions` (city-service.ts). Único consumidor nesta
// execução (024): o Select de País do wizard de Fazenda
// (`GAP-FE-124`/`TASK-BE-424`).
// -----------------------------------------------------------------------------

import api from '@/services/api';

import type { PaginationQueryParams } from '@/@types/pagination';
import type { ResponsePagination } from '@/@types/response-api';
import type { CountriesOptionsEnvelope, CountryOptionItem } from '@/@types/v2/Countries';

export interface ListCountryOptionsParams extends Pick<PaginationQueryParams, 'page' | 'per_page'> {
  search?: string;
  /**
   * Filtro exato por `countries.codigo` (código IBGE) — TASK-072-FE-03 /
   * API-D1 (`TASK-072-API-03` 3.2c). Aditivo: consumidores atuais não enviam.
   */
  codigo?: number;
}

async function listCountryOptions(
  params: ListCountryOptionsParams
): Promise<ResponsePagination<CountryOptionItem[]>> {
  const { data } = await api.V2.get<CountriesOptionsEnvelope>('/countries/options', {
    page: params.page,
    per_page: params.per_page,
    search: params.search || undefined,
    codigo: params.codigo,
  });

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

export { listCountryOptions };
