// src/constants/cadastrosBase/Batches/options/batch-status-options.ts
// -----------------------------------------------------------------------------
// Fábrica de opções do enum `BatchStatus` (A/P/I/R) — padrão canônico
// `(languageGB) => Map` + `getLabel`/`getOption`/`options`, mirror
// `reproductive-status-options.ts`/`account-status.ts` (options).
// Labels vêm de `languageGB.batches.batch.statusOptions` (TASK-FE-1074) —
// consumido pelo badge da grid e pelos textos de confirmação da ação
// Arquivar (M5).
// -----------------------------------------------------------------------------

import type { LanguageDate } from '@/@types/language';
import type { Option } from '@/@types/option';

import { batchStatus, type BatchStatus } from '../batch-status';

const labels = (languageGB: LanguageDate): Map<BatchStatus, string> => {
  const text = languageGB.batches.batch.statusOptions;
  return new Map([
    [batchStatus.active, text.active],
    [batchStatus.pending, text.pending],
    [batchStatus.inactive, text.inactive],
    [batchStatus.archived, text.archived],
  ]);
};

const getLabel = (status: BatchStatus, languageGB: LanguageDate): string =>
  labels(languageGB).get(status)!;

const getOption = (status: BatchStatus, languageGB: LanguageDate): Option<BatchStatus> => ({
  label: getLabel(status, languageGB),
  value: status,
});

const options = (languageGB: LanguageDate): Option<BatchStatus>[] =>
  Array.from(labels(languageGB)).map(([value, label]) => ({ value, label }));

export const batchStatusOptions = {
  getLabel,
  getOption,
  options,
};
