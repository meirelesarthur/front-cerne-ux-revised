// useCustomFormQueryByNumericId.tsx
// Hook para carregar dados de formulário por ID numérico
// Baseado em useCustomFormQueryById, mas adaptado para IDs numéricos (não UUID)

import { useEffect } from "react";

import { useQuery } from "@tanstack/react-query";

import { Response } from "@/@types/response-api";
import { isError } from "lodash";

interface UseCustomFormQueryByNumericIdProps<TData = any> {
  fillForm: (data: TData, resetForce?: boolean) => void;
  asyncFunction: (registrationId: number) => Promise<Response<TData>>;
  queryKey: string | string[];
  registrationId: number | string | undefined;
}

export function useCustomFormQueryByNumericId<TData>({
  registrationId,
  asyncFunction,
  fillForm,
  queryKey,
}: UseCustomFormQueryByNumericIdProps<TData>) {
  // Converte para número se for string
  const numericId = registrationId ? Number(registrationId) : undefined;
  const isValidId = numericId !== undefined && !isNaN(numericId) && numericId > 0;

  const customQuery = useQuery({
    networkMode: "offlineFirst",
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    enabled: isValidId,
    queryKey: [queryKey, numericId],
    queryFn: async () => {
      if (!numericId) throw new Error("ID inválido");
      const data = await asyncFunction(numericId);
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

   const dataQuery = !!registrationId ? customQuery : isError;

  return dataQuery as unknown as Response<TData>;
}
