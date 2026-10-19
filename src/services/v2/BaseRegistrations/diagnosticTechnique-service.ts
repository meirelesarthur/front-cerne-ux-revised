// src/services/v2/BaseRegistrations/diagnosticTechnique-service.ts
// -----------------------------------------------------------------------------
// Diagnostic Technique Service — API v1 do backend Laravel GB.Cerne (Técnicas
// Diagnóstico). TASK-FE-017 (fundação de dados, sem UI).
//
// Contrato (envelope ApiResponse): { success, message, data, errors, meta }.
//   GET    /diagnostic-techniques            → data: DiagnosticTechniqueListItem[],
//                                               meta SEMPRE null
//   GET    /diagnostic-techniques/{uuid}     → data: DiagnosticTechniqueData
//   POST   /diagnostic-techniques            → payload DiagnosticTechniquePayload (create)
//   PUT    /diagnostic-techniques/{uuid}     → payload DiagnosticTechniquePayload
//                                               (update — SEMPRE os 2 campos,
//                                               nunca delta)
//   DELETE /diagnostic-techniques/{uuid}     → 204; sem checagem de dependência
//                                               própria nesta camada — `onError`
//                                               genérico do `useRequest` é
//                                               suficiente (mesmo tratamento de
//                                               Species/LowReason).
//
// `listDiagnosticTechniques` ADAPTA o envelope `{ data: [], meta: null }`
// (Técnica Diagnóstico NUNCA pagina — `index()` usa `ApiResponse::success()`,
// nunca `::paginated()`) para o shape `ResponsePagination` que
// `useCustomGridQuery` consome — mesmo truque estrutural de `listSpecies`
// (aqui `meta` também é SEMPRE `null`, não "às vezes ausente").
//
// Catálogo GLOBAL — nunca enviar `X-Farm-Id` manualmente (o interceptor
// genérico do `api.ts` anexa o header automaticamente se houver fazenda
// selecionada; o backend simplesmente ignora para este recurso, a rota não
// está no grupo `farm.context`).
//
// Filtro suportado pelo backend: SOMENTE `search`. NÃO existe `is_enabled`
// como query param aceito pela API — não fabricar esse filtro aqui.
// -----------------------------------------------------------------------------

import api from '@/services/api';

import type { PaginationQueryParams } from '@/@types/pagination';
import type { Response, ResponsePagination } from '@/@types/response-api';
import type {
  DiagnosticTechniqueData,
  DiagnosticTechniqueFilterForm,
  DiagnosticTechniqueListEnvelope,
  DiagnosticTechniqueListItem,
  DiagnosticTechniquePayload,
} from '@/@types/v2/BaseRegistrations/diagnosticTechnique';

// Params aceitos pela listagem — estende `PaginationQueryParams` (mesma
// convenção de ListSpeciesParams/ListLowReasonsParams) para satisfazer a
// assinatura `asyncFunction` exigida por `useCustomGridQuery` — `page`/
// `per_page` chegam por causa da família Grid, mas `listDiagnosticTechniques`
// os IGNORA (este recurso não pagina; ver nota acima).
export interface ListDiagnosticTechniquesParams
  extends PaginationQueryParams, DiagnosticTechniqueFilterForm {}

async function listDiagnosticTechniques(
  params: ListDiagnosticTechniquesParams
): Promise<ResponsePagination<DiagnosticTechniqueListItem[]>> {
  const { data } = await api.V2.get<DiagnosticTechniqueListEnvelope>('/diagnostic-techniques', {
    search: params.search || undefined,
  });

  // Adaptação envelope ApiResponse::success (meta:null) → ResponsePagination
  // (grid) — 1 única página com o array inteiro, mesmo truque estrutural de
  // listSpecies.
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

async function getDiagnosticTechniqueByUuid(diagnosticTechniqueUuid: string) {
  const { data } = await api.V2.get<Response<DiagnosticTechniqueData>>(
    `/diagnostic-techniques/${diagnosticTechniqueUuid}`
  );
  return data;
}

async function createDiagnosticTechnique(payload: DiagnosticTechniquePayload) {
  const { data } = await api.V2.post<Response<DiagnosticTechniqueData>>(
    '/diagnostic-techniques',
    payload
  );
  return data;
}

// Payload SEMPRE completo — description/is_enabled são `required` nos dois
// verbos (`DiagnosticTechniqueRequest::rules()` não diferencia por verbo),
// mesmo racional de updateLowReason (full-resource-replace), NÃO o delta de
// updateSpecie.
async function updateDiagnosticTechnique(
  diagnosticTechniqueUuid: string,
  payload: DiagnosticTechniquePayload
) {
  const { data } = await api.V2.put<Response<DiagnosticTechniqueData>>(
    `/diagnostic-techniques/${diagnosticTechniqueUuid}`,
    payload
  );
  return data;
}

async function deleteDiagnosticTechnique(diagnosticTechniqueUuid: string) {
  const { data } = await api.V2.delete(`/diagnostic-techniques/${diagnosticTechniqueUuid}`);
  return data;
}

export {
  createDiagnosticTechnique,
  deleteDiagnosticTechnique,
  getDiagnosticTechniqueByUuid,
  listDiagnosticTechniques,
  updateDiagnosticTechnique,
};
