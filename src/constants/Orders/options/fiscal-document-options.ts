// src/constants/Orders/options/fiscal-document-options.ts
// Fábrica de opções booleanas do campo `fiscal_document` ("Dedutível", bloco
// de parcelas, PED-FE-05) — padrão canônico `(languageGB) => Map` +
// `getLabel`/`getOption`/`options` (get_pwa_constants_and_mappers_pattern
// §3.2). Default no create = Sim (`true`), contrato-tela §6.2. SEM chamada
// de rede — catálogo estático.

import type { LanguageDate } from '@/@types/language';
import type { Option } from '@/@types/option';

export const fiscalDocument = {
  sim: true,
  nao: false,
} as const;

export type FiscalDocument = (typeof fiscalDocument)[keyof typeof fiscalDocument];

const labels = (languageGB: LanguageDate): Map<FiscalDocument, string> => {
  const text = languageGB.orders.order.fiscalDocumentOptions;
  return new Map([
    [fiscalDocument.sim, text.sim],
    [fiscalDocument.nao, text.nao],
  ]);
};

const getLabel = (value: FiscalDocument, languageGB: LanguageDate): string =>
  labels(languageGB).get(value)!;

const getOption = (value: FiscalDocument, languageGB: LanguageDate): Option<FiscalDocument> => ({
  label: getLabel(value, languageGB),
  value,
});

const options = (languageGB: LanguageDate): Option<FiscalDocument>[] =>
  Array.from(labels(languageGB)).map(([value, label]) => ({ label, value }));

export const fiscalDocumentOptions = { getLabel, getOption, options };
