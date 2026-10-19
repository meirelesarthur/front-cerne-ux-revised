// Status HTTP de um erro axios (ou `undefined`).
export function getHttpStatus(error: unknown): number | undefined {
  const status = (error as { response?: { status?: unknown } } | null)?.response?.status;
  return typeof status === 'number' ? status : undefined;
}

// Erros de negócio/autorização não se resolvem repetindo a chamada (e o
// rate limit da API é apertado): sem retry automático nesses casos.
const NO_RETRY_STATUS = new Set([401, 403, 404, 422, 429]);

export function retryTransientOnly(failureCount: number, error: unknown): boolean {
  const status = getHttpStatus(error);
  if (status !== undefined && NO_RETRY_STATUS.has(status)) return false;
  return failureCount < 1;
}
