// src/pages/Fiscal/CashBook/useCashBooks.tsx
// -----------------------------------------------------------------------------
// Hook de query de listagem do módulo CashBook (LCDPR, execução 045,
// TASK-LCDPR-FE-02) — mirror `useContadoresList` (CadastrosBase/Contador/
// useContadores.tsx). Listagem é farm-scoped via `X-Farm-Id` (sem
// `registrationId` de contexto pai), ordenada `year desc` (server-side).
// -----------------------------------------------------------------------------

import type { Dispatch, SetStateAction } from 'react';

import { useCustomGridQuery } from '@/hooks/useCustomGridQuery';

import { queryKey } from '@/constants/query-key';

import { listCashBooks } from '@/services/v2/Fiscal/CashBook/cash-book-service';

import type { PaginatedQueryProps } from '@/@types/pagination';
import type { CashBookFilterForm, CashBookListItem } from '@/@types/v2/Fiscal/cashBook';

interface UseCashBooksListProps {
  paginatedQuery: PaginatedQueryProps;
  setPaginatedQuery: Dispatch<SetStateAction<PaginatedQueryProps<any>>>;
  filter?: CashBookFilterForm;
}

export function useCashBooksList({
  paginatedQuery,
  setPaginatedQuery,
  filter,
}: UseCashBooksListProps) {
  return useCustomGridQuery<CashBookListItem, CashBookFilterForm>({
    asyncFunction: listCashBooks,
    queryKey: queryKey.cashBooks.cashBooksList,
    paginatedQuery,
    setPaginatedQuery,
    filterQuery: [],
    filter: filter ?? ({} as CashBookFilterForm),
  });
}
