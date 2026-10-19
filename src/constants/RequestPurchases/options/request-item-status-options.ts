// src/constants/RequestPurchases/options/request-item-status-options.ts
// Fábrica de opções do enum `status` de item (RequestItemStatus) — padrão
// canônico `(languageGB) => Map` + `getLabel`/`getOption`/`options`
// (get_pwa_constants_and_mappers_pattern §3.2, mirror `provider-type-options.ts`).
//
// Labels vêm de `itemStatusOptions` (bloco ADITIVO de `TASK-RP-FE-02` em
// `ModuleRequestPurchases`/`languageRequestPurchases.ts` — a ficha original
// de `TASK-RP-FE-03` só abriu labels de cabeçalho, mas a regra de ouro exige
// rótulo sempre derivado do i18n, nunca string literal).

import type { LanguageDate } from '@/@types/language';
import type { Option } from '@/@types/option';

import { requestItemStatus, RequestItemStatus } from '../request-item-status';

const labels = (languageGB: LanguageDate): Map<RequestItemStatus, string> => {
  const text = languageGB.requestPurchases.requestPurchase.itemStatusOptions;
  return new Map([
    [requestItemStatus.pendente, text.pendente],
    [requestItemStatus.entregue, text.entregue],
    [requestItemStatus.cancelado, text.cancelado],
  ]);
};

const getLabel = (value: RequestItemStatus, languageGB: LanguageDate): string =>
  labels(languageGB).get(value)!;

const getOption = (
  value: RequestItemStatus,
  languageGB: LanguageDate
): Option<RequestItemStatus> => ({
  label: getLabel(value, languageGB),
  value,
});

const options = (languageGB: LanguageDate): Option<RequestItemStatus>[] =>
  Array.from(labels(languageGB)).map(([value, label]) => ({ label, value }));

export const requestItemStatusOptions = { getLabel, getOption, options };
