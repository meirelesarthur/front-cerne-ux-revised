// Tipos do Visualizador de Logs (execução 079) — 1:1 com o contrato da API
// (`/api/v1/system-logs*`, PLANO-TECNICO-API-079 §3). O recurso é arquivo, não
// entidade: não existe `uuid`; o identificador é o `path` relativo a storage/logs.

export type SystemLogEntryType = 'dir' | 'file';
export type SystemLogSort = 'modified_at' | 'name' | 'size';
export type SystemLogDirection = 'asc' | 'desc';

export interface SystemLogBreadcrumb {
  name: string;
  path: string;
}

export interface SystemLogEntry {
  name: string;
  path: string;
  type: SystemLogEntryType;
  /** bytes; `null` para pasta */
  size: number | null;
  /** ISO 8601 com offset */
  modified_at: string;
}

export interface SystemLogDirectory {
  path: string;
  parent_path: string | null;
  breadcrumbs: SystemLogBreadcrumb[];
  items: SystemLogEntry[];
}

export interface SystemLogDirectoryMeta {
  sort: SystemLogSort;
  direction: SystemLogDirection;
  total: number;
  truncated: boolean;
}

export interface SystemLogDirectoryParams {
  path: string;
  sort: SystemLogSort;
  direction: SystemLogDirection;
}

export interface SystemLogDirectoryResult {
  data: SystemLogDirectory;
  meta: SystemLogDirectoryMeta;
}

export interface SystemLogRange {
  start: number;
  end: number;
}

/** Bloco de leitura (modo tail). `content` é UTF-8; o front divide por `\n`. */
export interface SystemLogChunk {
  path: string;
  name: string;
  size: number;
  modified_at: string;
  mode: 'tail';
  range: SystemLogRange;
  has_more_before: boolean;
  partial_line: boolean;
  content: string;
}

export interface SystemLogSearchMatch {
  start: number;
  end: number;
  line: string;
  line_truncated: boolean;
}

export interface SystemLogSearchResult {
  path: string;
  name: string;
  size: number;
  modified_at: string;
  mode: 'search';
  q: string;
  scanned: SystemLogRange;
  has_more_before: boolean;
  next_before: number | null;
  matches: SystemLogSearchMatch[];
}

export interface SystemLogSearchMeta {
  max_matches: number;
  returned: number;
  scan_budget_bytes: number;
}

export interface SystemLogApiEnvelope<TData, TMeta = unknown> {
  success: boolean;
  message: string;
  data: TData;
  errors: Record<string, string[]> | null;
  meta: TMeta;
}

export interface SystemLogDownloadResult {
  blob: Blob;
  filename: string;
}

export interface SystemLogDownloadProgress {
  loaded: number;
  /** `undefined` quando a resposta não traz Content-Length */
  total?: number;
}
