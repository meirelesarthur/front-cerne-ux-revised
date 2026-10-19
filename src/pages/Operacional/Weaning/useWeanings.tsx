// src/pages/Operacional/Weaning/useWeanings.tsx
// -----------------------------------------------------------------------------
// Hook de listagem do módulo de DESMAMA (Weaning) — mesmo padrão de
// `Operacional/Nascimentos/useBirthAnimals.tsx`:
//   - useWeaningsList → useCustomGridQuery (listagem paginada real de
//     servidor + filtro por responsável, TASK-WN-FE-03).
//
// Sem Zustand — fazenda ativa já vem do AuthContext via interceptor;
// paginação/filtro por `userPaginatedQuery`.
// -----------------------------------------------------------------------------

import type { Dispatch, SetStateAction } from 'react';

import { useCustomGridQuery } from '@/hooks/useCustomGridQuery';

import { queryKey } from '@/constants/query-key';

import { listWeanings } from '@/services/v2/Weaning/weaning-service';

import type { PaginatedQueryProps } from '@/@types/pagination';
import type { WeaningData, WeaningFilterRequest } from '@/@types/v2/Weaning';

interface UseWeaningsListProps {
  paginatedQuery: PaginatedQueryProps;
  setPaginatedQuery: Dispatch<SetStateAction<PaginatedQueryProps<any>>>;
  filter?: WeaningFilterRequest;
}

export function useWeaningsList({
  paginatedQuery,
  setPaginatedQuery,
  filter,
}: UseWeaningsListProps) {
  return useCustomGridQuery<WeaningData, WeaningFilterRequest>({
    asyncFunction: listWeanings,
    queryKey: queryKey.weaning.weanings,
    paginatedQuery,
    setPaginatedQuery,
    filterQuery: [],
    filter: filter ?? ({} as WeaningFilterRequest),
  });
}
