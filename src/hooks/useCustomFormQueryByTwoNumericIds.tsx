// useCustomFormQueryByTwoNumericIds.tsx
// Hook para carregar dados de formulário por DOIS IDs numéricos
// Baseado em useCustomFormQueryById, adaptado para cenários como teamId + roleId

import { useQuery, UseQueryResult } from "@tanstack/react-query";

import { Response } from "@/@types/response-api";

interface UseCustomFormQueryByTwoNumericIdsProps<TData = any> {
  asyncFunctionByTwoIds: (
    firstId: number,
    secondId: number,
  ) => Promise<Response<TData>>;
  queryKey: string;
  firstId: number | undefined;
  secondId: number | undefined;
  fillForm?: (data: TData) => void;
}

export function useCustomFormQueryByTwoNumericIds<TData>({
  firstId,
  secondId,
  asyncFunctionByTwoIds,
  queryKey,
  fillForm,
}: UseCustomFormQueryByTwoNumericIdsProps<TData>) {
  // Validação: Ambos os IDs numéricos devem ser válidos (maior que 0)
  const isValidFirstId = firstId !== undefined && !isNaN(firstId) && firstId > 0;
  const isValidSecondId = secondId !== undefined && !isNaN(secondId) && secondId > 0;
  const isValidIds = isValidFirstId && isValidSecondId;

  const customQuery = useQuery({
    networkMode: "offlineFirst",
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    enabled: isValidIds,
    queryKey: [queryKey, firstId, secondId],
    queryFn: async () => {
      if (isValidIds && asyncFunctionByTwoIds) {
        const response = await asyncFunctionByTwoIds(firstId!, secondId!);
        if (fillForm && response?.data) {
          fillForm(response.data);
        }
        return response;
      }
    },
    retry: false,
  });

  return customQuery as UseQueryResult<Response<TData>>;
}
