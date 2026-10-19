// src/services/v2/BaseRegistrations/troughs-service.ts
// -----------------------------------------------------------------------------
// Trough Service — API v1 do backend Laravel GB.Cerne (Cadastros Base →
// Pecuários → Cochos). TASK-FE-2200 (fundação de dados, listagem, criação,
// edição REAL — a API tem PUT, diferente de Lote/Módulo e Lote/Área — e
// endpoint agregador de opções).
//
// Contrato (envelope ApiResponse): { success, message, data, errors, meta }.
//   GET    /troughs           → data: TroughListItem[], meta REAL (paginação
//                                Laravel, `ApiResponse::paginated`), filtro
//                                `search` (mirror `index()` legado — busca em
//                                código/descrição/área/módulo).
//   GET    /troughs/{uuid}    → data: TroughData.
//   GET    /troughs/options   → data: TroughOptions ({ areas, grazings,
//                                feedlotCorrals } — 1 única chamada, contrato
//                                de API §6/D4).
//   POST   /troughs           → payload TroughPayload (create).
//   PUT    /troughs/{uuid}    → payload TroughPayload (update, `sometimes`).
//   DELETE /troughs/{uuid}    → 204 (exclusão física, sem soft delete).
//
// `listTroughs` ADAPTA o envelope `ApiResponse::paginated` (meta REAL) para o
// shape `ResponsePagination` que `useCustomGridQuery` consome — mesmo
// adaptador estrutural de `listGrazings`/`listDiagnosisPregnancies` (lê
// `data.meta.*` de verdade, NÃO fabrica 1 única página a partir do array
// inteiro).
//
// Farm-scoped (`X-Farm-Id` injetado automaticamente por `src/services/api.ts`,
// sem ação do front). Binding por `uuid`, nunca `id` sequencial.
// -----------------------------------------------------------------------------

import api from '@/services/api';

import type { PaginationQueryParams } from '@/@types/pagination';
import type { Response, ResponsePagination } from '@/@types/response-api';
import type {
  TroughData,
  TroughListItem,
  TroughOptions,
  TroughPayload,
  TroughsFilterForm,
  TroughsListEnvelope,
} from '@/@types/v2/BaseRegistrations/troughs';

// Params aceitos pela listagem — paginação padrão + busca textual (mirror
// `ListDiagnosisPregnanciesParams`).
export interface ListTroughsParams extends PaginationQueryParams, TroughsFilterForm {}

async function listTroughs(
  params: ListTroughsParams
): Promise<ResponsePagination<TroughListItem[]>> {
  const { data } = await api.V2.get<TroughsListEnvelope>('/troughs', {
    page: params.page,
    per_page: params.per_page,
    search: params.search || undefined,
  });

  // Adaptação ApiResponse::paginated → ResponsePagination — LÊ o meta REAL do
  // backend (idêntico a listGrazings/listDiagnosisPregnancies), NÃO fabrica
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

async function getTroughByUuid(troughUuid: string) {
  const { data } = await api.V2.get<Response<TroughData>>(`/troughs/${troughUuid}`);
  return data;
}

// 1 única chamada para os 3 combos de localização do formulário (áreas +
// módulos + currais, com contagens) — contrato de API §6/D4, NUNCA 3
// chamadas separadas. Consumida por `useTroughs.tsx` (TASK-FE-2202).
//
// `trough_uuid` opcional — verificado por leitura direta de
// `TroughController::options()`/`GetTroughOptionsAction` (execução 029): em
// edição, mantém visível na lista de Currais "disponíveis" o Curral HOJE
// vinculado a ESTE Cocho (senão o próprio Curral atual "desapareceria" do
// Select por estar "ocupado" — por ele mesmo). Mirror exato de
// `listDrinkingFountainOptions`/`drinking_fountain_uuid`.
export interface ListTroughOptionsParams {
  trough_uuid?: string;
}

async function listTroughOptions(params: ListTroughOptionsParams = {}) {
  const { data } = await api.V2.get<Response<TroughOptions>>('/troughs/options', {
    trough_uuid: params.trough_uuid,
  });
  return data;
}

// Payload SEMPRE completo — `TroughRequest::rules()` não diferencia por verbo
// além de `required`→`sometimes` (mesmo racional de `createGrazing`).
async function createTrough(payload: TroughPayload) {
  const { data } = await api.V2.post<Response<TroughData>>('/troughs', payload);
  return data;
}

// `feedlot_corral_uuid` viaja com a semântica de 3 estados documentada em
// `@/@types/v2/BaseRegistrations/troughs` (ausente/null/uuid) — o service só
// repassa o objeto montado pelo formulário, nunca decide por conta própria.
async function updateTrough(troughUuid: string, payload: TroughPayload) {
  const { data } = await api.V2.put<Response<TroughData>>(`/troughs/${troughUuid}`, payload);
  return data;
}

async function deleteTrough(troughUuid: string) {
  const { data } = await api.V2.delete(`/troughs/${troughUuid}`);
  return data;
}

export {
  createTrough,
  deleteTrough,
  getTroughByUuid,
  listTroughOptions,
  listTroughs,
  updateTrough,
};
