// src/constants/invoices/options/apportionment-type-options.ts
// Fábrica de opções do campo `apportionment_type` ("Tipo Rateio") —
// `InvoiceApportionmentType` (string-backed, V=Valor/P=Produto) — mirror
// `document-type-options.ts`.

import type { LanguageDate } from '@/@types/language';
import { Option } from '@/@types/option';
import type { InvoiceApportionmentTypeValue } from '@/@types/v2/Invoices';

const labels = (languageGB: LanguageDate): Map<InvoiceApportionmentTypeValue, string> => {
  const dictionary = languageGB.invoices.invoice.apportionmentTypeOptions;
  return new Map([
    ['V', dictionary.value],
    ['P', dictionary.product],
  ]);
};

const getLabel = (value: InvoiceApportionmentTypeValue, languageGB: LanguageDate): string =>
  labels(languageGB).get(value) ?? value;

const options = (languageGB: LanguageDate): Option<InvoiceApportionmentTypeValue>[] =>
  Array.from(labels(languageGB)).map(([value, label]) => ({ label, value }));

export const invoiceApportionmentTypeOptions = { getLabel, options };
