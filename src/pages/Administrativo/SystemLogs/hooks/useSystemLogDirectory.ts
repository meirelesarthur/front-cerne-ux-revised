// -----------------------------------------------------------------------------
// Hook de query da listagem de diretório de logs (execução 079).
//
// NÃO usa `useCustomGridQuery`: a listagem é o conteúdo de UM diretório, sem
// paginação (`page`/`per_page`/`meta` de paginação não existem neste endpoint;
// a API corta em 2000 entradas e sinaliza `meta.truncated`). A ordenação é da
// API (`sort`/`direction`, pastas sempre antes) e entra na queryKey; o filtro
// por nome é local (a API não tem filtro).
//
// `refetchOnWindowFocus: false` — logs mudam, mas refetch em foco atrapalha
// a leitura e consome o limite de taxa.
// -----------------------------------------------------------------------------

import { useQuery } from '@tanstack/react-query';

import { queryKey } from '@/constants/query-key';

import { listSystemLogDirectory } from '@/services/v2/SystemLogs/system-logs-service';

import type { SystemLogDirectoryParams } from '@/@types/v2/SystemLogs';

import { retryTransientOnly } from './httpStatus';

export function useSystemLogDirectory({ path, sort, direction }: SystemLogDirectoryParams) {
  return useQuery({
    queryKey: [queryKey.systemLogs.systemLogs, 'directory', path, sort, direction],
    queryFn: () => listSystemLogDirectory({ path, sort, direction }),
    staleTime: 0,
    refetchOnWindowFocus: false,
    retry: retryTransientOnly,
  });
}
