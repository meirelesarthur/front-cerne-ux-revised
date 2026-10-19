// src/services/v2/CategoryAnimals/category-animal-service.ts
// -----------------------------------------------------------------------------
// CategoryAnimal Service — API v1 do backend Laravel GB.Cerne (Categorias
// Animais). Execução 025, TASK-FE-540.
//
// Contrato (envelope ApiResponse): { success, message, data, errors, meta }.
//   GET    /category-animals          → data: CategoryAnimalListItem[], meta
//                                        com paginação real (TASK-BE-540,
//                                        current_page/last_page/per_page/
//                                        total/from/to).
//   GET    /category-animals/{uuid}   → data: CategoryAnimalData
//   POST   /category-animals          → payload CategoryAnimalPayload
//   PUT    /category-animals/{uuid}   → payload CategoryAnimalPayload
//                                        (SEMPRE completo — ver nota em
//                                        `CategoryAnimalPayload`)
//   DELETE /category-animals/{uuid}   → 204; exclusão DEFINITIVA (sem
//                                        SoftDeletes) — sem guarda de FK
//                                        estruturada confirmada (`GAP-BE-253`
//                                        no backend), tratado pelo `onError`
//                                        genérico do `useRequest` no chamador.
//
// `listCategoryAnimals` ADAPTA o envelope { data: [], meta: {} } para o
// shape `ResponsePagination` que `useCustomGridQuery`/`TableProvider`
// consomem — mesmo adaptador de `listBreeds` (`TASK-BREED-FRONT-PAG`),
// TOLERANTE a `meta: null` (defesa `data.meta?.total ?? data.data.length`)
// durante a janela em que o backend paralelo ainda não tiver o delta
// aplicado.
//
// `specie_uuid` no filtro: decisão do Maestro sobre `GAP-FE-150` — enviado
// como está, mirror `listBreeds` (NUNCA `specie_id` int).
// -----------------------------------------------------------------------------

import api from '@/services/api';

import type { PaginationQueryParams } from '@/@types/pagination';
import type { Response, ResponsePagination } from '@/@types/response-api';
import type {
  CategoryAnimalData,
  CategoryAnimalGender,
  CategoryAnimalListItem,
  CategoryAnimalOptionItem,
  CategoryAnimalPayload,
  CategoryAnimalsListEnvelope,
  CategoryAnimalsOptionsListEnvelope,
} from '@/@types/v2/CategoryAnimals';

// Estende `PaginationQueryParams` (mesma convenção de `ListBreedsParams`/
// `ListKindsParams`) — `page`/`per_page` consumidos de verdade pelo backend
// (TASK-BE-540), além de `search`/`is_enabled`/`specie_uuid`/`gender`.
export interface ListCategoryAnimalsParams extends PaginationQueryParams {
  search?: string;
  is_enabled?: 'true' | 'false';
  specie_uuid?: string;
  gender?: CategoryAnimalGender;
}

