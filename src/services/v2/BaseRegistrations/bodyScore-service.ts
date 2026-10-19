// src/services/v2/BaseRegistrations/bodyScore-service.ts
// Body Score Service — API v1 do backend Laravel GB.Cerne (Escore Corporal).
// SEM `X-Farm-Id` — cadastro global (contrato §3/§5: rota fora do grupo
// `farm.context.optional`, mesmo padrão de `diagnosisPregnancy-service.ts`).
//
// `listBodyScores` ADAPTA o envelope `{ data: [], meta: null }` (BodyScore
// NUNCA pagina — `index()` do `BodyScoreController` usa `ApiResponse::success()`,
// nunca `::paginated()`, contrato §3) para o shape `ResponsePagination` que
// `useCustomGridQuery` consome — mesmo adaptador estrutural de `listSpecies`
// (species-service.ts), NÃO o de `listDiagnosisPregnancies` (paginação REAL).
// Params aceitos na querystring: SÓ `search` e `specie_uuid` — `is_enabled`
// NÃO é filtro suportado pelo backend (contrato §3, ver TASK-BS-FE-02).

import api from '@/services/api';

import type { PaginationQueryParams } from '@/@types/pagination';
import type { Response, ResponsePagination } from '@/@types/response-api';
import type {
  BodyScoreData,
  BodyScoreListItem,
  BodyScorePayload,
  BodyScoresFilterForm,
  BodyScoresListEnvelope,
} from '@/@types/v2/BaseRegistrations/bodyScore';

// Params aceitos pela listagem — busca (`search`) + filtro (`specie_uuid`).
// Estende `PaginationQueryParams` (mesma convenção de `ListSpeciesParams`)
// para satisfazer a assinatura `asyncFunction` exigida por
// `useCustomGridQuery` — `page`/`per_page` chegam por causa da família Grid,
// mas `listBodyScores` os IGNORA (BodyScore não pagina; ver nota acima).
export interface ListBodyScoresParams extends PaginationQueryParams, BodyScoresFilterForm {}

async function listBodyScores(
  params: ListBodyScoresParams
): Promise<ResponsePagination<BodyScoreListItem[]>> {
  const { data } = await api.V2.get<BodyScoresListEnvelope>('/body-scores', {
    search: params.search || undefined,
    specie_uuid: params.specie_uuid || undefined,
  });

  // Adaptação envelope ApiResponse::success (meta:null) → ResponsePagination
  // (grid) — 1 única página com o array inteiro (mirror listSpecies).
  return {
    success: data.success,
    message: data.message,
    data: {
      items: data.data,
      pagination: {
        total: data.data.length,
        count: data.data.length,
        per_page: data.data.length,
        current_page: 1,
        total_pages: 1,
      },
    },
  };
}

async function getBodyScoreByUuid(bodyScoreUuid: string) {
  const { data } = await api.V2.get<Response<BodyScoreData>>(`/body-scores/${bodyScoreUuid}`);
  return data;
}

async function createBodyScore(payload: BodyScorePayload) {
  const { data } = await api.V2.post<Response<BodyScoreData>>('/body-scores', payload);
  return data;
}

// Assinatura `Partial<BodyScorePayload>` — compatível tanto com delta
// (`sometimes`) quanto com payload completo (`required` nos 2 verbos); a
// decisão de enviar delta ou payload completo é de `TASK-BS-FE-03` (ver
// "Riscos" da ficha TASK-BS-FE-01 — contrato não confirma o comportamento
// exato de `BodyScoreRequest::rules()` em update).
async function updateBodyScore(bodyScoreUuid: string, payload: Partial<BodyScorePayload>) {
  const { data } = await api.V2.put<Response<BodyScoreData>>(
    `/body-scores/${bodyScoreUuid}`,
    payload
  );
  return data;
}

async function deleteBodyScore(bodyScoreUuid: string) {
  const { data } = await api.V2.delete(`/body-scores/${bodyScoreUuid}`);
  return data;
}

export { createBodyScore, deleteBodyScore, getBodyScoreByUuid, listBodyScores, updateBodyScore };
