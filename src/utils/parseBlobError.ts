// src/utils/parseBlobError.ts
// -----------------------------------------------------------------------------
// Helper COMPARTILHADO (molde para as irmãs F-116/117/118/120, Decisão F do
// contrato `ExportNfseDominio-contrato-tela.md`) para telas que baixam um
// binário via `responseType: 'blob'`.
//
// Com `responseType: 'blob'`, o axios entrega o corpo de QUALQUER resposta
// (sucesso OU erro) como `Blob` — inclusive um erro 422/401/403, cujo corpo
// real é o envelope `ApiResponse` em JSON. Sem este parse, o `catch` da tela
// recebe um `Blob` opaco e não consegue mostrar `message`/`errors` por
// campo. Uso: `const parsed = await parseBlobError(error);` dentro do
// `catch` de uma chamada `api.V2.get<Blob>(..., { responseType: 'blob' })`.
// -----------------------------------------------------------------------------

export interface ParsedApiError {
  status?: number;
  message?: string;
  errors?: Record<string, string[]> | null;
}

export async function parseBlobError(error: any): Promise<ParsedApiError> {
  const status = error?.response?.status;
  const data = error?.response?.data;

  if (data instanceof Blob) {
    try {
      const text = await data.text();
      const json = JSON.parse(text);
      return { status, message: json?.message, errors: json?.errors ?? null };
    } catch {
      return { status };
    }
  }

  return { status, message: data?.message, errors: data?.errors ?? null };
}
