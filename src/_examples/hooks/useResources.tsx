// src/_examples/hooks/useResources.tsx
// -----------------------------------------------------------------------------
// CAMADA DE EXEMPLO — hooks de query (referência de padrão de módulo).
//
// Um hook de LISTAGEM sobre `useCustomGridQuery` e um hook de DETALHE/FORM sobre
// `useCustomFormQueryByGuid` (padrão GUID — o padrão novo da empresa), ambos
// plugados no `queryKey._example` e no service da própria camada de exemplo.
// -----------------------------------------------------------------------------

import type { Dispatch, SetStateAction } from 'react';

import { getResourceById, getResources } from '@/_examples/services/resource-service';

import { useCustomFormQueryByGuid } from '@/hooks/useCustomFormQueryByGuid';
import { useCustomGridQuery } from '@/hooks/useCustomGridQuery';

import { queryKey } from '@/constants/query-key';

import type { PaginatedQueryProps } from '@/@types/pagination';

import type { ResourceData, ResourceFilterForm, ResourceForm } from '@/_examples/types/resource';

interface UseResourcesListProps {
  paginatedQuery: PaginatedQueryProps;
  setPaginatedQuery: Dispatch<SetStateAction<PaginatedQueryProps<any>>>;
}

// Query de listagem paginada de recursos.
export function useResourcesList({ paginatedQuery, setPaginatedQuery }: UseResourcesListProps) {
  // Filtro do drawer vive em `paginatedQuery.filter` (padrão do Rank → Agents):
  // aqui ele é "achatado" para os query params que a API espera
  // (Option<T> → .value; boolean → 0|1), espelhando `ResourceFilterRequest`.
  const filter = paginatedQuery.filter as ResourceFilterForm | undefined;

  return useCustomGridQuery<ResourceData, any>({
    asyncFunction: getResources,
    queryKey: queryKey._example.list,
    paginatedQuery,
    setPaginatedQuery,
    filterQuery: [],
    filter: {
      name: filter?.name ?? '',
      status: filter?.status?.value ?? '',
      include_deleted: filter?.includeDeleted ? 1 : 0,
    },
  });
}

interface UseResourceFormProps {
  registrationId?: string;
  fillForm: (data: ResourceData, resetForce?: boolean) => void;
}

// Query de detalhe para preencher o formulário de edição.
export function useResourceForm({ registrationId, fillForm }: UseResourceFormProps) {
  return useCustomFormQueryByGuid<ResourceData>({
    registrationId,
    queryKey: queryKey._example.detail,
    asyncFunction: getResourceById,
    fillForm,
  });
}

export type { ResourceForm };
