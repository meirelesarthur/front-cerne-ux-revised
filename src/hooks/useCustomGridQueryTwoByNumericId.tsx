// useCustomGridQueryTwoByNumericId.tsx
// Hook para carregar dados de grid por DOIS IDs numéricos
// Baseado em useCustomGridQueryByNumericId, adaptado para cenários como teamId + roleId

import { Dispatch, SetStateAction } from "react";

import { useQuery, UseQueryResult } from "@tanstack/react-query";

import filterQueryBuilder from "@/utils/filterQueryBuilder";
import { applyGridPaginationTotals } from '@/utils/gridPaginationClamp';

import { MultiFilterQuery } from "@/@types/filter-query-builder";
import {
  PaginatedQueryProps,
  PaginationQueryParams,
} from "@/@types/pagination";
import { ResponsePagination } from "@/@types/response-api";

interface UseCustomGridQueryTwoByNumericIdProps<
  TData = any,
  TFilter extends { [key: string]: any } = any,
> {
  asyncFunctionByTwoIds: (
    firstId: number,
    secondId: number,
    params: PaginationQueryParams,
  ) => Promise<ResponsePagination<TData[]>>;
  queryKey: string;
  firstId: number | undefined;
  secondId: number | undefined;
  paginatedQuery: PaginatedQueryProps;
  setPaginatedQuery: Dispatch<SetStateAction<PaginatedQueryProps<any>>>;
  filterQuery: MultiFilterQuery;
  filter?: TFilter;
}

export function useCustomGridQueryTwoByNumericId<
  TData,
  TFilter extends { [key: string]: any },
>({
  firstId,
  secondId,
  asyncFunctionByTwoIds,
  queryKey,
  setPaginatedQuery,
  paginatedQuery,
  filterQuery,
  filter,
}: UseCustomGridQueryTwoByNumericIdProps<TData, TFilter>) {
  // Validação: Ambos os IDs numéricos devem ser válidos (maior que 0)
  const isValidFirstId = firstId !== undefined && !isNaN(firstId) && firstId > 0;
  const isValidSecondId = secondId !== undefined && !isNaN(secondId) && secondId > 0;
  const isValidIds = isValidFirstId && isValidSecondId;

  const customQueryList = useQuery({
    networkMode: "offlineFirst",
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    enabled: isValidIds,
    // eslint-disable-next-line @tanstack/query/exhaustive-deps
    queryKey: [
      queryKey,
      firstId,
      secondId,
      paginatedQuery.pageIndex,
      paginatedQuery.pageSize,
      paginatedQuery.orderBy,
      paginatedQuery.filter,
      paginatedQuery.groupBy,
    ],
    queryFn: async () => {
      if (isValidIds && asyncFunctionByTwoIds) {
        const data = await asyncFunctionByTwoIds(firstId!, secondId!, {
          page: paginatedQuery.pageIndex,
          per_page: paginatedQuery.pageSize,
          orderBy: paginatedQuery.orderBy,
          groupBy: paginatedQuery.groupBy,
          filter: filterQueryBuilder([...filterQuery]),
          ...(filter !== null && filter !== undefined
            ? Object.keys(filter as { [key: string]: any }).reduce(
                (acc, key) => {
                  if (
                    filter[key] !== null &&
                    filter[key] !== undefined &&
                    filter[key] !== ""
                  ) {
                    (acc as { [key: string]: any })[key] = filter[key];
                  }
                  return acc;
                },
                {} as TFilter,
              )
            : {}),
        });
        setPaginatedQuery((prevState: any) =>
          applyGridPaginationTotals(prevState, data.data.pagination)
        );
        return data;
      }
    },
    retry: false,
  });

  return customQueryList as UseQueryResult<ResponsePagination<TData[]>>;
}
