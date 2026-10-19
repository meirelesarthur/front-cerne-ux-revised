// src/constants/invoices/options/document-type-options.ts
// -----------------------------------------------------------------------------
// Fábrica de opções do campo `type` ("Tipo Nota") — `InvoiceDocumentType`
// (int-backed, Enum PHP real, SEM endpoint de catálogo) — padrão canônico
// `(languageGB) => Map` + `getLabel`/`getOption`/`options`, mirror
// `drink-options.ts`/`provider-type-options.ts`.
// -----------------------------------------------------------------------------

import type { LanguageDate } from '@/@types/language';
import { Option } from '@/@types/option';
import type { InvoiceDocumentTypeValue } from '@/@types/v2/Invoices';

export const invoiceDocumentTypeIndex = {
  NFE: 1,
  CTE: 2,
  NFSE: 3,
  NFCE: 4,
  DANFE: 5,
  DARF: 6,
  DARE: 7,
  GRU: 8,
} as const satisfies Record<string, InvoiceDocumentTypeValue>;

const labels = (languageGB: LanguageDate): Map<InvoiceDocumentTypeValue, string> => {
  const dictionary = languageGB.invoices.invoice.documentTypeOptions;
  return new Map([
    [invoiceDocumentTypeIndex.NFE, dictionary.nfe],
    [invoiceDocumentTypeIndex.CTE, dictionary.cte],
    [invoiceDocumentTypeIndex.NFSE, dictionary.nfse],
    [invoiceDocumentTypeIndex.NFCE, dictionary.nfce],
    [invoiceDocumentTypeIndex.DANFE, dictionary.danfe],
    [invoiceDocumentTypeIndex.DARF, dictionary.darf],
    [invoiceDocumentTypeIndex.DARE, dictionary.dare],
    [invoiceDocumentTypeIndex.GRU, dictionary.gru],
  ]);
};

const getLabel = (value: InvoiceDocumentTypeValue, languageGB: LanguageDate): string =>
  labels(languageGB).get(value) ?? String(value);

const options = (languageGB: LanguageDate): Option<InvoiceDocumentTypeValue>[] =>
  Array.from(labels(languageGB)).map(([value, label]) => ({ label, value }));

export const invoiceDocumentTypeOptions = { getLabel, options };
