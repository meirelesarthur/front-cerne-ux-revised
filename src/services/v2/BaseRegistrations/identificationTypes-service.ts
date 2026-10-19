// src/services/v2/BaseRegistrations/identificationTypes-service.ts
// -----------------------------------------------------------------------------
// Identification Type Service — API v1 do backend Laravel GB.Cerne (Tipos de
// Identificação). TASK-FE-037 (fundação de dados, sem UI).
//
// Contrato (envelope ApiResponse): { success, message, data, errors, meta }.
//   GET    /identification-types            → data: IdentificationTypeListItem[],
//                                              meta REAL (paginação Laravel,
//                                              `ApiResponse::paginated`, 10/página
//                                              default, teto 100, ordenado por
//                                              `description` asc)
//   GET    /identification-types/{uuid}     → data: IdentificationTypeData
//   POST   /identification-types            → payload IdentificationTypePayload (create)
//   PUT    /identification-types/{uuid}     → payload IdentificationTypePayload
//                                              (update — SEMPRE os 2 campos,
//                                              nunca delta)
//   DELETE /identification-types/{uuid}     → 204; 422 estruturado
//                                              (BusinessRuleException) se em uso
//                                              pelas FKs animal_id_animal/
//                                              birth_animal_id_animal
//
// `listIdentificationTypes` ADAPTA o envelope `ApiResponse::paginated` (meta
// REAL) para o shape `ResponsePagination` que `useCustomGridQuery` consome —
// mesmo adaptador estrutural de `listStates`/`state-service.ts` (lê
// `data.meta.*` de verdade). NÃO fabrica 1 única página a partir do array
// inteiro (comportamento fake de `listDiagnosticTechniques` — este módulo pagina
// de verdade, diferença crítica documentada em TASK-FE-037).
//
// Catálogo GLOBAL — nunca enviar `X-Farm-Id` manualmente (o interceptor
// genérico do `api.ts` anexa o header automaticamente se houver fazenda
// selecionada; o backend simplesmente ignora para este recurso, a rota não
// está no grupo `farm.context`).
//
// Filtro suportado pelo backend: `search`/`is_enabled`, aditivos — NENHUM
// consumido por nenhuma tela nesta rodada (fidelidade ao legado, TASK-FE-038).
// -----------------------------------------------------------------------------

import api from '@/services/api';

import type { PaginationQueryParams } from '@/@types/pagination';
import type { Response, ResponsePagination } from '@/@types/response-api';
import type {
  IdentificationTypeData,
  IdentificationTypeFilterForm,
  IdentificationTypeListItem,
  IdentificationTypeOptionItem,
  IdentificationTypePayload,
  IdentificationTypesListEnvelope,
  IdentificationTypesOptionsListEnvelope,
} from '@/@types/v2/BaseRegistrations/identificationTypes';

// Params aceitos pela listagem — paginação real (`page`/`per_page`), mesma
// convenção de `ListStatesParams`. `search`/`is_enabled` existem no tipo por
// consistência de assinatura com `IdentificationTypeFilterForm`, mas nenhuma
// tela desta rodada os preenche.
export interface ListIdentificationTypesParams
  extends PaginationQueryParams, IdentificationTypeFilterForm {}

async function listIdentificationTypes(
  params: ListIdentificationTypesParams
): Promise<ResponsePagination<IdentificationTypeListItem[]>> {
  const { data } = await api.V2.get<IdentificationTypesListEnvelope>('/identification-types', {
    page: params.page,
    per_page: params.per_page,
    // search/is_enabled: aceitos pelo backend, mas nenhuma tela desta rodada os envia.
  });

  // Adaptação ApiResponse::paginated → ResponsePagination — LÊ o meta REAL do
  // backend (idêntico a listStates/listCities), NÃO fabrica mais 1 página só
  // a partir do array inteiro.
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

async function getIdentificationTypeByUuid(identificationTypeUuid: string) {
  const { data } = await api.V2.get<Response<IdentificationTypeData>>(
    `/identification-types/${identificationTypeUuid}`
  );
  return data;
}

async function createIdentificationType(payload: IdentificationTypePayload) {
  const { data } = await api.V2.post<Response<IdentificationTypeData>>(
    '/identification-types',
    payload
  );
  return data;
}

// Payload SEMPRE completo — description/is_enabled são `required` nos dois
// verbos (`IdentificationTypeRequest::rules()` não diferencia por verbo),
// mesmo racional de updateDiagnosticTechnique (full-resource-replace).
async function updateIdentificationType(
  identificationTypeUuid: string,
  payload: IdentificationTypePayload
) {
  const { data } = await api.V2.put<Response<IdentificationTypeData>>(
    `/identification-types/${identificationTypeUuid}`,
    payload
  );
  return data;
}

async function deleteIdentificationType(identificationTypeUuid: string) {
  const { data } = await api.V2.delete(`/identification-types/${identificationTypeUuid}`);
  return data;
}

// GET /identification-types/options — GAP-FE-206 (correção pós-E2E,
// 2026-08-03): lookup ENXUTO, SEM `idanimal_view`
// (`IdentificationTypeOptionResource`, uuid+label) — existe justamente para
// os Selects de Tipo de Identificação do form de Animal (bloco de
// identificação dinâmica + bloco Bezerro), consumido por qualquer usuário
// autenticado, independente de privilégio administrativo sobre o catálogo.
// `listIdentificationTypes` (índice completo, GATEADO por `idanimal_view`)
// PERMANECE intocado — usado pela tela de administração própria.
export interface ListIdentificationTypeOptionsParams extends PaginationQueryParams {
  search?: string;
}

async function listIdentificationTypeOptions(
  params: ListIdentificationTypeOptionsParams
): Promise<ResponsePagination<IdentificationTypeOptionItem[]>> {
  const { data } = await api.V2.get<IdentificationTypesOptionsListEnvelope>(
    '/identification-types/options',
    { search: params.search || undefined }
  );

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
  createIdentificationType,
  deleteIdentificationType,
  getIdentificationTypeByUuid,
  listIdentificationTypeOptions,
  listIdentificationTypes,
  updateIdentificationType,
};
