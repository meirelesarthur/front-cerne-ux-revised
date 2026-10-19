// useCustomGridQueryByNumericId.tsx
// Hook para carregar dados de grid por ID numérico
// Baseado em useCustomGridQueryById, mas adaptado para IDs numéricos (não UUID)

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

interface UseCustomGridQueryByNumericIdProps<
  TData = any,
  TFilter extends { [key: string]: any } = any,
> {
  asyncFunctionById: (
    registrationId: number,
    params: PaginationQueryParams,
  ) => Promise<ResponsePagination<TData[]>>;
  queryKey: string;
  registrationId: number | undefined;
  paginatedQuery: PaginatedQueryProps;
  setPaginatedQuery: Dispatch<SetStateAction<PaginatedQueryProps<any>>>;
  filterQuery: MultiFilterQuery;
  filter?: TFilter;
}

export function useCustomGridQueryByNumericId<
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
}: UseCustomGridQueryByNumericIdProps<TData, TFilter>) {
  // Validação: ID numérico válido (maior que 0)
  const isValidId = registrationId !== undefined && !isNaN(registrationId) && registrationId > 0;

  const customQueryList = useQuery({
    networkMode: "offlineFirst",
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    enabled: isValidId,
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
      if (isValidId && asyncFunctionById) {
        const data = await asyncFunctionById(registrationId!, {
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
          applyGridPaginationTotals(prevState, data?.data?.pagination)
        );
        return data;
      }
      // Fallback: nunca retorna undefined (React Query proíbe) — devolve uma
      // resposta paginada vazia válida quando o guard de ID não é satisfeito.
      return {
        success: true,
        statusCode: 200,
        message: "",
        data: {
          items: [] as TData[],
          pagination: {
            total: 0,
            count: 0,
            per_page: paginatedQuery.pageSize,
            current_page: paginatedQuery.pageIndex,
            total_pages: 0,
          },
        },
      } as ResponsePagination<TData[]>;
    },
    retry: false,
  });

  return customQueryList as UseQueryResult<ResponsePagination<TData[]>>;
}
