// src/constants/RequestPurchases/options/request-purchase-priority-options.ts
// Fábrica de opções do enum `priority` (RequestPurchasePriority) — padrão
// canônico `(languageGB) => Map` + `getLabel`/`getOption`/`options`
// (get_pwa_constants_and_mappers_pattern §3.2, mirror `provider-type-options.ts`).

import type { LanguageDate } from '@/@types/language';
import type { Option } from '@/@types/option';

import { requestPurchasePriority, RequestPurchasePriority } from '../request-purchase-priority';

const labels = (languageGB: LanguageDate): Map<RequestPurchasePriority, string> => {
  const text = languageGB.requestPurchases.requestPurchase.priorityOptions;
  return new Map([
    [requestPurchasePriority.alta, text.alta],
    [requestPurchasePriority.media, text.media],
    [requestPurchasePriority.baixa, text.baixa],
  ]);
};

const getLabel = (value: RequestPurchasePriority, languageGB: LanguageDate): string =>
  labels(languageGB).get(value)!;

const getOption = (
  value: RequestPurchasePriority,
  languageGB: LanguageDate
): Option<RequestPurchasePriority> => ({
  label: getLabel(value, languageGB),
  value,
});

const options = (languageGB: LanguageDate): Option<RequestPurchasePriority>[] =>
  Array.from(labels(languageGB)).map(([value, label]) => ({ label, value }));

export const requestPurchasePriorityOptions = { getLabel, getOption, options };
