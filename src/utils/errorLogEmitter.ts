export interface ErrorLogPayload {
  method: string;
  url: string;
  statusCode: number | null;
  errorMessage: string;
  requestHeaders: Record<string, string>;
  requestPayload: unknown | null;
  responseBody: unknown | null;
}

type ErrorLogHandler = (entry: ErrorLogPayload) => void;

let _handler: ErrorLogHandler | null = null;

export function registerErrorLogHandler(handler: ErrorLogHandler) {
  _handler = handler;
}

export function unregisterErrorLogHandler() {
  _handler = null;
}

export function emitErrorLog(entry: ErrorLogPayload) {
  _handler?.(entry);
}
