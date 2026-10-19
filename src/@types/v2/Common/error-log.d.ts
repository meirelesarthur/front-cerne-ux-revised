export interface ErrorLogLanguage {
  title: string;
  emptyState: string;
  clearAll: string;
  clearAllTooltip: string;
  requestDetails: string;
  responseDetails: string;
  method: string;
  url: string;
  status: string;
  payload: string;
  responseBody: string;
  headers: string;
  timestamp: string;
  errorMessage: string;
  networkError: string;
  unknownError: string;
  copiedToClipboard: string;
  copyFailed: string;
  copyDetails: string;
  collapseAll: string;
  expandAll: string;
  markAllViewed: string;
  markAllViewedTooltip: string;
  deleteItem: string;
  expandPanel: string;
  collapsePanel: string;
  unreadCount: string;
  totalErrors: string;
  createJiraTicket: string;
  /** Fallback genérico de retry para `GridQueryState` (esteira 003, Onda 5) —
   *  usado quando a tela não passa `retryLabel` próprio (ex. sem chave de
   *  módulo `list.error.retry`). Prop explícita sempre vence este fallback. */
  defaultRetryLabel: string;
  byStatus: {
    forbidden: string;
    forbiddenList: string;
    /** TASK-072-FE-10 — 403 com `code: FARM_CONTEXT_REQUIRED` (sem fazenda ativa). */
    forbiddenFarmContext: string;
    notFound: string;
    conflict: string;
    server: string;
  };
}
