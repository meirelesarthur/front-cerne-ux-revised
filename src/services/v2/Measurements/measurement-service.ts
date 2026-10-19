// src/services/v2/Measurements/measurement-service.ts
// -----------------------------------------------------------------------------
// Measurement Service — API v1 do backend Laravel GB.Cerne (Un. de Medida).
// TASK-FE-053 (fundação de dados, sem UI) + TASK-FE-054 (listagem, paginação
// REAL — GAP-BE-043 fechado ✅ CONCLUÍDO, GAP-FE-009 resolvido). Acréscimo
// pós-migração: filtro de busca textual (`search`), decisão explícita do dev
// no E2E (o legado não tinha busca — ver @types/v2/Measurements/index.d.ts).
//
// Contrato (envelope ApiResponse): { success, message, data, errors, meta }.
//   GET    /measurements            → paginação REAL (`ApiResponse::paginated`,
//                                      10/página default, teto `min:1|max:100`,
//                                      confirmada por GAP-BE-043) — meta
//                                      completo (current_page/last_page/
//                                      per_page/total). Aceita `search`
//                                      (ILIKE em name/description,
//                                      `MeasurementIndexRequest`).
//                                      `listMeasurements`
//                                      ADAPTA o envelope para o shape
//                                      `ResponsePagination` que
//                                      `useCustomGridQuery` consome — mesmo
//                                      adaptador estrutural de
//                                      `listIdentificationTypes`/`listStates`
//                                      (lê `data.meta.*` de verdade, SEM
//                                      fabricar 1 única página a partir do
//                                      array inteiro).
//   GET    /measurements/{uuid}     → data: MeasurementData
//   POST   /measurements            → payload MeasurementPayload (create)
//   PUT    /measurements/{uuid}     → payload MeasurementPayload (update —
//                                      SEMPRE os 2 campos, nunca delta)
//   DELETE /measurements/{uuid}     → sem try/catch de FK no backend hoje —
//                                      onError genérico do useRequest cobre.
//
// Catálogo GLOBAL — nunca enviar `X-Farm-Id` manualmente (o interceptor
// genérico do `api.ts` anexa o header automaticamente se houver fazenda
// selecionada; o backend simplesmente ignora para este recurso, a rota não
// está no grupo `farm.context`).
// -----------------------------------------------------------------------------

import api from '@/services/api';

import type { PaginationQueryParams } from '@/@types/pagination';
import type { Response, ResponsePagination } from '@/@types/response-api';
import type {
  MeasurementData,
  MeasurementFilterForm,
  MeasurementListItem,
  MeasurementOption,
  MeasurementOptionsListEnvelope,
  MeasurementPayload,
  MeasurementsListEnvelope,
} from '@/@types/v2/Measurements';

// Params aceitos pela listagem — paginação real (`page`/`per_page`), mesma
// convenção de `ListIdentificationTypesParams`. `search` (ILIKE em
// `name`/`description`) é acréscimo pós-migração — consumido pela busca da
// tela de listagem (FilterSideUnidadeMedida), decisão explícita do dev no
// E2E (o legado não tinha busca).
export interface ListMeasurementsParams extends PaginationQueryParams, MeasurementFilterForm {}

async function listMeasurements(
  params: ListMeasurementsParams
): Promise<ResponsePagination<MeasurementListItem[]>> {
  const { data } = await api.V2.get<MeasurementsListEnvelope>('/measurements', {
    page: params.page,
    per_page: params.per_page,
    search: params.search || undefined,
  });

  // Adaptação ApiResponse::paginated → ResponsePagination — LÊ o meta REAL do
  // backend (idêntico a listIdentificationTypes/listStates), NÃO fabrica mais
  // 1 página só a partir do array inteiro.
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

async function getMeasurementByUuid(uuid: string) {
  const { data } = await api.V2.get<Response<MeasurementData>>(`/measurements/${uuid}`);
  return data;
}

async function createMeasurement(payload: MeasurementPayload) {
  const { data } = await api.V2.post<Response<MeasurementData>>('/measurements', payload);
  return data;
}

// Payload SEMPRE completo — name/description são `required` nos dois verbos
// (`MeasurementRequest::rules()` não diferencia por verbo), mesmo racional de
// updateIdentificationType (full-resource-replace).
async function updateMeasurement(uuid: string, payload: MeasurementPayload) {
  const { data } = await api.V2.put<Response<MeasurementData>>(`/measurements/${uuid}`, payload);
  return data;
}

async function deleteMeasurement(uuid: string) {
  const { data } = await api.V2.delete(`/measurements/${uuid}`);
  return data;
}

// -----------------------------------------------------------------------------
// GET /measurements/options (TASK-BE-508, aditivo TASK-FE-504) — lookup
// ENXUTO para os Selects de Un. de Medida do formulário de Produtos. SEM gate
// de `measurements_view`. FLAT — `meta` sempre `null`; o `SelectAsyncPaginate`
// que consome este service DEVE receber `pageSize` maior que o volume real do
// catálogo (56 linhas totais) para não disparar uma 2ª página fantasma.
// TASK-FE-940 (correção pós-E2E) alinhou `measurement_uuid` (Aba 1) ao mesmo
// endpoint `/options` já usado por `second_measurement_uuid` (Aba 2,
// `TASK-FE-504`) — os 2 campos agora usam `listMeasurementOptions`,
// eliminando o toast "Sem permissão" que o `/measurements` paginado (gateado
// por `measurements_view`) disparava na Aba 1.
// -----------------------------------------------------------------------------
export interface ListMeasurementOptionsParams extends PaginationQueryParams {
  search?: string;
}

async function listMeasurementOptions(
  params: ListMeasurementOptionsParams
): Promise<ResponsePagination<MeasurementOption[]>> {
  const { data } = await api.V2.get<MeasurementOptionsListEnvelope>('/measurements/options', {
    search: params.search || undefined,
  });

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

export {
  createMeasurement,
  deleteMeasurement,
  getMeasurementByUuid,
  listMeasurementOptions,
  listMeasurements,
  updateMeasurement,
};
