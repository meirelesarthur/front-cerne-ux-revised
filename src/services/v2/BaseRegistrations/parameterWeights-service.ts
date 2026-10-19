// src/services/v2/BaseRegistrations/parameterWeights-service.ts
// Parameter Weight Service — API v1 do backend Laravel GB.Cerne. Farm-scoped
// (`X-Farm-Id` injetado automaticamente por `src/services/api.ts` em toda
// request `api.V2`, sem diferença de código frente a um cadastro global).
// Envelope ApiResponse { success, message, data, errors, meta } —
// `listParameterWeights` adapta a paginação REAL do backend para o shape
// `ResponsePagination` consumido pela grid (mesmo adaptador de
// `diagnosisPregnancy-service.ts`).
//
// `getParameterWeightByUuid`/`createParameterWeight`/`updateParameterWeight`
// ficam para a Tarefa irmã `TASK-PW-FE-02` (mesmo arquivo, acrescentadas lá)
// — esta Tarefa (`TASK-PW-FE-01`) cria o arquivo com as 2 funções abaixo.

import api from '@/services/api';

import type { PaginationQueryParams } from '@/@types/pagination';
import type { Response, ResponsePagination } from '@/@types/response-api';
import type {
  ParameterWeightData,
  ParameterWeightListItem,
  ParameterWeightPayload,
  ParameterWeightsFilterForm,
  ParameterWeightsListEnvelope,
} from '@/@types/v2/BaseRegistrations/parameterWeights';

// Params aceitos pela listagem — paginação padrão + busca + filtro de período.
export interface ListParameterWeightsParams
  extends PaginationQueryParams, ParameterWeightsFilterForm {}

async function listParameterWeights(
  params: ListParameterWeightsParams
): Promise<ResponsePagination<ParameterWeightListItem[]>> {
  const { data } = await api.V2.get<ParameterWeightsListEnvelope>('/parameter-weights', {
    page: params.page,
    per_page: params.per_page,
    // `?? undefined`, nunca `|| undefined` — armadilha #19 do checklist de
    // nova tela: os filtros de período são strings ISO (não decimais aqui,
    // mas a mesma armadilha estrutural se aplica), então o service NÃO pode
    // reconstruir a query descartando um parâmetro novo.
    search: params.search ?? undefined,
    date_from: params.date_from ?? undefined,
    date_to: params.date_to ?? undefined,
  });

  // Adaptação envelope ApiResponse::paginated → ResponsePagination (grid) —
  // paginação REAL (meta vem do backend).
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

async function deleteParameterWeight(parameterWeightUuid: string) {
  const { data } = await api.V2.delete(`/parameter-weights/${parameterWeightUuid}`);
  return data;
}

// ---- TASK-PW-FE-02: formulário criar/editar -------------------------------

async function getParameterWeightByUuid(
  parameterWeightUuid: string
): Promise<Response<ParameterWeightData>> {
  const { data } = await api.V2.get<Response<ParameterWeightData>>(
    `/parameter-weights/${parameterWeightUuid}`
  );
  return data;
}

async function createParameterWeight(
  payload: ParameterWeightPayload
): Promise<Response<ParameterWeightData>> {
  const { data } = await api.V2.post<Response<ParameterWeightData>>('/parameter-weights', payload);
  return data;
}

// Update parcial — `ParameterWeightRequest::rules()` usa `sometimes` por
// campo quando o verbo não é POST (confirmado por leitura direta do arquivo
// real, api_root), mesmo padrão de `DiagnosisPregnancyRequest`. Payload é o
// DELTA de `dirtyFields`, nunca o completo (ver guard em
// `CreateOrUpdateParameterWeights.tsx`).
async function updateParameterWeight(
  parameterWeightUuid: string,
  payload: Partial<ParameterWeightPayload>
): Promise<Response<ParameterWeightData>> {
  const { data } = await api.V2.put<Response<ParameterWeightData>>(
    `/parameter-weights/${parameterWeightUuid}`,
    payload
  );
  return data;
}

export {
  createParameterWeight,
  deleteParameterWeight,
  getParameterWeightByUuid,
  listParameterWeights,
  updateParameterWeight,
};
