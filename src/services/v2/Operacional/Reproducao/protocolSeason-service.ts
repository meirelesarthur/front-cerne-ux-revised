// src/services/v2/Operacional/Reproducao/protocolSeason-service.ts
// -----------------------------------------------------------------------------
// ProtocolSeason Service — API v1 do backend Laravel GB.Cerne (Protocolos/
// Estação — Operacional / Reprodução, F-057, execução 040, TASK-FE-1051).
//
// `BASE = '/protocols-season'` CONFIRMADO contra `routes/api.php` real do
// `api_root` (`Route::apiResource('protocols-season', ProtocolSeasonController)`
// + `GET protocols-season/next-code`, ambos sob `farm.context`).
//
// Contrato (envelope ApiResponse): { success, message, data, errors, meta }.
//   GET    /protocols-season             → paginado (ApiResponse::paginated),
//                                           filtro opcional `start_date`/`end_date`
//   GET    /protocols-season/next-code   → data: { code: string }
//   GET    /protocols-season/{uuid}      → data: ProtocolSeasonData (com
//                                           `items[]` + `timeline[]`, CAL-007)
//   POST   /protocols-season             → payload CreateProtocolSeasonRequest
//   PUT    /protocols-season/{uuid}      → payload UpdateProtocolSeasonRequest
//                                           (MESMO shape do create — `App\Data\
//                                           ProtocolSeason\ProtocolSeasonData`
//                                           NÃO diferencia por verbo; ver nota
//                                           de tipos)
//   DELETE /protocols-season/{uuid}      → 204; pode responder 409
//                                           (`ProtocolSeasonInUseException`,
//                                           `breeding_matings` vinculadas) —
//                                           tratado como erro de negócio no
//                                           call site (TASK-FE-1053/1059), NUNCA
//                                           aqui no service.
//
// `listProtocolSeasons` ADAPTA o envelope paginado do backend
// (`ApiResponse::paginated`) para o shape `ResponsePagination` que
// `useCustomGridQuery`/`TableProvider` consomem — mesmo adaptador de
// `listBreedingSeasons`/`listWarehouses`/`listProducts` (meta REAL, nunca
// fallback fake).
//
// ⚠️ Wire snake_case (achado de reconciliação, ver `@/@types/v2/Operacional/
// Reproducao/protocolSeason`): `ProtocolSeasonData`/`ProtocolItemData` do
// backend usam `#[MapInputName(SnakeCaseMapper::class)]` — os payloads de
// escrita abaixo já chegam neste service no formato correto (snake_case),
// resolvido pelo caller (`CreateOrUpdateProtocolSeason.tsx`, TASK-FE-1059).
// -----------------------------------------------------------------------------

import api from '@/services/api';

import type { PaginationQueryParams } from '@/@types/pagination';
import type { Response, ResponsePagination } from '@/@types/response-api';
import type {
  CreateProtocolSeasonRequest,
  ProtocolSeasonData,
  ProtocolSeasonFilterRequest,
  UpdateProtocolSeasonRequest,
} from '@/@types/v2/Operacional/Reproducao/protocolSeason';

const BASE = '/protocols-season';

interface ProtocolSeasonsListEnvelope {
  success: boolean;
  message: string;
  data: ProtocolSeasonData[];
  meta?: { total?: number; per_page?: number; current_page?: number; last_page?: number };
}

export interface ListProtocolSeasonsParams
  extends PaginationQueryParams, ProtocolSeasonFilterRequest {}

async function listProtocolSeasons(
  params: ListProtocolSeasonsParams
): Promise<ResponsePagination<ProtocolSeasonData[]>> {
  const { data } = await api.V2.get<ProtocolSeasonsListEnvelope>(BASE, {
    page: params.page,
    per_page: params.per_page,
    name: params.name || undefined,
    user_uuid: params.user_uuid || undefined,
    breeding_season_uuid: params.breeding_season_uuid || undefined,
    start_date: params.start_date || undefined,
    end_date: params.end_date || undefined,
  });

  // Adaptação envelope ApiResponse::paginated → ResponsePagination (grid) —
  // idêntico a `listBreedingSeasons`/`listWarehouses` (meta REAL, não fallback fake).
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

async function getNextProtocolSeasonCode(): Promise<Response<{ code: string }>> {
  const { data } = await api.V2.get<Response<{ code: string }>>(`${BASE}/next-code`);
  return data;
}

async function getProtocolSeason(uuid: string): Promise<Response<ProtocolSeasonData>> {
  const { data } = await api.V2.get<Response<ProtocolSeasonData>>(`${BASE}/${uuid}`);
  return data;
}

async function createProtocolSeason(
  body: CreateProtocolSeasonRequest
): Promise<Response<ProtocolSeasonData>> {
  const { data } = await api.V2.post<Response<ProtocolSeasonData>>(BASE, body);
  return data;
}

async function updateProtocolSeason(
  uuid: string,
  body: UpdateProtocolSeasonRequest
): Promise<Response<ProtocolSeasonData>> {
  const { data } = await api.V2.put<Response<ProtocolSeasonData>>(`${BASE}/${uuid}`, body);
  return data;
}

// 409 (`ProtocolSeasonInUseException` — FK RESTRICT de `breeding_matings`)
// tratado no call site (useRequest/onError) como erro de negócio — contrato
// de tela §2.1/§4.1. Aqui só propaga o erro, sem try/catch.
async function deleteProtocolSeason(uuid: string) {
  const { data } = await api.V2.delete(`${BASE}/${uuid}`);
  return data;
}

export {
  createProtocolSeason,
  deleteProtocolSeason,
  getNextProtocolSeasonCode,
  getProtocolSeason,
  listProtocolSeasons,
  updateProtocolSeason,
};
