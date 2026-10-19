// src/pages/Operacional/Marcacao/useMarkings.tsx
// -----------------------------------------------------------------------------
// Hook de listagem do módulo de MARCAÇÃO (Marking) — mesmo padrão de
// `Operacional/Weaning/useWeanings.tsx`:
//   - useMarkingsList → useCustomGridQuery (listagem paginada real de
//     servidor + 9 filtros, TASK-MC-FE-03).
//
// Sem Zustand — fazenda ativa já vem do AuthContext via interceptor;
// paginação/filtro por `userPaginatedQuery`.
// -----------------------------------------------------------------------------

import type { Dispatch, SetStateAction } from 'react';

import { useCustomGridQuery } from '@/hooks/useCustomGridQuery';

import { queryKey } from '@/constants/query-key';

import { listMarkings } from '@/services/v2/Marcacao/marking-service';

import type { PaginatedQueryProps } from '@/@types/pagination';
import type { MarkingData, MarkingFilterRequest } from '@/@types/v2/Marcacao/marking';

interface UseMarkingsListProps {
  paginatedQuery: PaginatedQueryProps;
  setPaginatedQuery: Dispatch<SetStateAction<PaginatedQueryProps<any>>>;
  filter?: MarkingFilterRequest;
}

export function useMarkingsList({
  paginatedQuery,
  setPaginatedQuery,
  filter,
}: UseMarkingsListProps) {
  return useCustomGridQuery<MarkingData, MarkingFilterRequest>({
    asyncFunction: listMarkings,
    queryKey: queryKey.marcacao.markings,
    paginatedQuery,
    setPaginatedQuery,
    filterQuery: [],
    filter: filter ?? ({} as MarkingFilterRequest),
  });
}
