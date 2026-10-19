// src/hooks/useOptionsSelectQuery.ts
// -----------------------------------------------------------------------------
// Hook genérico de lookup SEM PAGINAÇÃO para alimentar um `Select` estático
// (irmão single-select de `useOptionsChecklistQuery`) — nasceu para as 4
// telas de relatório de Contas (esteira 97-Esteiras/050, TASK-050-FE-00,
// campos Proprietário/Fazenda), existe para não deixar nenhum `useQuery` cru
// dentro de componente de tela (anti-padrão explícito, Lei 3 —
// `get_pwa_new_module_execution_plan`, PASSO 4).
//
// `asyncFunction` devolve o universo INTEIRO (`listProprietaryOptions()`,
// `getMyFarms()`) — SEM `search`/paginação, mirror do shape que essas duas
// fachadas já expõem hoje (nenhuma é remodelada por esta tarefa).
// -----------------------------------------------------------------------------

import { useQuery } from '@tanstack/react-query';

import type { Option } from '@/@types/option';

export interface UseOptionsSelectQueryParams<TItem, TValue = string> {
  asyncFunction: () => Promise<TItem[]>;
  /** Prefixo estável da `queryKey` (ex.: `queryKey.farms.mine`). */
  queryKey: string;
  mapOption: (item: TItem) => Option<TValue>;
  enabled?: boolean;
}

export interface UseOptionsSelectQueryResult<TValue = string> {
  options: Option<TValue>[];
  isLoading: boolean;
  isError: boolean;
  refetch: () => void;
}

export function useOptionsSelectQuery<TItem, TValue = string>({
  asyncFunction,
  queryKey,
  mapOption,
  enabled = true,
}: UseOptionsSelectQueryParams<TItem, TValue>): UseOptionsSelectQueryResult<TValue> {
  const query = useQuery({
    queryKey: [queryKey],
    queryFn: asyncFunction,
    enabled,
    refetchOnWindowFocus: false,
    retry: false,
  });

  const options = (query.data ?? []).map(mapOption);

  return {
    options,
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: () => {
      void query.refetch();
    },
  };
}
