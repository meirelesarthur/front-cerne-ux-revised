// src/utils/parseContentDispositionFilename.ts
// Extrai o nome do arquivo de um header `Content-Disposition`.
// Prioridade: `filename*=UTF-8''...` (RFC 5987) > `filename="..."` > `filename=...`.
// Sem header (ou sem nome legível), devolve o basename de `fallbackPath`; nunca
// um nome genérico como "download".

function basename(path: string): string {
  const parts = path.split('/').filter(Boolean);
  return parts[parts.length - 1] ?? path;
}

function safeDecode(value: string): string | null {
  try {
    return decodeURIComponent(value);
  } catch {
    return null;
  }
}

export function parseContentDispositionFilename(
  header: string | null | undefined,
  fallbackPath: string
): string {
  const fallback = basename(fallbackPath);
  if (!header) return fallback;

  const extended = /filename\*\s*=\s*([^']*)'[^']*'([^;]+)/i.exec(header);
  if (extended) {
    const decoded = safeDecode(extended[2].trim().replace(/^"|"$/g, ''));
    if (decoded) return decoded;
  }

  const quoted = /filename\s*=\s*"((?:[^"\\]|\\.)*)"/i.exec(header);
  if (quoted) {
    const value = quoted[1].replace(/\\(.)/g, '$1').trim();
    if (value) return value;
  }

  const bare = /filename\s*=\s*([^;]+)/i.exec(header);
  if (bare) {
    const value = bare[1].trim();
    if (value) return value;
  }

  return fallback;
}
