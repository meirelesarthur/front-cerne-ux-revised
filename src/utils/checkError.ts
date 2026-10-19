// src/utils/checkError.ts
// -----------------------------------------------------------------------------
// Mensagem de erro para toast pontual de leitura (usado por `useQueryError`).
// Espelha o padrão já usado em `SelectAsyncPaginate` (tratamento de
// `error.response.status === 403` com `strings.status`): 403 sempre vira a
// mensagem de permissão (independente do corpo da resposta); demais status
// preferem a mensagem da API e caem para o texto genérico de carregamento
// quando ela não vier.
// -----------------------------------------------------------------------------

import strings from '@/utils/strings';

export function checkError(status?: number, message?: string): string {
  if (status === 403) return strings.status.forbidden;
  return message || strings.status.loadingError;
}
