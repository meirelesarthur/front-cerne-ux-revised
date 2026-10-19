export const checkLoadingStatus = (
  queries: Array<{ isLoading?: boolean; isPending?: boolean }>
): boolean => {
  return queries.some((query) => query.isLoading || query.isPending);
};

// TASK-063-MAPA-02 — companion isError-aware helper (mirror
// `checkLoadingStatus`), para telas/diálogos que precisam distinguir
// "carregando" de "falhou" e mostrar erro+retry em vez de deixar o
// formulário em branco silencioso (`checkLoadingStatus` sozinho não cobre
// isso — `isLoading` cai para `false` em erro, mas nenhum dado chega).
// Helper ADITIVO — não altera a semântica de `checkLoadingStatus` em nenhum
// dos consumidores existentes.
export const checkErrorStatus = (queries: Array<{ isError?: boolean }>): boolean => {
  return queries.some((query) => query.isError);
};
