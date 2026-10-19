// src/hooks/useOptionsChecklistQuery.ts
// -----------------------------------------------------------------------------
// Hook genérico de lookup com busca SERVER-SIDE para alimentar um
// `CheckboxListField` (mirror `useOperationsChecklist`, `useActivities.tsx`)
// — nasceu para as 4 telas de relatório de Contas (esteira 97-Esteiras/050,
// TASK-050-FE-00, campos Fornecedores/Categorias), mas é GENÉRICO (não
// específico de nenhum domínio) — qualquer `CheckboxListField` remoto futuro
// pode reaproveitar.
//
// `search` é debounced INTERNAMENTE (300ms) antes de entrar na `queryKey` —
// diferente do mirror `useOperationsChecklist` (que reconsulta a cada
// tecla, apoiado só em `keepPreviousData`), aqui o debounce evita 1
// requisição por tecla digitada. `queryKey` final inclui `search` +
// `extraParams` — sem isso o cache devolveria a lista da busca/filtro
// ERRADOS (TASK-050-FE-00, DoD).
// -----------------------------------------------------------------------------

import { useEffect, useState } from 'react';

import { keepPreviousData, useQuery } from '@tanstack/react-query';

import type { CheckboxListItem } from '@/components/Form/CheckboxListField';

import type { PaginationQueryParams } from '@/@types/pagination';
import type { ResponsePagination } from '@/@types/response-api';

const SEARCH_DEBOUNCE_MS = 300;
/** Teto de segurança do backend (mirror `useOperationsChecklist`) — maior lote permitido numa única chamada. */
const DEFAULT_PER_PAGE = 100;

export interface UseOptionsChecklistQueryParams<TItem, TValue extends string | number = string> {
  asyncFunction: (
    params: PaginationQueryParams & Record<string, unknown>
  ) => Promise<ResponsePagination<TItem[]>>;
  /** Prefixo estável da `queryKey` (ex.: `queryKey.cadastrosBase.providers`). */
  queryKey: string;
  /** Termo de busca CRU do consumidor (estado controlado do `CheckboxListField`) — o hook debounce internamente. */
  search: string;
  mapItem: (item: TItem) => CheckboxListItem<TValue>;
  /** Filtros extras fixos (ex.: `{ type_id: 1 }`) — entram na `queryKey` para não colidir com outro consumidor do mesmo `asyncFunction`. */
  extraParams?: Record<string, unknown>;
  enabled?: boolean;
  perPage?: number;
}

export interface UseOptionsChecklistQueryResult<TValue extends string | number = string> {
  items: CheckboxListItem<TValue>[];
  isLoading: boolean;
  isError: boolean;
  refetch: () => void;
}

export function useOptionsChecklistQuery<TItem, TValue extends string | number = string>({
  asyncFunction,
  queryKey,
  search,
  mapItem,
  extraParams,
  enabled = true,
  perPage = DEFAULT_PER_PAGE,
}: UseOptionsChecklistQueryParams<TItem, TValue>): UseOptionsChecklistQueryResult<TValue> {
  const [debouncedSearch, setDebouncedSearch] = useState(search);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [search]);

  const query = useQuery({
    queryKey: [queryKey, debouncedSearch, extraParams, perPage],
    queryFn: () =>
      asyncFunction({
        page: 1,
        per_page: perPage,
        search: debouncedSearch || undefined,
        ...extraParams,
      }),
    enabled,
    refetchOnWindowFocus: false,
    retry: false,
    // Mantém a lista anterior visível enquanto o debounce/nova busca resolve
    // — evita "flash" de lista vazia a cada tecla digitada.
    placeholderData: keepPreviousData,
  });

  const items = (query.data?.data.items ?? []).map(mapItem);

  return {
    items,
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: () => {
      void query.refetch();
    },
  };
}
