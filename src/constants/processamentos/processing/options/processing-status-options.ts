// src/constants/processamentos/processing/options/processing-status-options.ts
// -----------------------------------------------------------------------------
// Fábrica de opções do enum `ProcessingStatus` (1=PENDING/2=FINISHED) —
// padrão canônico `(languageGB) => Map` + `getLabel`/`getOption`/`options`,
// mirror `batch-status-options.ts`/`reproductive-status-options.ts`. Labels
// vêm de `languageGB.processamentos.processing.status` — consumido pelo
// filtro `status` (§ FD2, funcional) e pelo badge da grid.
// -----------------------------------------------------------------------------

import type { LanguageDate } from '@/@types/language';
import type { Option } from '@/@types/option';

import { processingStatus, type ProcessingStatus } from '../processing-status';

const labels = (languageGB: LanguageDate): Map<ProcessingStatus, string> => {
  const text = languageGB.processamentos.processing.status;
  return new Map([
    [processingStatus.pending, text.pending],
    [processingStatus.finished, text.finished],
  ]);
};

const getLabel = (status: ProcessingStatus, languageGB: LanguageDate): string =>
  labels(languageGB).get(status)!;

const getOption = (
  status: ProcessingStatus,
  languageGB: LanguageDate
): Option<ProcessingStatus> => ({
  label: getLabel(status, languageGB),
  value: status,
});

const options = (languageGB: LanguageDate): Option<ProcessingStatus>[] =>
  Array.from(labels(languageGB)).map(([value, label]) => ({ value, label }));

export const processingStatusOptions = {
  getLabel,
  getOption,
  options,
};
