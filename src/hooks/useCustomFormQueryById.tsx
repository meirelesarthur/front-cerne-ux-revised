import { useEffect } from "react";

import { useQuery } from "@tanstack/react-query";
import { isError } from "lodash";

import { regex } from "@/utils/regex-id";

import { Response } from "@/@types/response-api";



interface UseCustomFormQueryProps<TData = any> {
  fillForm: (data: TData, resetForce?: boolean) => void;
  asyncFunction: (registrationId: string) => Promise<Response<TData>>;
  queryKey: string | string[];
  registrationId: string;
}

export function useCustomFormQueryById<TData>({
  registrationId,
  asyncFunction,
  fillForm,
  queryKey,
}: UseCustomFormQueryProps<TData>) {
  const customQuery = useQuery({
    networkMode: "offlineFirst",
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    enabled:
      !!registrationId &&
      registrationId.length === 36 &&
      registrationId?.replace(regex, "").length! === 0,
    queryKey: [queryKey, registrationId],
    queryFn: async () => {
      const data = await asyncFunction(registrationId!);
      return data.data;
    },
    retry: false,
  });

  useEffect(() => {
    // TASK-063-MAPA2-01: guard prescrito por get_pwa_form_query_pattern —
    // sem `!isRefetching` este efeito também dispara na TRANSIÇÃO de início
    // de um refetch em segundo plano (isRefetching false->true), quando
    // `customQuery.data` ainda é o dado anterior, forçando um reset
    // espúrio e apagando `dirtyFields` do usuário no meio da edição.
    if (customQuery.isSuccess && !customQuery.isRefetching && customQuery.data) {
      fillForm(customQuery.data, true);
    }
  }, [customQuery.isSuccess, customQuery.isRefetching]);

  const dataQuery =
    !!registrationId && registrationId.length === 36 ? customQuery : isError;

  return dataQuery as unknown as Response<TData>;
}
