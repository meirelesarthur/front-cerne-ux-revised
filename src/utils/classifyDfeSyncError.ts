// src/utils/classifyDfeSyncError.ts
// -----------------------------------------------------------------------------
// UT-000752 (T-752-FE-02) — classifica a falha de `POST /dfes/sync` para a tela
// "Buscar DFe" decidir o feedback (função PURA, sem `@/utils/isEmpty`):
//   409                              → 'in-progress'  (DfeSyncInProgressException)
//   422 + "ambiente"                 → 'environment'  (IssuerAmbienteMissingException)
//   422 + "certificado"/401          → 'certificate'  (IssuerCertificateMissingException)
//   demais (SEFAZ xMotivo, 656, 5xx) → 'other'
// -----------------------------------------------------------------------------

import { extractApiErrorMessage } from '@/utils/extractApiErrorMessage';

export type DfeSyncErrorKind = 'in-progress' | 'environment' | 'certificate' | 'other';

export function classifyDfeSyncError(error: unknown): DfeSyncErrorKind {
  const status = (error as { response?: { status?: number } } | null)?.response?.status;

  if (status === 409) return 'in-progress';

  if (status === 422 || status === 401) {
    const message = (extractApiErrorMessage(error) ?? '').toLowerCase();
    if (message.includes('ambiente')) return 'environment';
    if (message.includes('certificado')) return 'certificate';
  }

  return 'other';
}
