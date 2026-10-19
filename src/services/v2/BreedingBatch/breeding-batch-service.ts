// src/services/v2/BreedingBatch/breeding-batch-service.ts
// -----------------------------------------------------------------------------
// Breeding Batch Service — API v1 do backend Laravel GB.Cerne (Lotes/
// Reprodução, Operacional / Reprodução, 97-Esteiras/048, Tarefa 04). Mirror
// estrutural de `breeding-season-service.ts` (mesmo adaptador do envelope
// paginado real `ApiResponse::paginated` → `ResponsePagination`, consumido
// pela grid via `useCustomGridQuery`) + `bull-seed-season-service.ts` (mesmo
// padrão de lookups PLANOS, `Select` + `useQuery`, NUNCA `SelectAsyncPaginate`).
//
// Contrato (envelope ApiResponse): { success, message, data, errors, meta }.
//   GET    /breeding-batches                          → data:
//     BreedingBatchListItem[] + meta paginação real (filtro opcional
//     `start_date`/`end_date`, contrato de API §7).
//   GET    /breeding-batches/{uuid}                   → data:
//     BreedingBatchDetail (`breeding_season`/`batches` só aqui — mirror
//     `BreedingBatchListResource`, que evita N+1 na listagem).
//   POST   /breeding-batches                          → payload
//     BreedingBatchPayload.
//   PUT    /breeding-batches/{uuid}                   → idem, `batch_uuids`
//     é o array INTEIRO desejado (`sync()` no servidor, mirror `CL-11`).
//   DELETE /breeding-batches/{uuid}                   → hard delete; 422
//     possível (`BusinessRuleException`, lote com acasalamento vinculado,
//     achado #4 do backend) — exibir a mensagem do servidor tal como vem.
//   GET    /breeding-batches/next-code                → { code: string } —
//     sugestão de código, só em modo criação (Tarefa 06).
//   GET    /breeding-batches/breeding-season-options   → data:
//     BreedingSeasonOptionRef[] — resposta PLANA (sem paginação/`meta`).
//   GET    /breeding-batches/batch-options             → data:
//     BatchOptionRef[] — resposta PLANA; aceita
//     `?exclude_breeding_batch_uuid=` (LK-03, só em modo edição — contrato de
//     tela §5.1).
//   GET    /breeding-batches/check-date                → data:
//     BatchCheckDateResponse — validação IG-03/IG-04, SEMPRE 1 `batch_uuid`
//     por chamada (contrato de API §5, mirror `CheckDatesController`),
//     NUNCA em lote.
//
// `createBreedingBatch`/`updateBreedingBatch`/`getBreedingBatchNextCode`/
// `listBreedingSeasonOptions`/`listBatchOptions`/`checkBatchDate` só são
// CONSUMIDOS pela Tarefa 06 (formulário), mas nascem aqui junto do resto do
// service — fundação completa do módulo (mirror da nota já usada em
// `employee-event-service.ts`/`bull-seed-season-service.ts`).
// -----------------------------------------------------------------------------

import api from '@/services/api';

import type { PaginationQueryParams } from '@/@types/pagination';
import type { Response, ResponsePagination } from '@/@types/response-api';
import type {
  BatchCheckDateResponse,
  BatchOptionRef,
  BreedingBatchDetail,
  BreedingBatchesListEnvelope,
  BreedingBatchListItem,
  BreedingBatchPayload,
  BreedingSeasonOptionRef,
} from '@/@types/v2/BreedingBatch';

// Params aceitos pela listagem — paginação real + filtro opcional do backend
// (`BreedingBatchFilterData`): `start_date`/`end_date`.
export interface ListBreedingBatchesParams extends PaginationQueryParams {
  start_date?: string;
  end_date?: string;
}

