// src/pages/CadastrosBase/Cidades/useCities.tsx
// -----------------------------------------------------------------------------
// Hooks de query do módulo de CIDADES — mesmo padrão de
// CadastrosBase/Estados/useStates.tsx e CadastrosBase/CentroCusto/useCostCenters.tsx.
//
// TASK-FE-021 cobre só a LISTAGEM (useCitiesList) — não há tela de detalhe/
// formulário de Cidade nesta Tarefa (read-only puro, ver TASK-FE-023 para a
// tela de listagem completa com filtro por Estado).
// -----------------------------------------------------------------------------

import type { Dispatch, SetStateAction } from 'react';

import { useCustomGridQuery } from '@/hooks/useCustomGridQuery';

import { queryKey } from '@/constants/query-key';

import { listCities } from '@/services/v2/Cities/city-service';

import type { PaginatedQueryProps } from '@/@types/pagination';
import type { CityFilterForm, CityListItem } from '@/@types/v2/Cities';

interface UseCitiesListProps {
  paginatedQuery: PaginatedQueryProps;
  setPaginatedQuery: Dispatch<SetStateAction<PaginatedQueryProps<any>>>;
  filter?: CityFilterForm;
}

// Query de listagem de cidades (filtros `search`/`state_uuid` vão como query
// params — ver ListCitiesParams). Usa `useCustomGridQuery` (família Grid padrão
// do projeto) — diferente de `useStatesList`, o adaptador `listCities` lê a
// paginação REAL do backend (`paginatedQuery`/`setPaginatedQuery` refletem
// página/total de verdade, 10/página por padrão — ajuste dev 2026-07-23, era
// 50 —, per_page dinâmico do pageSize do grid), mesmo racional de
// `useCostCentersList`.
export function useCitiesList({ paginatedQuery, setPaginatedQuery, filter }: UseCitiesListProps) {
  return useCustomGridQuery<CityListItem, CityFilterForm>({
    asyncFunction: listCities,
    queryKey: queryKey.cities.list,
    paginatedQuery,
    setPaginatedQuery,
    filterQuery: [],
    filter: filter ?? ({} as CityFilterForm),
  });
}
