// src/services/v2/Nutritions/nutrition-service.ts
// -----------------------------------------------------------------------------
// Nutrition Service — API v1 do backend Laravel GB.Cerne (Nutrição —
// Operacional / Consumo de Ração, TASK-NT-FE-01). Fachada CRUD completa
// sobre o Model `Nutrition`/`ItemNutrition`/`NutritionEmployee`
// (Nutrition-contrato.md §3, APROVADO, Ciclo 3). Mirror estrutural de
// `warehouse-transfer-service.ts`/`bull-seed-season-service.ts` (mesmo
// adaptador do envelope paginado real `ApiResponse::paginated` →
// `ResponsePagination`).
//
// Contrato (envelope ApiResponse): { success, message, data, errors, meta }.
//   GET    /nutritions          → data: NutritionListItem[], meta paginação
//                                  REAL (filtros start_date/end_date/
//                                  product_uuid/batch_uuid/employee_uuid,
//                                  §3.1 — `FLT-01/02/04/05` + `FLT-03`).
//   GET    /nutritions/{uuid}   → data: NutritionData (eager-load completo,
//                                  items[]+employees[]).
//   POST   /nutritions          → payload NutritionPayload → data:
//                                  NutritionData.
//   PUT    /nutritions/{uuid}   → payload NutritionPayload (mesmo shape,
//                                  diff de itens/mão-de-obra por `uuid`
//                                  opcional — `DA-NT-11`).
//   DELETE /nutritions/{uuid}   → fiel ao legado, SEM reversão de estoque
//                                  (`GAP-NT-01` [PARA ANÁLISE]).
//
// Os 6 lookups de apoio ao formulário (`DA-NT-05`) vivem em
// `nutrition-lookup-service.ts` (arquivo próprio, deferido para as Tarefas de
// UI consumirem — `TASK-NT-FE-03`), NÃO reimportados aqui.
// -----------------------------------------------------------------------------

import api from '@/services/api';

import type { PaginationQueryParams } from '@/@types/pagination';
import type { Response, ResponsePagination } from '@/@types/response-api';
import type {
  NutritionData,
  NutritionFilterRequest,
  NutritionListItem,
  NutritionPayload,
  NutritionsListEnvelope,
} from '@/@types/v2/Nutritions';

// Params aceitos pela listagem — paginação real + filtros confirmados em
// Nutrition-contrato.md §3.1 (start_date, end_date, product_uuid, batch_uuid,
// employee_uuid).
export interface ListNutritionsParams extends PaginationQueryParams, NutritionFilterRequest {}

async function listNutritions(
  params: ListNutritionsParams
): Promise<ResponsePagination<NutritionListItem[]>> {
  const { data } = await api.V2.get<NutritionsListEnvelope>('/nutritions', {
    page: params.page,
    per_page: params.per_page,
    start_date: params.start_date || undefined,
    end_date: params.end_date || undefined,
    product_uuid: params.product_uuid || undefined,
    batch_uuid: params.batch_uuid || undefined,
    employee_uuid: params.employee_uuid || undefined,
  });

  // Adaptação envelope ApiResponse::paginated → ResponsePagination (grid) —
  // idêntico a `listFoodBeats`/`listWarehouseTransfers`/`listBullSeedSeasons`
  // (meta REAL, nunca fabricada).
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

// GET /nutritions/{uuid} — eager-load completo (items[]+employees[]).
async function getNutrition(nutritionUuid: string): Promise<Response<NutritionData>> {
  const { data } = await api.V2.get<Response<NutritionData>>(`/nutritions/${nutritionUuid}`);
  return data;
}

async function createNutrition(payload: NutritionPayload): Promise<Response<NutritionData>> {
  const { data } = await api.V2.post<Response<NutritionData>>('/nutritions', payload);
  return data;
}

// PUT /nutritions/{uuid} — diff de items[]/employees[] por `uuid` opcional
// (DA-NT-11): presente+existente = update in-place; ausente = criar; item
// atual sem `uuid` no payload = deletar. Mesmo payload shape de `create`.
async function updateNutrition(
  nutritionUuid: string,
  payload: NutritionPayload
): Promise<Response<NutritionData>> {
  const { data } = await api.V2.put<Response<NutritionData>>(
    `/nutritions/${nutritionUuid}`,
    payload
  );
  return data;
}

// DELETE /nutritions/{uuid} — fiel ao legado: SEM reversão do decremento de
// estoque feito no `store()` (GAP-NT-01 [PARA ANÁLISE] — mudança de
// comportamento material, aguarda decisão do dono).
async function deleteNutrition(nutritionUuid: string) {
  const { data } = await api.V2.delete(`/nutritions/${nutritionUuid}`);
  return data;
}

export { createNutrition, deleteNutrition, getNutrition, listNutritions, updateNutrition };
