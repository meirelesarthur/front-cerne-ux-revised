// src/pages/CadastrosBase/Especies/useSpecies.tsx
// -----------------------------------------------------------------------------
// Hooks de query do módulo de ESPÉCIES — mesmo padrão de
// CadastrosBase/CentroCusto/useCostCenters.tsx e CadastrosBase/Perfil/useRoles.tsx.
//
// TASK-ESP-01 cobriu só a LISTAGEM (useSpeciesList). TASK-ESP-02 adiciona
// `useSpecieForm` (detalhe/formulário) neste mesmo arquivo.
// -----------------------------------------------------------------------------

import type { Dispatch, SetStateAction } from 'react';

import { useCustomFormQueryByGuid } from '@/hooks/useCustomFormQueryByGuid';
import { useCustomGridQuery } from '@/hooks/useCustomGridQuery';

import { queryKey } from '@/constants/query-key';

import { getSpecieByUuid, listSpecies } from '@/services/v2/Species/species-service';

import type { PaginatedQueryProps } from '@/@types/pagination';
import type { SpecieData, SpeciesFilterForm, SpeciesListItem } from '@/@types/v2/Species/species';

interface UseSpeciesListProps {
  paginatedQuery: PaginatedQueryProps;
  setPaginatedQuery: Dispatch<SetStateAction<PaginatedQueryProps<any>>>;
  filter?: SpeciesFilterForm;
}

// Query de listagem de espécies (filtros `search`/`is_enabled` vão como query
// params — ver ListSpeciesParams). Usa `useCustomGridQuery` (família Grid
// padrão do projeto) mesmo o backend não paginando de verdade — o adaptador
// `listSpecies` já converte o envelope `meta:null` para o shape
// `ResponsePagination` que este hook espera (1 única página, array inteiro).
export function useSpeciesList({ paginatedQuery, setPaginatedQuery, filter }: UseSpeciesListProps) {
  return useCustomGridQuery<SpeciesListItem, SpeciesFilterForm>({
    asyncFunction: listSpecies,
    queryKey: queryKey.species.list,
    paginatedQuery,
    setPaginatedQuery,
    filterQuery: [],
    filter: filter ?? ({} as SpeciesFilterForm),
  });
}

interface UseSpecieFormProps {
  registrationId?: string;
  fillForm: (data: SpecieData, resetForce?: boolean) => void;
}

// TASK-ESP-02 — query de detalhe para preencher o formulário de edição (match
// por GUID), mesmo padrão de `useCostCenterForm`/`useRoleForm`.
export function useSpecieForm({ registrationId, fillForm }: UseSpecieFormProps) {
  return useCustomFormQueryByGuid<SpecieData>({
    registrationId,
    queryKey: queryKey.species.detail,
    asyncFunction: getSpecieByUuid,
    fillForm,
  });
}
