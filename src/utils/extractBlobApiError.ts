// src/utils/extractBlobApiError.ts
// Com `responseType: 'blob'`, o corpo de um erro HTTP (403/404/422/500) chega
// como Blob. Converte de volta para a mensagem do envelope ApiResponse
// (`message`, ou o primeiro erro de campo). Devolve `undefined` quando o corpo
// não é um JSON legível — o chamador cai na mensagem padrão.

interface ErrorEnvelope {
  message?: unknown;
  errors?: Record<string, unknown> | null;
}

function firstFieldError(errors: ErrorEnvelope['errors']): string | undefined {
  if (!errors || typeof errors !== 'object') return undefined;
  for (const value of Object.values(errors)) {
    if (Array.isArray(value) && typeof value[0] === 'string') return value[0];
    if (typeof value === 'string') return value;
  }
  return undefined;
}

export async function extractBlobApiError(error: unknown): Promise<string | undefined> {
  const data = (error as { response?: { data?: unknown } } | null)?.response?.data;
  if (!(data instanceof Blob)) return undefined;

  try {
    const parsed = JSON.parse(await data.text()) as ErrorEnvelope;
    const field = firstFieldError(parsed.errors);
    if (field) return field;
    if (typeof parsed.message === 'string' && parsed.message.trim()) return parsed.message;
  } catch {
    // corpo não-JSON: sem mensagem utilizável
  }
  return undefined;
}
