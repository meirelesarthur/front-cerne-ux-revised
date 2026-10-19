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

interface UseCustomGridQueryByIdProps<
  TData = any,
  TFilter extends { [key: string]: any } = any,
> {
  asyncFunctionById: (
    idsRegistration: string[],
    params: PaginationQueryParams,
  ) => Promise<ResponsePagination<TData[]>>;
  queryKey: string;
  idsRegistration: string[];
  paginatedQuery: PaginatedQueryProps;
  setPaginatedQuery: Dispatch<SetStateAction<PaginatedQueryProps<any>>>;
  filterQuery: MultiFilterQuery;
  filter?: TFilter;
}

export function useCustomGridQueryByIds<
  TData,
  TFilter extends { [key: string]: any },
>({
  idsRegistration: idsRegistration,
  asyncFunctionById,
  queryKey,
  setPaginatedQuery,
  paginatedQuery,
  filterQuery,
  filter,
}: UseCustomGridQueryByIdProps<TData, TFilter>) {
  const customQueryList = useQuery({
    networkMode: "offlineFirst",
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    enabled: !!idsRegistration && idsRegistration.length >= 1,
    // eslint-disable-next-line @tanstack/query/exhaustive-deps
    queryKey: [
      queryKey,
      idsRegistration,
      paginatedQuery.pageIndex,
      paginatedQuery.pageSize,
      paginatedQuery.orderBy,
      paginatedQuery.filter,
      paginatedQuery.groupBy,
    ],
    queryFn: async () => {
      if (!!idsRegistration && asyncFunctionById) {
        const data = await asyncFunctionById(idsRegistration, {
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
