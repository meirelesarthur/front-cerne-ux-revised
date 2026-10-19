// src/pages/Operacional/Evolutions/useEvolutions.tsx
// -----------------------------------------------------------------------------
// Hook de query do módulo de EVOLUÇÃO/REBANHO (Evolution) — mirror
// `Operacional/Separations/useSeparations.tsx::useSeparationsList`.
//
// `useCustomGridQuery` sem ID de contexto pai — mesma listagem 100%
// somente-leitura, sem detalhe/formulário associado.
// -----------------------------------------------------------------------------

import type { Dispatch, SetStateAction } from 'react';

import { useCustomGridQuery } from '@/hooks/useCustomGridQuery';

import { queryKey } from '@/constants/query-key';

import { listEvolutions } from '@/services/v2/Evolutions/evolution-service';

import type { PaginatedQueryProps } from '@/@types/pagination';
import type { EvolutionFilterRequest, EvolutionListItem } from '@/@types/v2/Evolutions';

interface UseEvolutionsListProps {
  paginatedQuery: PaginatedQueryProps;
  setPaginatedQuery: Dispatch<SetStateAction<PaginatedQueryProps<any>>>;
  filter?: EvolutionFilterRequest;
}

export function useEvolutionsList({
  paginatedQuery,
  setPaginatedQuery,
  filter,
}: UseEvolutionsListProps) {
  return useCustomGridQuery<EvolutionListItem, EvolutionFilterRequest>({
    asyncFunction: listEvolutions,
    queryKey: queryKey.evolutions.evolutionsList,
    paginatedQuery,
    setPaginatedQuery,
    filterQuery: [],
    filter: filter ?? ({} as EvolutionFilterRequest),
  });
}
