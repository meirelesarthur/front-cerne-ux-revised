// src/services/v2/States/state-service.ts
// -----------------------------------------------------------------------------
// State Service — API v1 do backend Laravel GB.Cerne (Estados).
//
// Contrato (envelope ApiResponse): { success, message, data, errors, meta }.
//   GET /states          → data: StateListItem[], meta REAL (paginação Laravel,
//                           `ApiResponse::paginated`, 10/página default — ajuste
//                           dev 2026-07-23, ver AJUSTE-FE-ESTADOS-001)
//   GET /states/{uuid}   → data: StateData (mesmo Resource do index) — exportado
//                           por consistência, sem hook/tela consumindo nesta Tarefa.
//
// `listStates` ADAPTA o envelope `ApiResponse::paginated` (meta REAL) para o
// shape `ResponsePagination` que `useCustomGridQuery` consome — mesmo adaptador
// estrutural de `listCities`/`city-service.ts` (lê `data.meta.*` de verdade).
// NÃO fabrica mais 1 única página (comportamento antigo, quando o back só tinha
// `ApiResponse::success()` com `meta:null` — ver Histórico da Tarefa).
// -----------------------------------------------------------------------------

import api from '@/services/api';

import type { PaginationQueryParams } from '@/@types/pagination';
import type { Response, ResponsePagination } from '@/@types/response-api';
import type {
  StateData,
  StateFilterForm,
  StateListItem,
  StateOption,
  StatesListEnvelope,
  StatesOptionsListEnvelope,
} from '@/@types/v2/States';

// Params aceitos pela listagem — paginação real (`page`/`per_page`) + `search`,
// mesma convenção de `ListCitiesParams`.
export interface ListStatesParams extends PaginationQueryParams, StateFilterForm {}

async function listStates(params: ListStatesParams): Promise<ResponsePagination<StateListItem[]>> {
  const { data } = await api.V2.get<StatesListEnvelope>('/states', {
    page: params.page,
    per_page: params.per_page,
    search: params.search || undefined,
  });

  // Adaptação ApiResponse::paginated → ResponsePagination — LÊ o meta REAL do
  // backend (idêntico a listCities/listCostCenters/listRoles), NÃO fabrica mais
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

// GET /states/{uuid} — mesmo Resource do index(). Sem tela de detalhe de Estado
// nesta Tarefa (read-only puro, ver TASK-FE-022) — exportado por consistência.
async function getStateByUuid(stateUuid: string) {
  const { data } = await api.V2.get<Response<StateData>>(`/states/${stateUuid}`);
  return data;
}

// GET /states/options — lookup ENXUTO (TASK-FE-980/GAP-FE-182 corrigido: o
// endpoint já existe em produção, `StateController::options()`, SEM gate de
// `states_view`). Mirror MECÂNICO de `listCityOptions` (`city-service.ts`) —
// mesmo adaptador `ResponsePagination`, só a rota e o Resource (uuid+title+
// letter, `StateOption`, não o `StateListItem` completo) mudam. Alimenta o
// filtro "Estado" da listagem de Cidades (`FilterSideCidades.tsx`),
// repontado de `listStates` (`/states`, gated por `states_view`) —
// `listStates` CONTINUA existindo, usada por `Estados/index.tsx` (fora de
// escopo aqui).
//
// `country_code` — execução 026, AJUSTE 2 do E2E do dev (fidelidade ao
// legado, `EquipmentController.php:119`/`:260` → `State::where('country_id',
// 30)`). Parâmetro OPT-IN e ADITIVO — CONFIRMADO no ar em
// `StateOptionsRequest::rules()` (`country_code` => ['sometimes', 'integer',
// Rule::exists('countries', 'codigo')], adicionado em paralelo por outro
// Executor durante esta mesma execução). Envia `countries.codigo` (código
// IBGE, ex. `1058` = Brasil) como STRING — query params HTTP são sempre
// string; a regra `integer` do backend valida a REPRESENTAÇÃO numérica
// (`filter_var(..., FILTER_VALIDATE_INT)`), não o tipo PHP. Omitido = sem
// filtro (retrocompatível, mesmo comportamento de antes para outros
// consumidores, ex. cascata país→estado de Fazendas).
async function listStateOptions(
  params: Pick<ListStatesParams, 'search' | 'per_page' | 'page'> & { country_code?: string }
): Promise<ResponsePagination<StateOption[]>> {
  const { data } = await api.V2.get<StatesOptionsListEnvelope>('/states/options', {
    page: params.page,
    per_page: params.per_page,
    search: params.search || undefined,
    country_code: params.country_code || undefined,
  });

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

export { getStateByUuid, listStateOptions, listStates };
