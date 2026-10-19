// src/services/v2/BreedingMating/breeding-mating-service.ts
// -----------------------------------------------------------------------------
// Breeding Mating Service — API v1 do backend Laravel GB.Cerne (Acasalamento,
// Operacional / Reprodução, F-016, 97-Esteiras/001, Tarefa 02). Cobre
// `EP-BM-01`…`EP-BM-14` (contrato de API §6.1). `EP-BM-15`
// (`POST /animals/batch-transfer`) é REUSO INTEGRAL — ver
// `transferAnimalsBatch` em `@/services/v2/Animals/animal-service.ts`, não
// duplicado aqui.
//
// Contrato (envelope ApiResponse): { success, message, data, errors, meta }.
//   GET    /breeding-matings                                    → EP-BM-01
//   GET    /breeding-matings/{uuid}                              → EP-BM-02
//   GET    /breeding-matings/form-context                        → EP-BM-03
//   GET    /breeding-matings/{uuid}/form-context                 → EP-BM-04
//   POST   /breeding-matings                                     → EP-BM-05
//   PUT    /breeding-matings/{uuid}                               → EP-BM-06
//   DELETE /breeding-matings/{uuid}                               → EP-BM-07
//   POST   /breeding-matings/{uuid}/finish                       → EP-BM-08
//   GET    /breeding-matings/{uuid}/next-step                    → EP-BM-09
//   POST   /breeding-matings/{uuid}/next-step                    → EP-BM-10
//   GET    /breeding-matings/breeding-batch-animals/{uuid}       → EP-BM-11
//   GET    /breeding-matings/breeding-season-context/{uuid}      → EP-BM-12
//   GET    /breeding-matings/transfer-batches/{uuid}              → EP-BM-13
//   GET    /breeding-matings/responsible-options                  → EP-BM-14
//
// `type`/`protocol_uuid` são imutáveis no update (CLM-002) — o service não
// reimplementa a regra, só reflete o shape em `UpdateBreedingMatingRequest`.
// -----------------------------------------------------------------------------

import api from '@/services/api';

import type { PaginationQueryParams } from '@/@types/pagination';
import type { Response, ResponsePagination } from '@/@types/response-api';
import type {
  AnimalOptionRef,
  BreedingMatingData,
  BreedingMatingFilterRequest,
  BreedingMatingFormContext,
  BreedingMatingListItem,
  BreedingMatingNextStepContext,
  BreedingMatingsListEnvelope,
  BreedingSeasonCascadeContext,
  CreateBreedingMatingRequest,
  EntityOptionRef,
  StoreBreedingMatingNextStepRequest,
  TransferBatchOptionRef,
  UpdateBreedingMatingRequest,
} from '@/@types/v2/BreedingMating';

// Params aceitos pela listagem — paginação real + filtro do backend
// (contrato de tela §5.1): `user_uuid`/`breeding_batch_uuid`.
export interface ListBreedingMatingsParams
  extends PaginationQueryParams, BreedingMatingFilterRequest {}

