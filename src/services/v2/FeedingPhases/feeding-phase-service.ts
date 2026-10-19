// src/services/v2/FeedingPhases/feeding-phase-service.ts
// -----------------------------------------------------------------------------
// FeedingPhase Service — API v1 do backend Laravel GB.Cerne (Fases de
// Alimentação — Operacional/Pecuária/Confinamento, F-034, TASK-FP-FE-01).
// Fachada CRUD completa sobre o Model `FeedingPhase`/`ItemFeedingPhase`
// (`feeding-phases-contrato-migracao.md` §4). Mirror estrutural de
// `diet-service.ts` (adaptador de envelope paginado → `ResponsePagination`).
//
// Contrato (envelope ApiResponse), confirmado por leitura direta do
// `FeedingPhaseController`/`FeedingPhaseRepository`:
//   GET    /feeding-phases                → data: FeedingPhaseListItem[],
//                                            meta paginação REAL (filtros
//                                            name/diet_uuid/change_rule).
//                                            Paginação FIXA em 10 no servidor
//                                            (`->paginate(10)`) — `per_page`
//                                            NUNCA enviado por este service.
//   GET    /feeding-phases/{uuid}         → data: FeedingPhaseDetail
//                                            (items[] sempre populado).
//   POST   /feeding-phases                → payload FeedingPhasePayload.
//   PUT    /feeding-phases/{uuid}         → payload FeedingPhasePayload — a
//                                            composição inteira substitui a
//                                            anterior (replace-all).
//   DELETE /feeding-phases/{uuid}         → soft delete (cascade items).
//
// Select de Dieta: REUSA `listDietOptions`/`listDietOptionsPaginated` de
// `@/services/v2/Diets/diet-service` (`GET /diets/diet-options`, já
// migrado, tenant-scoped) — SEM MOCK, sem endpoint/serviço novo.
//
// `X-Farm-Id` via interceptor genérico de `@/services/api.ts` — nunca setado
// manualmente aqui, nunca em querystring.
// -----------------------------------------------------------------------------

import api from '@/services/api';

import type { PaginationQueryParams } from '@/@types/pagination';
import type { Response, ResponsePagination } from '@/@types/response-api';
import type {
  FeedingPhaseChangeRule,
  FeedingPhaseDetail,
  FeedingPhaseFilterForm,
  FeedingPhaseListItem,
  FeedingPhasePayload,
  FeedingPhasesListEnvelope,
} from '@/@types/v2/FeedingPhases';

// Reexport — o select de Dieta do formulário/filtro consome estas funções
// DIRETO de `diet-service` (não passam por aqui); mantidas aqui como
// referência de import único do módulo é opcional, mas o contrato de tela
// exige reuso EXPLÍCITO, não duplicação — por isso NÃO redeclaradas.

// Params aceitos pela listagem — paginação real (só `page`, servidor fixa
// `per_page=10`) + os 3 filtros CORRIGIDOS na API (FLT-01..03/CL-31..33).
export interface ListFeedingPhasesParams extends Omit<PaginationQueryParams, 'per_page'> {
  name?: string;
  diet_uuid?: string;
  change_rule?: FeedingPhaseChangeRule;
}

async function listFeedingPhases(
  params: ListFeedingPhasesParams
): Promise<ResponsePagination<FeedingPhaseListItem[]>> {
  const { data } = await api.V2.get<FeedingPhasesListEnvelope>('/feeding-phases', {
    page: params.page,
    name: params.name || undefined,
    diet_uuid: params.diet_uuid || undefined,
    change_rule: params.change_rule || undefined,
  });

  // Adaptação envelope ApiResponse::paginated → ResponsePagination (grid) —
  // idêntico a `listDiets` (meta REAL, nunca fabricada).
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

// GET /feeding-phases/{uuid} — detalhe + composição de itens.
async function getFeedingPhase(feedingPhaseUuid: string) {
  const { data } = await api.V2.get<Response<FeedingPhaseDetail>>(
    `/feeding-phases/${feedingPhaseUuid}`
  );
  return data;
}

async function createFeedingPhase(payload: FeedingPhasePayload) {
  const { data } = await api.V2.post<Response<FeedingPhaseDetail>>('/feeding-phases', payload);
  return data;
}

// PUT /feeding-phases/{uuid} — a composição inteira SUBSTITUI a anterior
// (replace-all, corrige OQ-03/FM-07 do legado — SEM `item_id` no wire) — o
// chamador nunca deve assumir que um `PUT` parcial preserva itens não
// enviados.
async function updateFeedingPhase(feedingPhaseUuid: string, payload: FeedingPhasePayload) {
  const { data } = await api.V2.put<Response<FeedingPhaseDetail>>(
    `/feeding-phases/${feedingPhaseUuid}`,
    payload
  );
  return data;
}

// DELETE /feeding-phases/{uuid} — soft delete (cascade items).
async function deleteFeedingPhase(feedingPhaseUuid: string) {
  const { data } = await api.V2.delete(`/feeding-phases/${feedingPhaseUuid}`);
  return data;
}

export {
  createFeedingPhase,
  deleteFeedingPhase,
  getFeedingPhase,
  listFeedingPhases,
  updateFeedingPhase,
};

export type { FeedingPhaseFilterForm };
