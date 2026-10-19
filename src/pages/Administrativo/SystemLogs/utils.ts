// src/pages/Administrativo/SystemLogs/utils.ts
// Funções puras do Visualizador de Logs (execução 079) — sem React, testáveis.

import type { SystemLogBreadcrumb, SystemLogEntry } from '@/@types/v2/SystemLogs';

// Teto de leitura sem virtualização (DD-FE-079-01 A): 20.000 linhas ou 8 MiB.
export const MAX_LOADED_LINES = 20_000;
export const MAX_LOADED_BYTES = 8 * 1024 * 1024;
// Linha maior que isto é cortada NA TELA; o download continua íntegro.
export const MAX_LINE_CHARS = 10_000;

function normalize(value: string): string {
  return value.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}

// Filtro por nome: substring sem diferenciar maiúsculas nem acentos.
export function filterEntries(entries: SystemLogEntry[], term: string): SystemLogEntry[] {
  const needle = normalize(term.trim());
  if (!needle) return entries;
  return entries.filter((entry) => normalize(entry.name).includes(needle));
}

// Trilha a partir dos segmentos do path (a listagem usa a da API; o visualizador usa esta).
export function buildBreadcrumb(path: string, rootLabel: string): SystemLogBreadcrumb[] {
  const segments = path.split('/').filter(Boolean);
  const trail: SystemLogBreadcrumb[] = [{ name: rootLabel, path: '' }];
  segments.forEach((segment, index) => {
    trail.push({ name: segment, path: segments.slice(0, index + 1).join('/') });
  });
  return trail;
}

// Pasta que contém o arquivo ('' = raiz).
export function parentPathOf(path: string): string {
  const segments = path.split('/').filter(Boolean);
  return segments.slice(0, -1).join('/');
}

// Divide o conteúdo por `\n`, sem a linha vazia final de um bloco terminado em `\n`.
export function splitLines(content: string): string[] {
  if (content === '') return [];
  const lines = content.split('\n');
  if (lines[lines.length - 1] === '') lines.pop();
  return lines;
}

export interface PageText {
  text: string;
  lineCount: number;
}

// Texto de um bloco pronto para um único `<pre>`, cortando linhas gigantes.
export function buildPageText(
  content: string,
  truncatedSuffix: string,
  maxLineChars = MAX_LINE_CHARS
): PageText {
  const lines = splitLines(content).map((line) =>
    line.length > maxLineChars ? `${line.slice(0, maxLineChars)}${truncatedSuffix}` : line
  );
  return { text: lines.join('\n'), lineCount: lines.length };
}

export interface HighlightSegment {
  text: string;
  match: boolean;
}

// Quebra a linha em trechos para destacar `q` (literal, sem diferenciar maiúsculas).
export function highlightSegments(line: string, q: string): HighlightSegment[] {
  if (!q) return [{ text: line, match: false }];

  const haystack = line.toLowerCase();
  const needle = q.toLowerCase();
  // toLowerCase pode mudar o comprimento em casos raros (ex.: "İ"): sem destaque é melhor que desalinhado.
  if (haystack.length !== line.length) return [{ text: line, match: false }];

  const segments: HighlightSegment[] = [];
  let cursor = 0;
  let index = haystack.indexOf(needle, cursor);
  while (index !== -1) {
    if (index > cursor) segments.push({ text: line.slice(cursor, index), match: false });
    segments.push({ text: line.slice(index, index + needle.length), match: true });
    cursor = index + needle.length;
    index = haystack.indexOf(needle, cursor);
  }
  if (cursor < line.length) segments.push({ text: line.slice(cursor), match: false });
  return segments.length ? segments : [{ text: line, match: false }];
}

export function isLoadLimitReached(loadedBytes: number, loadedLines: number): boolean {
  return loadedBytes >= MAX_LOADED_BYTES || loadedLines >= MAX_LOADED_LINES;
}

// ---------------------------------------------------------------------------
// Rotas e locale
// ---------------------------------------------------------------------------

export const EXPLORER_ROUTE = '/administrativo/logs';
export const VIEWER_ROUTE = '/administrativo/logs/arquivo';

// Link do explorador numa pasta ('' = raiz). O path é sempre relativo a storage/logs.
export function explorerHref(path: string): string {
  return path ? `${EXPLORER_ROUTE}?path=${encodeURIComponent(path)}` : EXPLORER_ROUTE;
}

// Link do visualizador de um arquivo (opcionalmente já numa busca `q`).
export function viewerHref(path: string): string {
  return `${VIEWER_ROUTE}?path=${encodeURIComponent(path)}`;
}

// Código de idioma do app (`BR`/`US`/`ES`) → locale do `Intl`.
export function toIntlLocale(language: string | null | undefined): string {
  switch (language) {
    case 'US':
      return 'en-US';
    case 'ES':
      return 'es-ES';
    default:
      return 'pt-BR';
  }
}

// ---------------------------------------------------------------------------
// Contagem de linhas e preferência de quebra de linha
// ---------------------------------------------------------------------------

// Linhas de um bloco, sem alocar array (blocos chegam a 1 MiB).
export function countLines(content: string): number {
  if (content === '') return 0;
  let count = 0;
  for (let i = content.indexOf('\n'); i !== -1; i = content.indexOf('\n', i + 1)) count += 1;
  return content.endsWith('\n') ? count : count + 1;
}

const WRAP_STORAGE_KEY = 'systemLogsViewer.wrapLines';

// Preferência por viewer: localStorage pode lançar (janela privada, dados bloqueados).
export function readWrapPreference(): boolean {
  try {
    return window.localStorage.getItem(WRAP_STORAGE_KEY) === '1';
  } catch {
    return false;
  }
}

export function writeWrapPreference(wrap: boolean): void {
  try {
    window.localStorage.setItem(WRAP_STORAGE_KEY, wrap ? '1' : '0');
  } catch {
    // sem persistência: a tela segue funcionando
  }
}

// ---------------------------------------------------------------------------
// Classificação de erro da leitura (contrato API §3.2)
// ---------------------------------------------------------------------------

export type ContentErrorKind = 'forbidden' | 'not-found' | 'binary' | 'invalid-cursor' | 'generic';

// 403 sessão/papel; 404 arquivo removido (rotação); 422 com `errors.before`
// = cursor além do tamanho atual; 422 com `errors.path` "Arquivo binário";
// demais 422 = path inválido/diretório (tratado como não encontrado).
export function classifyContentError(error: unknown): ContentErrorKind {
  const response = (
    error as {
      response?: { status?: number; data?: { errors?: Record<string, string[]> | null } };
    } | null
  )?.response;
  const status = response?.status;

  if (status === 403) return 'forbidden';
  if (status === 404) return 'not-found';
  if (status === 422) {
    const errors = response?.data?.errors;
    if (errors?.before) return 'invalid-cursor';
    if (errors?.path?.some((message) => /bin[aá]rio/i.test(message))) return 'binary';
    return 'not-found';
  }
  return 'generic';
}
