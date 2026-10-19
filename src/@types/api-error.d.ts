export interface ApiErrorData {
  success: false;
  warnings: string[];
  // A API retorna `errors` como objeto por campo (`{ campo: [mensagens] }`).
  // O array é mantido por compatibilidade com respostas legadas.
  errors: Record<string, string[]> | string[] | null;
  statusCode: number;
  message: string;
}
