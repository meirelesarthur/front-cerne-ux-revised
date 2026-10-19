// src/constants/inputEntries/options/appropriation-type-options.ts
// -----------------------------------------------------------------------------
// Fábrica de opções do campo `items.*.appropriation_type` de Entrada de
// Insumos (CORRECAO-R1/E5). Constante LOCAL do módulo — NÃO reutiliza
// `constants/invoices/options/appropriation-type-options.ts`: aquela carrega
// semântica GAP-528 específica de Invoice (só AGRICOLA(1) é funcional, os
// demais ramos rotulados "(indisponível nesta versão)"), que NÃO se aplica
// aqui — em Entrada de Insumos, Agricultura("1") e Pecuária("2") são AMBOS
// válidos. O `varchar(10)` do backend aceita ambos os valores.
// -----------------------------------------------------------------------------

import type { LanguageDate } from '@/@types/language';
import type { Option } from '@/@types/option';

export const inputEntryAppropriationTypeValue = {
  AGRICULTURE: '1',
  LIVESTOCK: '2',
} as const;

export type InputEntryAppropriationTypeValue =
  (typeof inputEntryAppropriationTypeValue)[keyof typeof inputEntryAppropriationTypeValue];

const labels = (languageGB: LanguageDate): Map<InputEntryAppropriationTypeValue, string> => {
  const dictionary = languageGB.inputEntries.inputEntry.form.appropriationTypeOptions;
  return new Map([
    [inputEntryAppropriationTypeValue.AGRICULTURE, dictionary.agriculture],
    [inputEntryAppropriationTypeValue.LIVESTOCK, dictionary.livestock],
  ]);
};

const getLabel = (value: InputEntryAppropriationTypeValue, languageGB: LanguageDate): string =>
  labels(languageGB).get(value) ?? String(value);

const getOption = (
  value: InputEntryAppropriationTypeValue,
  languageGB: LanguageDate
): Option<InputEntryAppropriationTypeValue> => ({ label: getLabel(value, languageGB), value });

const options = (languageGB: LanguageDate): Option<InputEntryAppropriationTypeValue>[] =>
  Array.from(labels(languageGB)).map(([value, label]) => ({ label, value }));

export const inputEntryAppropriationTypeOptions = { getLabel, getOption, options };
