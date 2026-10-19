import { MultiFilterQuery } from "@/@types/filter-query-builder";
import {
  PaginatedQueryProps,
  PaginationQueryParams,
} from "@/@types/pagination";
import { ResponsePagination } from "@/@types/response-api";
import filterQueryBuilder from "@/utils/filterQueryBuilder";
import { applyGridPaginationTotals } from '@/utils/gridPaginationClamp';
import { useQuery, UseQueryResult } from "@tanstack/react-query";
import { Dispatch, SetStateAction } from "react";

interface UseCustomGridQueryProps<
  TData = any,
  TFilter extends { [key: string]: any } = any,
> {
  asyncFunction: (
    params: PaginationQueryParams,
  ) => Promise<ResponsePagination<TData[]>>;
  queryKey: string;
  paginatedQuery: PaginatedQueryProps;
  setPaginatedQuery: Dispatch<SetStateAction<PaginatedQueryProps<any>>>;
  filterQuery?: MultiFilterQuery;
  filter?: TFilter;
  enabled?: boolean;
}

export function useCustomGridQuery<
  TData,
  TFilter extends { [key: string]: any },
>({
  asyncFunction,
  queryKey,
  setPaginatedQuery,
  paginatedQuery,
  filterQuery = [],
  filter,
  enabled = true,
}: UseCustomGridQueryProps<TData, TFilter>) {
  const customQueryList = useQuery({
    networkMode: "online",
    staleTime: 0, // Dados ficam obsoletos imediatamente
    gcTime: 5 * 60 * 1000, // Cache persiste por 5 minutos (anteriormente cacheTime)
    refetchOnWindowFocus: true, // Revalida ao focar na janela
    refetchOnReconnect: true, // Revalida ao reconectar
    enabled,
    queryKey: [
      queryKey,
      paginatedQuery.pageIndex,
      paginatedQuery.pageSize,
      paginatedQuery.orderBy,
      paginatedQuery.filter,
      paginatedQuery.groupBy,
    ],
    queryFn: async () => {
      const data = await asyncFunction({
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
    },
    retry: false,
  });

  return customQueryList as UseQueryResult<ResponsePagination<TData[]>>;
}
