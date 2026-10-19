// src/constants/RequestPurchases/options/request-purchase-type-options.ts
// Fábrica de opções do enum `type` (RequestPurchaseType) — padrão canônico
// `(languageGB) => Map` + `getLabel`/`getOption`/`options`
// (get_pwa_constants_and_mappers_pattern §3.2, mirror `provider-type-options.ts`).

import type { LanguageDate } from '@/@types/language';
import type { Option } from '@/@types/option';

import { requestPurchaseType, RequestPurchaseType } from '../request-purchase-type';

const labels = (languageGB: LanguageDate): Map<RequestPurchaseType, string> => {
  const text = languageGB.requestPurchases.requestPurchase.typeOptions;
  return new Map([
    [requestPurchaseType.produto, text.produto],
    [requestPurchaseType.servico, text.servico],
    [requestPurchaseType.adiantamento, text.adiantamento],
    [requestPurchaseType.reembolso, text.reembolso],
    [requestPurchaseType.diaria, text.diaria],
    [requestPurchaseType.empreitada, text.empreitada],
    [requestPurchaseType.compraEfetuada, text.compraEfetuada],
    [requestPurchaseType.frete, text.frete],
    [requestPurchaseType.manutencao, text.manutencao],
    [requestPurchaseType.emergencial, text.emergencial],
    [requestPurchaseType.despesaFixa, text.despesaFixa],
  ]);
};

const getLabel = (value: RequestPurchaseType, languageGB: LanguageDate): string =>
  labels(languageGB).get(value)!;

const getOption = (
  value: RequestPurchaseType,
  languageGB: LanguageDate
): Option<RequestPurchaseType> => ({
  label: getLabel(value, languageGB),
  value,
});

const options = (languageGB: LanguageDate): Option<RequestPurchaseType>[] =>
  Array.from(labels(languageGB)).map(([value, label]) => ({ label, value }));

export const requestPurchaseTypeOptions = { getLabel, getOption, options };
