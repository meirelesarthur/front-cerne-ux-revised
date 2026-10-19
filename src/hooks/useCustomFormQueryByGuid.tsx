// useCustomFormQueryByGuid.tsx
// Variante GUID — padrão da empresa para projetos novos. Ver
// useCustomFormQueryByNumericId para a variante legada (Numeric ID) usada
// neste projeto especificamente.
//
// Mesma estrutura do ByNumericId, mas o ID é uma string (GUID/UUID) e a
// validação usa a regex de UUID (isValidGuid) em vez de `numericId > 0`.

import { useEffect } from "react";

import { useQuery } from "@tanstack/react-query";

import { Response } from "@/@types/response-api";
import { isValidGuid } from "@/utils/guid";
import { isError } from "lodash";

interface UseCustomFormQueryByGuidProps<TData = any> {
  fillForm: (data: TData, resetForce?: boolean) => void;
  asyncFunction: (registrationId: string) => Promise<Response<TData>>;
  queryKey: string | string[];
  registrationId: string | undefined;
}

export function useCustomFormQueryByGuid<TData>({
  registrationId,
  asyncFunction,
  fillForm,
  queryKey,
}: UseCustomFormQueryByGuidProps<TData>) {
  const isValidId = isValidGuid(registrationId);

  const customQuery = useQuery({
    networkMode: "offlineFirst",
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    enabled: isValidId,
    queryKey: [queryKey, registrationId],
    queryFn: async () => {
      if (!registrationId) throw new Error("ID inválido");
      const data = await asyncFunction(registrationId);
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

  const dataQuery = isValidId ? customQuery : isError;

  return dataQuery as unknown as Response<TData>;
}
