// src/constants/invoices/options/classification-options.ts
// Fábrica de opções do campo `classification` — `InvoiceClassification`
// (string-backed, default 'N' na Action) — mirror `document-type-options.ts`.

import type { LanguageDate } from '@/@types/language';
import { Option } from '@/@types/option';
import type { InvoiceClassificationValue } from '@/@types/v2/Invoices';

const labels = (languageGB: LanguageDate): Map<InvoiceClassificationValue, string> => {
  const dictionary = languageGB.invoices.invoice.classificationOptions;
  return new Map([
    ['N', dictionary.notClassified],
    ['C', dictionary.capex],
    ['O', dictionary.opex],
  ]);
};

const getLabel = (value: InvoiceClassificationValue, languageGB: LanguageDate): string =>
  labels(languageGB).get(value) ?? value;

const options = (languageGB: LanguageDate): Option<InvoiceClassificationValue>[] =>
  Array.from(labels(languageGB)).map(([value, label]) => ({ label, value }));

export const invoiceClassificationOptions = { getLabel, options };
