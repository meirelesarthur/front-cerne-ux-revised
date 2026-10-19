// src/pages/CadastrosBase/EstoqueInicial/useOpeningBalances.tsx
// -----------------------------------------------------------------------------
// Hook de query da LISTAGEM de ESTOQUE INICIAL (OpeningBalance) — mirror
// mecânico de `Armazem/useWarehouses.tsx` (CRUD flat, sem hierarquia,
// `useCustomGridQuery`). TASK-FE-1042 (execução 026).
//
// `filter` já chega ACHATADO (`ListOpeningBalancesParams`, sem os `*_label`
// companions do drawer) — o achatamento é responsabilidade de `index.tsx`
// (`toRequestFilter`), mesmo padrão de `Produtos/Catalogo/useProducts.tsx`.
// -----------------------------------------------------------------------------

import type { Dispatch, SetStateAction } from 'react';

import { useCustomGridQuery } from '@/hooks/useCustomGridQuery';

import { queryKey } from '@/constants/query-key';

import { listOpeningBalances } from '@/services/v2/OpeningBalances/opening-balance-service';
import type { ListOpeningBalancesParams } from '@/services/v2/OpeningBalances/opening-balance-service';

import type { PaginatedQueryProps } from '@/@types/pagination';
import type { OpeningBalanceListItem } from '@/@types/v2/OpeningBalances';

interface UseOpeningBalancesListProps {
  paginatedQuery: PaginatedQueryProps;
  setPaginatedQuery: Dispatch<SetStateAction<PaginatedQueryProps<any>>>;
  filter?: ListOpeningBalancesParams;
}

// Query de listagem paginada de Estoques Iniciais — filtros `search`/
// `product_uuid`/`warehouse_uuid` vão como query params reais (contrato de
// API §4). `per_page` default 10 (fiel ao legado — ver `listOpeningBalances`).
export function useOpeningBalancesList({
  paginatedQuery,
  setPaginatedQuery,
  filter,
}: UseOpeningBalancesListProps) {
  return useCustomGridQuery<OpeningBalanceListItem, ListOpeningBalancesParams>({
    asyncFunction: listOpeningBalances,
    queryKey: queryKey.openingBalances.openingBalancesList,
    paginatedQuery,
    setPaginatedQuery,
    filterQuery: [],
    filter: filter ?? ({} as ListOpeningBalancesParams),
  });
}
