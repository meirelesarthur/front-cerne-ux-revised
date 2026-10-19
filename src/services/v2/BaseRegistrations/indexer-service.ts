// src/services/v2/BaseRegistrations/indexer-service.ts
// -----------------------------------------------------------------------------
// Indexer Service — API v1 do backend Laravel GB.Cerne (Indexadores). TASK-FE-210
// (fundação de dados, sem UI). Mirror mecânico de
// `services/v2/BirthNotes/birth-note-service.ts` + 1 campo (`descriptive`).
//
// Contrato (envelope ApiResponse): { success, message, data, errors, meta }.
//   GET    /indexers            → data: IndexerListItem[], meta REAL
//                                  (paginação Laravel, `ApiResponse::paginated`,
//                                  10/página default, teto 100, ordenado por
//                                  `description` asc)
//   GET    /indexers/{uuid}     → data: IndexerData
//   POST   /indexers            → payload IndexerPayload (create)
//   PUT    /indexers/{uuid}     → payload IndexerPayload (update — SEMPRE
//                                  os 3 campos, nunca delta)
//   DELETE /indexers/{uuid}     → 204 SEMPRE que o uuid existir — SEM guarda
//                                  de FK (D8 do contrato de API, §6)
//
// `listIndexers` ADAPTA o envelope `ApiResponse::paginated` (meta REAL) para
// o shape `ResponsePagination` que `useCustomGridQuery` consome — mesmo
// adaptador estrutural de `listBirthNotes`/`listIdentificationTypes` (lê
// `data.meta.*` de verdade). NÃO fabrica 1 única página a partir do array
// inteiro (comportamento fake que este módulo explicitamente evita, mesma
// armadilha documentada em TASK-FE-210).
//
// Catálogo GLOBAL — nunca enviar `X-Farm-Id` manualmente (o interceptor
// genérico do `api.ts` anexa o header automaticamente se houver fazenda
// selecionada; o backend simplesmente ignora para este recurso, a rota não
// está no grupo `farm.context`).
//
// Filtro suportado pelo backend: `search` (CONSUMIDO pela UI, drawer de
// filtro TASK-FE-211) — filtra por `description` OU `descriptive` (D9 do
// contrato de API §10, detalhe de implementação do servidor). `is_enabled`
// também aditivo mas NÃO consumido nesta rodada (mesma decisão de fidelidade
// de `BirthNote`).
// -----------------------------------------------------------------------------

import api from '@/services/api';

import type { PaginationQueryParams } from '@/@types/pagination';
import type { Response, ResponsePagination } from '@/@types/response-api';
import type {
  IndexerData,
  IndexerFilterForm,
  IndexerListItem,
  IndexerPayload,
  IndexersListEnvelope,
} from '@/@types/v2/BaseRegistrations/indexer';

// Params aceitos pela listagem — paginação real (`page`/`per_page`) + filtro
// `search` (único filtro consumido pela UI, TASK-FE-211).
export interface ListIndexersParams extends PaginationQueryParams, IndexerFilterForm {}

async function listIndexers(
  params: ListIndexersParams
): Promise<ResponsePagination<IndexerListItem[]>> {
  const { data } = await api.V2.get<IndexersListEnvelope>('/indexers', {
    page: params.page,
    per_page: params.per_page,
    search: params.search || undefined,
  });

  // Adaptação ApiResponse::paginated → ResponsePagination — LÊ o meta REAL do
  // backend (idêntico a listBirthNotes/listIdentificationTypes), NÃO fabrica
  // mais 1 página só a partir do array inteiro.
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

async function getIndexerByUuid(indexerUuid: string) {
  const { data } = await api.V2.get<Response<IndexerData>>(`/indexers/${indexerUuid}`);
  return data;
}

async function createIndexer(payload: IndexerPayload) {
  const { data } = await api.V2.post<Response<IndexerData>>('/indexers', payload);
  return data;
}

// Payload SEMPRE completo — description/descriptive/is_enabled são
// `required` nos dois verbos (`IndexerRequest::rules()` não diferencia por
// verbo), mesmo racional de updateBirthNote (full-resource-replace).
async function updateIndexer(indexerUuid: string, payload: IndexerPayload) {
  const { data } = await api.V2.put<Response<IndexerData>>(`/indexers/${indexerUuid}`, payload);
  return data;
}

// 204 SEMPRE que o uuid existir — sem guarda de FK (D8 do contrato de API,
// §6). Diferente de `deleteIdentificationType`/`deleteVaccine`, nenhum
// tratamento especial de 422 "em uso" é necessário aqui.
async function deleteIndexer(indexerUuid: string) {
  const { data } = await api.V2.delete(`/indexers/${indexerUuid}`);
  return data;
}

export { createIndexer, deleteIndexer, getIndexerByUuid, listIndexers, updateIndexer };
