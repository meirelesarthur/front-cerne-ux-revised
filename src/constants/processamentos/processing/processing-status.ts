// src/constants/processamentos/processing/processing-status.ts
// -----------------------------------------------------------------------------
// Enum espelho de `app/Enums/ProcessingStatus.php` (backend) — PENDING=1,
// FINISHED=2 (front-plan-proc.md §1.2).
//
// Enum + `*Color` CO-LOCADOS neste arquivo (mirror `batch-status.ts`,
// get_pwa_constants_and_mappers_pattern §4); a fábrica de opções
// (Map + getLabel/getOption/options) vive separada em
// `options/processing-status-options.ts`. Cor client-side — o servidor não
// expõe cor, só `status_label` (front-plan-proc.md §3.2).
// -----------------------------------------------------------------------------

export const processingStatus = {
  pending: 1,
  finished: 2,
} as const;

export type ProcessingStatus = (typeof processingStatus)[keyof typeof processingStatus];

// Badge de status na grid — estética, sem regra de negócio (mirror
// `ProcessingStatus::color()` do backend, duplicado como token de front).
export const processingStatusColor: Record<ProcessingStatus, string> = {
  1: 'gray',
  2: 'green',
};