async function listBreedingBatches(
  params: ListBreedingBatchesParams
): Promise<ResponsePagination<BreedingBatchListItem[]>> {
  const { data } = await api.V2.get<BreedingBatchesListEnvelope>('/breeding-batches', {
    page: params.page,
    per_page: params.per_page,
    start_date: params.start_date || undefined,
    end_date: params.end_date || undefined,
  });

  // Adaptação envelope ApiResponse::paginated → ResponsePagination (grid) —
  // mesmo adaptador de `listBreedingSeasons`/`listBullSeedSeasons`.
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

async function getBreedingBatch(uuid: string): Promise<Response<BreedingBatchDetail>> {
  const { data } = await api.V2.get<Response<BreedingBatchDetail>>(`/breeding-batches/${uuid}`);
  return data;
}

async function createBreedingBatch(
  payload: BreedingBatchPayload
): Promise<Response<BreedingBatchDetail>> {
  const { data } = await api.V2.post<Response<BreedingBatchDetail>>('/breeding-batches', payload);
  return data;
}

async function updateBreedingBatch(
  uuid: string,
  payload: BreedingBatchPayload
): Promise<Response<BreedingBatchDetail>> {
  const { data } = await api.V2.put<Response<BreedingBatchDetail>>(
    `/breeding-batches/${uuid}`,
    payload
  );
  return data;
}

async function deleteBreedingBatch(uuid: string) {
  const { data } = await api.V2.delete(`/breeding-batches/${uuid}`);
  return data;
}

// `GET /breeding-batches/next-code` — sugestão de código, só chamada em modo
// CRIAÇÃO, gate `breeding-batch_create`. Resposta simples `{ code: string }`,
// sem Resource dedicado (contrato de API §7, mirror `getBreedingSeasonNextCode`).
async function getBreedingBatchNextCode(): Promise<Response<{ code: string }>> {
  const { data } = await api.V2.get<Response<{ code: string }>>('/breeding-batches/next-code');
  return data;
}

// `GET /breeding-batches/breeding-season-options` — resposta PLANA (sem
// paginação/`meta`), gate `breeding-batch_view` (LK-01, contrato de API §7).
// Mirror `listBreedingSeasonOptions` do `bull-seed-season-service.ts` —
// `Select` + `useQuery`, NUNCA `SelectAsyncPaginate`.
async function listBreedingSeasonOptions(): Promise<BreedingSeasonOptionRef[]> {
  const { data } = await api.V2.get<Response<BreedingSeasonOptionRef[]>>(
    '/breeding-batches/breeding-season-options'
  );
  return data.data ?? [];
}

// `GET /breeding-batches/batch-options` — resposta PLANA, gate
// `breeding-batch_view` (LK-02/LK-03). 1 única chamada compartilhada por
// todas as linhas do repetidor `BatchesFieldArray` (contrato de tela §5.1) —
// `exclude_breeding_batch_uuid` só propagado quando informado (modo edição,
// LK-03), NUNCA em modo criação (LK-02).
async function listBatchOptions(excludeBreedingBatchUuid?: string): Promise<BatchOptionRef[]> {
  const { data } = await api.V2.get<Response<BatchOptionRef[]>>('/breeding-batches/batch-options', {
    exclude_breeding_batch_uuid: excludeBreedingBatchUuid || undefined,
  });
  return data.data ?? [];
}

// `GET /breeding-batches/check-date` — validação IG-03/IG-04 (contrato de API
// §5/§7, mirror `CheckDatesController`). SEMPRE 1 `{batch_uuid, date}` por
// chamada — disparada por linha do subcadastro (e reexecutada por linha na
// cascata do cabeçalho, Tarefa 06), NUNCA em lote.
async function checkBatchDate(params: {
  batch_uuid: string;
  date: string;
}): Promise<BatchCheckDateResponse> {
  const { data } = await api.V2.get<Response<BatchCheckDateResponse>>(
    '/breeding-batches/check-date',
    { batch_uuid: params.batch_uuid, date: params.date }
  );
  return data.data ?? { valid: true };
}

export {
  checkBatchDate,
  createBreedingBatch,
  deleteBreedingBatch,
  getBreedingBatch,
  getBreedingBatchNextCode,
  listBatchOptions,
  listBreedingBatches,
  listBreedingSeasonOptions,
  updateBreedingBatch,
};
