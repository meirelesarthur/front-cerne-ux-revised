// -----------------------------------------------------------------------------
// Hooks de conteúdo do arquivo de log (execução 079).
//
// `useSystemLogContent` — leitura em blocos do FIM para trás (tail). Cursor =
// `before` em BYTES (`range.start` do bloco anterior, já alinhado em início de
// linha pela API). `pages[0]` é sempre o bloco mais recente; páginas mais
// antigas entram depois no array (a tela as exibe em ordem cronológica).
//
// `useSystemLogSearch` — busca `q` no arquivo INTEIRO, feita pela API (da linha
// mais recente para a mais antiga); continua por `next_before`.
//
// Cache: `gcTime: 0` + `staleTime: Infinity` — o conteúdo é volátil e pode
// ter MB; não é retido depois que a tela sai, e não refaz a busca sozinho
// (refetch de infinite query repetiria TODAS as páginas e a abertura/busca
// é auditada pela API). "Atualizar" é `resetQueries` explícito na tela.
// -----------------------------------------------------------------------------

import { useInfiniteQuery } from '@tanstack/react-query';

import { queryKey } from '@/constants/query-key';

import {
  SYSTEM_LOG_SEARCH_MIN_CHARS,
  getSystemLogContent,
  searchSystemLog,
} from '@/services/v2/SystemLogs/system-logs-service';

import { retryTransientOnly } from './httpStatus';

export function systemLogContentKey(path: string) {
  return [queryKey.systemLogs.systemLog, 'content', path] as const;
}

// `initialBefore` ausente = fim do arquivo; presente = contexto de uma ocorrência da busca.
export function useSystemLogContent(path: string, initialBefore?: number) {
  return useInfiniteQuery({
    queryKey: [...systemLogContentKey(path), initialBefore ?? 'tail'],
    queryFn: ({ pageParam }) => getSystemLogContent(path, pageParam),
    initialPageParam: initialBefore as number | undefined,
    getNextPageParam: (lastPage) =>
      lastPage.has_more_before && lastPage.range.start > 0 ? lastPage.range.start : undefined,
    enabled: path !== '',
    staleTime: Infinity,
    gcTime: 0,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    retry: retryTransientOnly,
  });
}

export function useSystemLogSearch(path: string, q: string) {
  const term = q.trim();

  return useInfiniteQuery({
    queryKey: [queryKey.systemLogs.systemLog, 'search', path, term],
    queryFn: ({ pageParam }) => searchSystemLog(path, term, pageParam),
    initialPageParam: undefined as number | undefined,
    getNextPageParam: (lastPage) =>
      lastPage.result.has_more_before && lastPage.result.next_before != null
        ? lastPage.result.next_before
        : undefined,
    enabled: path !== '' && term.length >= SYSTEM_LOG_SEARCH_MIN_CHARS,
    staleTime: Infinity,
    gcTime: 0,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    retry: retryTransientOnly,
  });
}
