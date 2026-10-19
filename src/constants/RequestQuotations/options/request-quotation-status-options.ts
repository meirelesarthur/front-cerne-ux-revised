// src/constants/RequestQuotations/options/request-quotation-status-options.ts
// Fábrica de opções do enum `status` (RequestQuotationStatus) — padrão
// canônico `(languageGB) => Map` + `getLabel`/`getOption`/`options`
// (get_pwa_constants_and_mappers_pattern §3.2, mirror
// `request-purchase-status-options.ts`).

import type { LanguageDate } from '@/@types/language';
import type { Option } from '@/@types/option';

import { requestQuotationStatus, RequestQuotationStatus } from '../request-quotation-status';

const labels = (languageGB: LanguageDate): Map<RequestQuotationStatus, string> => {
  const text = languageGB.requestQuotations.requestQuotation.statusOptions;
  return new Map([
    [requestQuotationStatus.aguardando, text.aguardando],
    [requestQuotationStatus.enviada, text.enviada],
    [requestQuotationStatus.recebida, text.recebida],
  ]);
};

const getLabel = (value: RequestQuotationStatus, languageGB: LanguageDate): string =>
  labels(languageGB).get(value)!;

const getOption = (
  value: RequestQuotationStatus,
  languageGB: LanguageDate
): Option<RequestQuotationStatus> => ({
  label: getLabel(value, languageGB),
  value,
});

const options = (languageGB: LanguageDate): Option<RequestQuotationStatus>[] =>
  Array.from(labels(languageGB)).map(([value, label]) => ({ label, value }));

export const requestQuotationStatusOptions = { getLabel, getOption, options };
