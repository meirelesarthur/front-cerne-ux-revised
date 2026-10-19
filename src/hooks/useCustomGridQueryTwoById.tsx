import { useQuery } from "@tanstack/react-query";

import filterQueryBuilder from "@/utils/filterQueryBuilder";
import { regex } from "@/utils/regex-id";

import { MultiFilterQuery } from "@/@types/filter-query-builder";
import {
    PaginatedQueryProps,
    PaginationQueryParams,
} from "@/@types/pagination";
import { ResponsePagination } from "@/@types/response-api";

interface UseCustomGridQueryTwoByIdProps<TData = any, TFilter = any> {
  asyncFunctionTwoById: (
    registrationId: string,
    twoRegistrationId: string,
    params: PaginationQueryParams,
  ) => Promise<ResponsePagination<TData[]>>;
  queryKey: string;
  registrationId: string;
  twoRegistrationId: string;
  paginatedQuery: PaginatedQueryProps;
  setPaginatedQuery: (data: PaginatedQueryProps) => void;
  filterQuery: MultiFilterQuery;
  filter?: TFilter;
}

export function useCustomGridQueryTwoById<TData, TFilter>({
  registrationId,
  twoRegistrationId,
  asyncFunctionTwoById,
  queryKey,
  setPaginatedQuery,
  paginatedQuery,
  filterQuery,
  filter,
}: UseCustomGridQueryTwoByIdProps<TData, TFilter>) {
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
      twoRegistrationId,
      // paginatedQuery.pageIndex,
      // paginatedQuery.pageSize,
      // paginatedQuery.orderBy,
      paginatedQuery.filter,
      paginatedQuery.groupBy,
    ],
    queryFn: async () => {
      if (!!registrationId && asyncFunctionTwoById) {
        const data = await asyncFunctionTwoById(
          registrationId,
          twoRegistrationId,
          {
            // pageIndex: paginatedQuery.pageIndex,
            // pageSize: paginatedQuery.pageSize,
            // orderBy: paginatedQuery.orderBy,
            groupBy: paginatedQuery.groupBy,
            filter: filterQueryBuilder([...filterQuery]),
            ...filter,
          },
        );
        setPaginatedQuery({
          ...paginatedQuery,
          pagesCount: data.data.pagination.total_pages,
          totalRecords: data.data.pagination.total,
        });
        return data;
      }
    },
    retry: false,
  });

  return customQueryList;
}
