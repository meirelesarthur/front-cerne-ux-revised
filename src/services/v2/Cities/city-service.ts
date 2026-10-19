// src/services/v2/Cities/city-service.ts
// -----------------------------------------------------------------------------
// City Service — API v1 do backend Laravel GB.Cerne (Cidades).
//
// Contrato (envelope ApiResponse): { success, message, data, errors, meta }.
//   GET /cities          → data: CityListItem[], meta REAL (paginação Laravel,
//                           50/página FIXO)
//   GET /cities/{uuid}   → data: CityData (mesmo Resource do index) — exportado
//                           por consistência, sem hook/tela consumindo nesta Tarefa.
//
// `listCities` ADAPTA o envelope `ApiResponse::paginated` (meta REAL) para o
// shape `ResponsePagination` que `useCustomGridQuery` consome — mesmo adaptador
// estrutural de `listCostCenters`/`cost-center-service.ts` (lê `data.meta.*` de
// verdade). NÃO fabricar 1 única página como em `listStates`/`state-service.ts` —
// Cidades pagina de verdade (múltiplas centenas de registros).
// -----------------------------------------------------------------------------

import api from '@/services/api';

import type { PaginationQueryParams } from '@/@types/pagination';
import type { Response, ResponsePagination } from '@/@types/response-api';
import type {
  CityData,
  CityFilterForm,
  CityListItem,
  CitiesListEnvelope,
} from '@/@types/v2/Cities';

// Params aceitos pela listagem — paginação real (`page`/`per_page`) + `search` +
// `state_uuid` (cascata Estado→Cidade). Mesma convenção de `ListCostCentersParams`.
export interface ListCitiesParams extends PaginationQueryParams, CityFilterForm {}

async function listCities(params: ListCitiesParams): Promise<ResponsePagination<CityListItem[]>> {
  const { data } = await api.V2.get<CitiesListEnvelope>('/cities', {
    page: params.page,
    per_page: params.per_page,
    search: params.search || undefined,
    state_uuid: params.state_uuid || undefined,
  });

  // Adaptação ApiResponse::paginated → ResponsePagination — LÊ o meta REAL do
  // backend (idêntico a listCostCenters/listRoles), NÃO fabricar 1 página só
  // como em listStates/listSpecies (City pagina de verdade, 50/página).
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

// GET /cities/{uuid} — mesmo Resource do index(). Sem tela de detalhe de Cidade
// nesta Tarefa — exportado por consistência.
async function getCityByUuid(cityUuid: string) {
  const { data } = await api.V2.get<Response<CityData>>(`/cities/${cityUuid}`);
  return data;
}

// GET /cities/options — lookup ENXUTO (GAP-BE-040 addendum, TASK-BE-353), sem
// gate de `cities_view` (só `auth:sanctum`). Alimenta o Select "Cidade" do
// wizard de Pessoas (TASK-FE-327) — usuários sem `cities_view` (ex.: só
// `people_create`/`people_edit`) continuam sem acessar o CRUD completo de
// Cidades, mas conseguem escolher uma Cidade ao criar/editar Pessoa.
// MESMO adaptador de `listCities` (ResponsePagination) — só a rota muda.
// `listCities` (sobre `/cities`, gated) CONTINUA existindo — usada por
// `Cidades/index.tsx`/`CreateOrUpdateEmissor.tsx`, fora de escopo aqui.
async function listCityOptions(
  params: Pick<ListCitiesParams, 'search' | 'per_page' | 'page'>
): Promise<ResponsePagination<CityListItem[]>> {
  const { data } = await api.V2.get<CitiesListEnvelope>('/cities/options', {
    page: params.page,
    per_page: params.per_page,
    search: params.search || undefined,
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

// GET /cities?iso={codigo_ibge} — ADIÇÃO (TASK-CT-FIX-03), resolução de Cidade
// a partir do código IBGE devolvido pelo ViaCEP no autofill de CEP do
// Contador. Filtro `iso` (coluna física, `integer`) igualdade exata — NÃO
// altera `listCities`/`ListCitiesParams`/`CityFilterForm` existentes (escopo
// mínimo, evita risco de regressão em outros consumidores do filtro de
// cidade). Depende do backend aceitar `iso` em `GET /cities` (Tarefa de
// backend paralela, já concluída/validada).
async function getCityByIso(iso: number): Promise<CityListItem | null> {
  const { data } = await api.V2.get<CitiesListEnvelope>('/cities', { iso });
  return data.data[0] ?? null;
}

export { getCityByIso, getCityByUuid, listCities, listCityOptions };