async function listBreedingMatings(
  params: ListBreedingMatingsParams
): Promise<ResponsePagination<BreedingMatingListItem[]>> {
  const { data } = await api.V2.get<BreedingMatingsListEnvelope>('/breeding-matings', {
    page: params.page,
    per_page: params.per_page,
    user_uuid: params.user_uuid || undefined,
    breeding_batch_uuid: params.breeding_batch_uuid || undefined,
  });

  // Adaptação envelope ApiResponse::paginated → ResponsePagination (grid) —
  // mesmo adaptador de `listBreedingBatches`/`listBreedingSeasons`.
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

async function getBreedingMating(uuid: string): Promise<Response<BreedingMatingData>> {
  const { data } = await api.V2.get<Response<BreedingMatingData>>(`/breeding-matings/${uuid}`);
  return data;
}

// `GET /breeding-matings/form-context` — gate `breeding-matings_create`.
async function getBreedingMatingCreateContext(): Promise<Response<BreedingMatingFormContext>> {
  const { data } = await api.V2.get<Response<BreedingMatingFormContext>>(
    '/breeding-matings/form-context'
  );
  return data;
}

// `GET /breeding-matings/{uuid}/form-context` — gate `breeding-matings_edit`;
// `data.breeding_mating` vem hidratado (contrato de tela §5.3).
async function getBreedingMatingEditContext(
  uuid: string
): Promise<Response<BreedingMatingFormContext>> {
  const { data } = await api.V2.get<Response<BreedingMatingFormContext>>(
    `/breeding-matings/${uuid}/form-context`
  );
  return data;
}

async function createBreedingMating(
  payload: CreateBreedingMatingRequest
): Promise<Response<BreedingMatingData>> {
  const { data } = await api.V2.post<Response<BreedingMatingData>>('/breeding-matings', payload);
  return data;
}

async function updateBreedingMating(
  uuid: string,
  payload: UpdateBreedingMatingRequest
): Promise<Response<BreedingMatingData>> {
  const { data } = await api.V2.put<Response<BreedingMatingData>>(
    `/breeding-matings/${uuid}`,
    payload
  );
  return data;
}

async function deleteBreedingMating(uuid: string) {
  const { data } = await api.V2.delete(`/breeding-matings/${uuid}`);
  return data;
}

// `POST /breeding-matings/{uuid}/finish` — só `status = 2`, nada mais (CLM-010).
async function finishBreedingMating(uuid: string): Promise<Response<BreedingMatingData>> {
  const { data } = await api.V2.post<Response<BreedingMatingData>>(
    `/breeding-matings/${uuid}/finish`
  );
  return data;
}

// `GET /breeding-matings/{uuid}/next-step` — já devolve a próxima
// identificação e data; se já for a última, repete a mesma (regra, não
// borda — contrato de tela §6.5). `individual` reflete `?mode=individual`,
// mesma condição `can_next_step` do menu de ações (CLM-022).
async function getBreedingMatingNextStepContext(
  uuid: string,
  individual?: boolean
): Promise<Response<BreedingMatingNextStepContext>> {
  const { data } = await api.V2.get<Response<BreedingMatingNextStepContext>>(
    `/breeding-matings/${uuid}/next-step`,
    { mode: individual ? 'individual' : undefined }
  );
  return data;
}

async function storeBreedingMatingNextStep(
  uuid: string,
  payload: StoreBreedingMatingNextStepRequest
): Promise<Response<BreedingMatingData>> {
  const { data } = await api.V2.post<Response<BreedingMatingData>>(
    `/breeding-matings/${uuid}/next-step`,
    payload
  );
  return data;
}

// `GET /breeding-matings/breeding-batch-animals/{uuid}` — cascata C6
// (`breeding_batch_uuid` muda → repovoa animais elegíveis, contrato de tela
// §3.1/§6.3). Resposta PLANA (sem paginação/`meta`).
async function listBreedingBatchAnimals(breedingBatchUuid: string): Promise<AnimalOptionRef[]> {
  const { data } = await api.V2.get<Response<AnimalOptionRef[]>>(
    `/breeding-matings/breeding-batch-animals/${breedingBatchUuid}`
  );
  return data.data ?? [];
}

// `GET /breeding-matings/breeding-season-context/{uuid}` — cascata C3
// (`breeding_season_uuid` muda → repovoa touro/sêmen, protocolo e lote;
// os 3 selects são LIMPOS antes de repovoar, contrato de tela §6.3).
async function getBreedingSeasonCascadeContext(
  breedingSeasonUuid: string
): Promise<Response<BreedingSeasonCascadeContext>> {
  const { data } = await api.V2.get<Response<BreedingSeasonCascadeContext>>(
    `/breeding-matings/breeding-season-context/${breedingSeasonUuid}`
  );
  return data;
}

// `GET /breeding-matings/transfer-batches/{uuid}` — exclui lotes já
// pertencentes ao lote de reprodução atual (contrato de tela §3.6).
// Resposta PLANA, reusada por `BatchTransferDialog` (Acasalamento e DG).
async function listTransferBatchOptions(
  breedingBatchUuid: string
): Promise<TransferBatchOptionRef[]> {
  const { data } = await api.V2.get<Response<TransferBatchOptionRef[]>>(
    `/breeding-matings/transfer-batches/${breedingBatchUuid}`
  );
  return data.data ?? [];
}

// `GET /breeding-matings/responsible-options` — exclui `users.id = 6`
// hardcoded no SERVIDOR (CLM-019, GAP-BM-06); o front só consome.
async function listResponsibleOptions(): Promise<EntityOptionRef[]> {
  const { data } = await api.V2.get<Response<EntityOptionRef[]>>(
    '/breeding-matings/responsible-options'
  );
  return data.data ?? [];
}

export {
  createBreedingMating,
  deleteBreedingMating,
  finishBreedingMating,
  getBreedingMating,
  getBreedingMatingCreateContext,
  getBreedingMatingEditContext,
  getBreedingMatingNextStepContext,
  getBreedingSeasonCascadeContext,
  listBreedingBatchAnimals,
  listBreedingMatings,
  listResponsibleOptions,
  listTransferBatchOptions,
  storeBreedingMatingNextStep,
  updateBreedingMating,
};
