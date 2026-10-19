// src/services/v2/CategoryTypes/category-type-service.ts
// -----------------------------------------------------------------------------
// Category Type Service — API v1 do backend Laravel GB.Cerne (Tipos de
// Categoria). Dois consumidores:
//   (1) TASK-CTY-01/02 — CRUD completo da tela de Tipos de Categoria (grid +
//       form): list/delete + get/create/update.
//   (2) TASK-FE-310/312 — select `type_uuid` do formulário de Categoria
//       Financeira (`SelectAsyncPaginate`), que consome só `listCategoryTypes`
//       (leitura paginada por `search`).
//
// Contrato (envelope ApiResponse): { success, message, data, errors, meta }.
//   GET    /category-types            → data: CategoryTypeListItem[] + meta
//                                        REAL de paginação (ApiResponse::
//                                        paginated(), CategoryTypeController::
//                                        index()). Aceita `search` (ILIKE
//                                        `description`) e `is_enabled`
//                                        (permissão `categorytypes_view`).
//                                        ⚠️ `per_page` é ENVIADO mas IGNORADO
//                                        pelo backend hoje
//                                        (`CategoryTypeRepository::
//                                        listPaginated()` usa `->paginate(15)`
//                                        fixo) — Risco 2 da ficha da Tarefa.
//                                        Não remover o parâmetro do client por
//                                        isso (o backend pode evoluir); só não
//                                        prometer que o seletor de itens/página
//                                        muda a quantidade real de linhas hoje.
//   DELETE /category-types/{uuid}     → 204; hoje SEM guarda de FK
//                                        (`financial_categories.type_id`
//                                        `ON DELETE RESTRICT`) — pode devolver
//                                        500 cru em vez de 422 estruturado
//                                        quando em uso (Risco 1 da ficha). O
//                                        `onError` genérico do `useRequest`
//                                        já trata qualquer envelope de erro sem
//                                        código extra.
//
// `listCategoryTypes` ADAPTA o envelope paginado do backend ({ data: [],
// meta: {} }) para o shape `ResponsePagination` que a infra de grid
// (useCustomGridQuery/TableProvider) E o `SelectAsyncPaginate` consomem —
// mesmo adaptador de `listLowReasons`/`listTypeTitles`/`listFinancialCategories`.
//
// Sem `X-Farm-Id` real — a rota `category-types` está fora do grupo
// `farm.context` (dado mestre GLOBAL, mesmo padrão de `Bank`/`LowReason`). O
// interceptor axios global continua anexando o header automaticamente, mas o
// backend o ignora para este recurso.
// -----------------------------------------------------------------------------

import api from '@/services/api';

import type { PaginationQueryParams } from '@/@types/pagination';
import type { Response, ResponsePagination } from '@/@types/response-api';
import type {
  CategoryTypeData,
  CategoryTypeListItem,
  CategoryTypePayload,
  CategoryTypesListEnvelope,
} from '@/@types/v2/CategoryTypes';

// Params aceitos pela listagem — paginação padrão + busca + filtro real do
// backend (`is_enabled`). Aceita tanto o formato `'true'|'false'` do drawer de
// filtro da grid (TASK-CTY-01) quanto o `boolean` usado pelo select de
// Categoria Financeira (TASK-FE-310/312) — normalizado no envio abaixo.
export interface ListCategoryTypesParams extends PaginationQueryParams {
  search?: string;
  is_enabled?: boolean | 'true' | 'false';
}

async function listCategoryTypes(
  params: ListCategoryTypesParams
): Promise<ResponsePagination<CategoryTypeListItem[]>> {
  const { data } = await api.V2.get<CategoryTypesListEnvelope>('/category-types', {
    page: params.page,
    per_page: params.per_page,
    search: params.search || undefined,
    // NUNCA usar `|| undefined` aqui — descartaria o filtro explícito de
    // "desabilitado" (`false`/`'false'` são falsy mas válidos). O drawer da
    // grid (`useCustomGridQuery`) já remove `''` do filtro antes de chegar
    // aqui, então `is_enabled` só chega como `boolean | 'true' | 'false' |
    // undefined` neste ponto.
    is_enabled: params.is_enabled,
  });

  // Adaptação envelope ApiResponse::paginated → ResponsePagination (grid e
  // SelectAsyncPaginate) — mesmo mecanismo de listLowReasons/listTypeTitles.
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

async function deleteCategoryType(categoryTypeUuid: string) {
  const { data } = await api.V2.delete(`/category-types/${categoryTypeUuid}`);
  return data;
}

// TASK-CTY-02 — detalhe (form de edição).
async function getCategoryType(categoryTypeUuid: string) {
  const { data } = await api.V2.get<Response<CategoryTypeData>>(
    `/category-types/${categoryTypeUuid}`
  );
  return data;
}

async function createCategoryType(payload: CategoryTypePayload) {
  const { data } = await api.V2.post<Response<CategoryTypeData>>('/category-types', payload);
  return data;
}

// UPDATE recebe o payload COMPLETO — `CategoryTypeRequest::rules()` não
// distingue verbo (description/is_enabled são `required` em ambos),
// full-resource-replace, mesma regra de Especies/TypeTitle/PlanAccount. NUNCA
// gatear estes 2 campos por `dirtyFields` no PUT.
async function updateCategoryType(categoryTypeUuid: string, payload: CategoryTypePayload) {
  const { data } = await api.V2.put<Response<CategoryTypeData>>(
    `/category-types/${categoryTypeUuid}`,
    payload
  );
  return data;
}

export {
  createCategoryType,
  deleteCategoryType,
  getCategoryType,
  listCategoryTypes,
  updateCategoryType,
};
