import { Dispatch, SetStateAction } from "react";

import { useQuery, UseQueryResult } from "@tanstack/react-query";

import filterQueryBuilder from "@/utils/filterQueryBuilder";
import { applyGridPaginationTotals } from '@/utils/gridPaginationClamp';
import { regex } from "@/utils/regex-id";

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
    registrationId: string,
    params: PaginationQueryParams,
  ) => Promise<ResponsePagination<TData[]>>;
  queryKey: string;
  registrationId: string;
  paginatedQuery: PaginatedQueryProps;
  setPaginatedQuery: Dispatch<SetStateAction<PaginatedQueryProps<any>>>;
  filterQuery: MultiFilterQuery;
  filter?: TFilter;
}

export function useCustomGridQueryById<
  TData,
  TFilter extends { [key: string]: any },
>({
  registrationId,
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
    enabled:
      !!registrationId &&
      registrationId.length === 36 &&
      registrationId?.replace(regex, "").length! === 0,
    // eslint-disable-next-line @tanstack/query/exhaustive-deps
    queryKey: [
      queryKey,
      registrationId,
      paginatedQuery.pageIndex,
      paginatedQuery.pageSize,
      paginatedQuery.orderBy,
      paginatedQuery.filter,
      paginatedQuery.groupBy,
    ],
    queryFn: async () => {
      if (!!registrationId && asyncFunctionById) {
        const data = await asyncFunctionById(registrationId, {
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
