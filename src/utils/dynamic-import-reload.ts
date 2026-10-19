// src/utils/dynamic-import-reload.ts
// -----------------------------------------------------------------------------
// TASK-063-MAPA-06 (bug #3, F-036, 063-est03-9-reprovacoes) — recuperação de
// "Failed to fetch dynamically imported module". Um chunk `lazy(() =>
// import(...))` nunca antes carregado nesta sessão pode falhar em voo (causa
// raiz identificada em ReloadPromptSW.tsx — corrida com o auto-update do
// Service Worker, mitigada em TASK-063-MAPA-05; qualquer outra causa de rede
// intermitente cai no mesmo sintoma). Em vez de travar o usuário no
// `ErrorFallbackPage` genérico, este utilitário centraliza um reload
// automático de UMA única tentativa por janela de sessão, evitando loop se o
// erro persistir (ex.: deploy realmente quebrado).
//
// Consumido por dois pontos de captura independentes (defesa em profundidade,
// mirror da recomendação oficial do Vite — "Load error handling"):
//   1. `main.tsx` — listener global `window.addEventListener('vite:preloadError', ...)`,
//      disparado pelo helper de preload do Vite antes mesmo de qualquer
//      componente React tratar o erro.
//   2. `ErrorFallbackPage.tsx` — rede de segurança para quando o erro chega
//      como exceção React normal (lazy() lançando durante o render,
//      capturado pelo `ErrorBoundary` em `App.tsx`), sem depender do evento
//      `vite:preloadError` ter disparado.
// -----------------------------------------------------------------------------

const DYNAMIC_IMPORT_RELOAD_KEY = 'dynamic-import-reload-attempted';

// Cobre as variações de mensagem entre navegadores/versões do Vite para o
// mesmo sintoma de chunk dinâmico não resolvido.
const DYNAMIC_IMPORT_ERROR_PATTERN =
  /failed to fetch dynamically imported module|error loading dynamically imported module|importing a module script failed/i;

export function isDynamicImportError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error ?? '');
  return DYNAMIC_IMPORT_ERROR_PATTERN.test(message);
}

/**
 * Peek — não muda estado. Usado para decidir se ainda cabe 1 tentativa.
 * @return {boolean} `true` se um reload já foi tentado nesta janela de sessão.
 */
export function hasAttemptedDynamicImportReload(): boolean {
  try {
    return sessionStorage.getItem(DYNAMIC_IMPORT_RELOAD_KEY) === 'true';
  } catch {
    // sessionStorage indisponível (modo privado restrito, storage bloqueado)
    // — trata como "já tentado" para nunca entrar em loop de reload.
    return true;
  }
}

/** Marca a tentativa e recarrega a página. Chamar no MÁXIMO uma vez por erro. */
export function reloadForDynamicImportError(): void {
  try {
    sessionStorage.setItem(DYNAMIC_IMPORT_RELOAD_KEY, 'true');
  } catch {
    // Falha ao persistir a flag não deve impedir a tentativa de recuperação
    // — pior caso é um reload a mais, nunca um loop (próxima falha real cai
    // no fallback normal porque `hasAttemptedDynamicImportReload` já retorna
    // `true` acima quando o storage está indisponível).
  }
  window.location.reload();
}

/**
 * Libera uma nova tentativa futura de auto-reload. Chamado pelo `App` após
 * a árvore ficar estável por alguns segundos sem erro — evita que 1 falha
 * isolada esgote a recuperação automática para o resto da sessão do usuário.
 */
export function clearDynamicImportReloadFlag(): void {
  try {
    sessionStorage.removeItem(DYNAMIC_IMPORT_RELOAD_KEY);
  } catch {
    // Sem storage, não há flag para limpar.
  }
}
