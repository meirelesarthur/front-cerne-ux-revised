// src/constants/RequestQuotations/options/request-quotation-payment-method-options.ts
// Fábrica de opções do enum `payment_method` (RequestQuotationPaymentMethod)
// — padrão canônico `(languageGB) => Map` + `getLabel`/`getOption`/`options`
// (get_pwa_constants_and_mappers_pattern §3.2, mirror
// `request-purchase-status-options.ts`). Consumido pelo formulário público do
// fornecedor (TASK-CQ-FE-10) — registrado já na fundação (mesmo racional do
// aditivo de i18n em `ModuleRequestQuotations.paymentMethodOptions`).

import type { LanguageDate } from '@/@types/language';
import type { Option } from '@/@types/option';

import {
  requestQuotationPaymentMethod,
  RequestQuotationPaymentMethod,
} from '../request-quotation-payment-method';

const labels = (languageGB: LanguageDate): Map<RequestQuotationPaymentMethod, string> => {
  const text = languageGB.requestQuotations.requestQuotation.paymentMethodOptions;
  return new Map([
    [requestQuotationPaymentMethod.aVista, text.aVista],
    [requestQuotationPaymentMethod.boleto, text.boleto],
    [requestQuotationPaymentMethod.cartao, text.cartao],
    [requestQuotationPaymentMethod.pix, text.pix],
    [requestQuotationPaymentMethod.cheque, text.cheque],
  ]);
};

const getLabel = (value: RequestQuotationPaymentMethod, languageGB: LanguageDate): string =>
  labels(languageGB).get(value)!;

const getOption = (
  value: RequestQuotationPaymentMethod,
  languageGB: LanguageDate
): Option<RequestQuotationPaymentMethod> => ({
  label: getLabel(value, languageGB),
  value,
});

const options = (languageGB: LanguageDate): Option<RequestQuotationPaymentMethod>[] =>
  Array.from(labels(languageGB)).map(([value, label]) => ({ label, value }));

export const requestQuotationPaymentMethodOptions = { getLabel, getOption, options };
