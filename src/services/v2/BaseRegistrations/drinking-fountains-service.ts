// src/services/v2/BaseRegistrations/drinking-fountains-service.ts
// -----------------------------------------------------------------------------
// Drinking Fountain Service ("Bebedouro") — API v1 do backend Laravel
// GB.Cerne. Execução 029, TASK-FE-2300 (fundação de dados). Service PRÓPRIO
// — NÃO reaproveita `troughs-service.ts` (fachadas de API distintas,
// `/drinking-fountains` ≠ `/troughs`, mesma decisão já aplicada a
// Groupers/AccountingGroupers).
//
// Contrato (envelope ApiResponse { success, message, data, errors, meta }):
//   GET    /drinking-fountains           → listDrinkingFountains (paginado, filtro `search`)
//   GET    /drinking-fountains/{uuid}    → getDrinkingFountainByUuid
//   GET    /drinking-fountains/options   → listDrinkingFountainOptions (áreas+módulos+currais, 1 chamada)
//   POST   /drinking-fountains           → createDrinkingFountain
//   PUT    /drinking-fountains/{uuid}    → updateDrinkingFountain
//   DELETE /drinking-fountains/{uuid}    → deleteDrinkingFountain (física, sem soft delete)
//
// `X-Farm-Id` injetado automaticamente pelo interceptor (`src/services/api.ts`)
// — nenhuma ação deste service. Binding por `uuid`, nunca `id` sequencial.
//
// `listDrinkingFountains` ADAPTA o envelope `ApiResponse::paginated` (meta
// REAL) para o shape `ResponsePagination` que `useCustomGridQuery` consome —
// mesmo adaptador estrutural de `listGrazings`/`listDiagnosisPregnancies`.
// -----------------------------------------------------------------------------

import api from '@/services/api';

import type { PaginationQueryParams } from '@/@types/pagination';
import type { Response, ResponsePagination } from '@/@types/response-api';
import type {
  DrinkingFountainData,
  DrinkingFountainListItem,
  DrinkingFountainOptions,
  DrinkingFountainPayload,
  DrinkingFountainsFilterForm,
  DrinkingFountainsListEnvelope,
} from '@/@types/v2/BaseRegistrations/drinking-fountains';

// Params aceitos pela listagem — paginação padrão + busca textual (código/
// descrição/área/módulo, mirror `index()` do contrato de API §1.2 item 2).
export interface ListDrinkingFountainsParams
  extends PaginationQueryParams, DrinkingFountainsFilterForm {}

async function listDrinkingFountains(
  params: ListDrinkingFountainsParams
): Promise<ResponsePagination<DrinkingFountainListItem[]>> {
  const { data } = await api.V2.get<DrinkingFountainsListEnvelope>('/drinking-fountains', {
    page: params.page,
    per_page: params.per_page,
    search: params.search || undefined,
  });

  // Adaptação ApiResponse::paginated → ResponsePagination — lê o meta REAL do
  // backend, mesmo adaptador de `listGrazings`/`listDiagnosisPregnancies`.
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

async function getDrinkingFountainByUuid(drinkingFountainUuid: string) {
  const { data } = await api.V2.get<Response<DrinkingFountainData>>(
    `/drinking-fountains/${drinkingFountainUuid}`
  );
  return data;
}

// Endpoint agregador (contrato de API §6) — áreas elegíveis + módulos de
// Pastejo (com `drinking_fountains_count`) + currais disponíveis, numa única
// chamada. `drinking_fountain_uuid` opcional — em edição, mantém visível na
// lista o Curral HOJE vinculado a ESTE Bebedouro (adição do dono no GATE).
export interface ListDrinkingFountainOptionsParams {
  drinking_fountain_uuid?: string;
}

async function listDrinkingFountainOptions(params: ListDrinkingFountainOptionsParams = {}) {
  const { data } = await api.V2.get<Response<DrinkingFountainOptions>>(
    '/drinking-fountains/options',
    {
      drinking_fountain_uuid: params.drinking_fountain_uuid,
    }
  );
  return data;
}

async function createDrinkingFountain(payload: DrinkingFountainPayload) {
  const { data } = await api.V2.post<Response<DrinkingFountainData>>(
    '/drinking-fountains',
    payload
  );
  return data;
}

// Payload SEMPRE completo (mirror `updateGrazing`/`updateFodder`,
// `DrinkingFountainRequest` não diferencia por verbo além de
// `required`→`sometimes`) — EXCETO `feedlot_corral_uuid`, que é Optional de
// verdade (omitido = mantém o vínculo atual). Ver
// `CreateOrUpdateDrinkingFountain.tsx` para a montagem do payload.
async function updateDrinkingFountain(
  drinkingFountainUuid: string,
  payload: DrinkingFountainPayload
) {
  const { data } = await api.V2.put<Response<DrinkingFountainData>>(
    `/drinking-fountains/${drinkingFountainUuid}`,
    payload
  );
  return data;
}

async function deleteDrinkingFountain(drinkingFountainUuid: string) {
  const { data } = await api.V2.delete(`/drinking-fountains/${drinkingFountainUuid}`);
  return data;
}

export {
  createDrinkingFountain,
  deleteDrinkingFountain,
  getDrinkingFountainByUuid,
  listDrinkingFountainOptions,
  listDrinkingFountains,
  updateDrinkingFountain,
};
