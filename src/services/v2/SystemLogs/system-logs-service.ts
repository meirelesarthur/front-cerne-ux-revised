// -----------------------------------------------------------------------------
// System Logs Service — Visualizador de Logs (execução 079).
//
// Contrato normativo: PLANO-TECNICO-API-079 §3 (API GB.Cerne.Api).
//   GET /system-logs            → lista o diretório (envelope; `meta.truncated`)
//   GET /system-logs/content    → bloco do arquivo (tail paginado por `before`
//                                 em bytes) OU busca no arquivo inteiro (`q`)
//   GET /system-logs/download   → binário cru (bytes originais), com
//                                 `Content-Disposition`
//
// Recurso de PLATAFORMA (fora de `farm.context`): o `X-Farm-Id` é ignorado pela
// API; o interceptor global continua enviando normalmente, sem ação aqui.
// Sem `uuid`: o identificador é `path` relativo a storage/logs — o front nunca
// monta `..` nem caminho absoluto (a validação é da API).
// -----------------------------------------------------------------------------

import { parseContentDispositionFilename } from '@/utils/parseContentDispositionFilename';

import api from '@/services/api';

import type {
  SystemLogApiEnvelope,
  SystemLogChunk,
  SystemLogDirectory,
  SystemLogDirectoryMeta,
  SystemLogDirectoryParams,
  SystemLogDirectoryResult,
  SystemLogDownloadProgress,
  SystemLogDownloadResult,
  SystemLogSearchMeta,
  SystemLogSearchResult,
} from '@/@types/v2/SystemLogs';

export const SYSTEM_LOG_SEARCH_MIN_CHARS = 2;
export const SYSTEM_LOG_SEARCH_MAX_MATCHES = 100;

async function listSystemLogDirectory(
  params: SystemLogDirectoryParams
): Promise<SystemLogDirectoryResult> {
  const { data } = await api.V2.get<
    SystemLogApiEnvelope<SystemLogDirectory, SystemLogDirectoryMeta>
  >('/system-logs', {
    // raiz = `path` ausente (a API aceita "" ou ausente)
    path: params.path || undefined,
    sort: params.sort,
    direction: params.direction,
  });
  return { data: data.data, meta: data.meta };
}

// `before` ausente = fim do arquivo (abertura/atualização).
async function getSystemLogContent(path: string, before?: number): Promise<SystemLogChunk> {
  const { data } = await api.V2.get<SystemLogApiEnvelope<SystemLogChunk>>('/system-logs/content', {
    path,
    before,
  });
  return data.data;
}

// Busca no arquivo INTEIRO (feita pela API), da linha mais recente para a mais antiga.
async function searchSystemLog(
  path: string,
  q: string,
  before?: number
): Promise<{ result: SystemLogSearchResult; meta: SystemLogSearchMeta }> {
  const { data } = await api.V2.get<
    SystemLogApiEnvelope<SystemLogSearchResult, SystemLogSearchMeta>
  >('/system-logs/content', { path, q, before, max_matches: SYSTEM_LOG_SEARCH_MAX_MATCHES });
  return { result: data.data, meta: data.meta };
}

// Download por blob (o cookie/Bearer vai junto, nos dois modos de auth).
// `timeout: 0` — o timeout padrão do axios (30 s) abortaria arquivos grandes.
// Nome: `Content-Disposition`; fallback = basename do `path`.
async function downloadSystemLog(
  path: string,
  onProgress?: (progress: SystemLogDownloadProgress) => void,
  signal?: AbortSignal
): Promise<SystemLogDownloadResult> {
  const response = await api.V2.get<Blob>(
    '/system-logs/download',
    { path },
    {
      responseType: 'blob',
      timeout: 0,
      signal,
      onDownloadProgress: (event) => {
        onProgress?.({ loaded: event.loaded, total: event.total });
      },
    }
  );

  const header = response.headers?.['content-disposition'] as string | undefined;
  return { blob: response.data, filename: parseContentDispositionFilename(header, path) };
}

export { downloadSystemLog, getSystemLogContent, listSystemLogDirectory, searchSystemLog };
