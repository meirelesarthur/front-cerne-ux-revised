import { useEffect } from "react";

import { useQuery } from "@tanstack/react-query";

import { Response } from "@/@types/response-api";

interface UseCustomFormQueryProps<TData = any> {
  fillForm: (data: TData) => void;
  asyncFunction: () => Promise<Response<TData>>;
  queryKey: string | string[];
  enabled?: boolean;
}

export function useCustomFormQuery<TData>({
  asyncFunction,
  fillForm,
  queryKey,
  enabled,
}: UseCustomFormQueryProps<TData>) {
  const dataQuery = useQuery({
    queryKey: [queryKey],
    enabled: enabled,
    refetchOnWindowFocus: false,
    queryFn: async () => {
      const data = await asyncFunction();
      return data.data;
    },
    retry: false,
  });

  useEffect(() => {
    if (dataQuery.data) {
      fillForm(dataQuery.data);
    }
  }, [dataQuery.isSuccess, dataQuery.isRefetching]);

  return dataQuery as unknown as Response<TData>;
}