async function listCategoryAnimals(
  params: ListCategoryAnimalsParams
): Promise<ResponsePagination<CategoryAnimalListItem[]>> {
  const { data } = await api.V2.get<CategoryAnimalsListEnvelope>('/category-animals', {
    page: params.page,
    per_page: params.per_page,
    search: params.search || undefined,
    is_enabled: params.is_enabled || undefined,
    specie_uuid: params.specie_uuid || undefined,
    gender: params.gender || undefined,
  });

  // Adaptação envelope ApiResponse::paginated → ResponsePagination (grid) —
  // idêntico a `listBreeds`, tolerante a `meta: null`.
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

async function getCategoryAnimalByUuid(uuid: string) {
  const { data } = await api.V2.get<Response<CategoryAnimalData>>(`/category-animals/${uuid}`);
  return data;
}

async function createCategoryAnimal(payload: CategoryAnimalPayload) {
  const { data } = await api.V2.post<Response<CategoryAnimalData>>('/category-animals', payload);
  return data;
}

async function updateCategoryAnimal(uuid: string, payload: CategoryAnimalPayload) {
  const { data } = await api.V2.put<Response<CategoryAnimalData>>(
    `/category-animals/${uuid}`,
    payload
  );
  return data;
}

async function deleteCategoryAnimal(uuid: string) {
  const { data } = await api.V2.delete(`/category-animals/${uuid}`);
  return data;
}

// GET /category-animals/options — GAP-FE-206 (correção pós-E2E,
// 2026-08-03): lookup ENXUTO, SEM `categoryanimals_view`
// (`CategoryAnimalOptionResource`) — existe justamente para o Select de
// Categoria do form/filtro de Animal, consumido por qualquer usuário
// autenticado, independente de privilégio administrativo sobre o catálogo
// de Categorias. `listCategoryAnimals` (índice completo, GATEADO por
// `categoryanimals_view`) PERMANECE intocado — usado pela tela de
// administração `CategoriasAnimais/`.
//
// TASK-BE-930 (fechamento dos 2 Gaps reportados na correção anterior) —
// `is_reproductive` (booleano real, `gender === Gender::FEMALE`) e
// `specie_uuid` (filtro opcional, restaura a narrowing server-side por
// Espécie) confirmados por leitura direta do Resource/Request/Repository do
// `api_root` (ver nota completa em `@/@types/v2/CategoryAnimals`).
//
// `birth_categories` (TASK-BE-932, aditivo) — confirmado por leitura direta
// de `CategoryAnimalController::options()`/`CategoryAnimalOptionsRequest`
// (api_root): restringe o retorno às categorias de faixa etária mais jovem
// (`start_month = 0`), consumido pelo Select `category_uuid` do formulário
// de Nascimentos (TASK-NASC-FE-02, `GAP-NASC-08`, frontend-contract-
// nascimentos.md §3/§7.1). NÃO usado pelo form de Animal (bloco Bezerro
// usa o mesmo endpoint SEM este filtro).
// `tenant_cost_center_scoped` (DIV-01, 063-est03-9-reprovacoes) — opt-in
// ADITIVO (default ausente = comportamento GLOBAL atual, preservado para os
// demais ~5 consumidores deste mesmo endpoint). Quando `true`, o backend
// (TASK-API-063-04) restringe o retorno às categorias vinculadas aos centros
// de custo do tenant ativo (`CategoryAnimalRepository::
// listOptionsForTenantCostCenter`, mirror legado
// `ChangeAnimalFarmController::create()`).
// `is_enabled` (GAP-BE-687/TASK-BE-1088, absorvido por TASK-API-063-04) —
// opt-in ADITIVO, mesmo padrão `?boolean` + `?? undefined` já em produção em
// `client-service`/`employee-service`/`provider-service` (NUNCA `||`:
// `is_enabled === false` é filtro válido, não "ausência de valor").
// Combinável com `tenant_cost_center_scoped` (modo COMBINADO, TASK-FE-063-14).
export interface ListCategoryAnimalOptionsParams extends PaginationQueryParams {
  search?: string;
  specie_uuid?: string;
  birth_categories?: boolean;
  tenant_cost_center_scoped?: boolean;
  is_enabled?: boolean;
}

async function listCategoryAnimalOptions(
  params: ListCategoryAnimalOptionsParams
): Promise<ResponsePagination<CategoryAnimalOptionItem[]>> {
  const { data } = await api.V2.get<CategoryAnimalsOptionsListEnvelope>(
    '/category-animals/options',
    {
      search: params.search || undefined,
      specie_uuid: params.specie_uuid || undefined,
      birth_categories: params.birth_categories || undefined,
      tenant_cost_center_scoped: params.tenant_cost_center_scoped || undefined,
      is_enabled: params.is_enabled ?? undefined,
    }
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
  createCategoryAnimal,
  deleteCategoryAnimal,
  getCategoryAnimalByUuid,
  listCategoryAnimalOptions,
  listCategoryAnimals,
  updateCategoryAnimal,
};
