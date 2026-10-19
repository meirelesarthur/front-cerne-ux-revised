// src/pages/Fiscal/Mdfe/useMdfes.tsx
// -----------------------------------------------------------------------------
// Hook fino de listagem de MDFe (domínio Fiscal-Transporte) — mirror
// `NfeEmitidas/useNfes.tsx::useNfesList`. TASK-MDFE-FE-02.
// -----------------------------------------------------------------------------

import type { Dispatch, SetStateAction } from 'react';

import { useCustomGridQuery } from '@/hooks/useCustomGridQuery';

import { queryKey } from '@/constants/query-key';

import { listMdfes } from '@/services/v2/Fiscal/mdfe-service';

import type { PaginatedQueryProps } from '@/@types/pagination';
import type { MdfeFilterForm, MdfeListItem } from '@/@types/v2/Fiscal/Mdfe';

interface UseMdfesListProps {
  paginatedQuery: PaginatedQueryProps;
  setPaginatedQuery: Dispatch<SetStateAction<PaginatedQueryProps<any>>>;
  filter?: MdfeFilterForm;
  enabled?: boolean;
}

export function useMdfesList({
  paginatedQuery,
  setPaginatedQuery,
  filter,
  enabled = true,
}: UseMdfesListProps) {
  return useCustomGridQuery<MdfeListItem, MdfeFilterForm>({
    asyncFunction: listMdfes,
    queryKey: queryKey.mdfes.mdfesList,
    paginatedQuery,
    setPaginatedQuery,
    filterQuery: [],
    filter: filter ?? ({} as MdfeFilterForm),
    enabled,
  });
}
