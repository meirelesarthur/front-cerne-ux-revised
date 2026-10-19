// src/constants/relatorios/fiscal-difference-report/options/is-fiscal-options.ts
// -----------------------------------------------------------------------------
// Fábrica de opções do campo `is_fiscal` do relatório "Fiscal/Não Fiscal"
// (F-266, lote 076) — mirror EXATO de `report-format-options.ts` (`Map`
// alimentado por `languageGB`). Domínio de UI `'ambos' | '0' | '1'` — `'ambos'`
// é SÓ visual (`Select` `noClearable`, default selecionado), NUNCA vai ao
// servidor: `buildParams` da tela converte para `undefined` (C-09 do
// contrato, ausência = Ambos).
// -----------------------------------------------------------------------------

import type { LanguageDate } from '@/@types/language';
import { Option } from '@/@types/option';
import type { FiscalDifferenceReportIsFiscal } from '@/@types/v2/FiscalDifferenceReport';

const labels = (languageGB: LanguageDate): Map<FiscalDifferenceReportIsFiscal, string> => {
  const dictionary = languageGB.fiscalDifferenceReport.report.isFiscalOptions;
  return new Map([
    ['ambos', dictionary.both],
    ['1', dictionary.yes],
    ['0', dictionary.no],
  ]);
};

const getLabel = (value: FiscalDifferenceReportIsFiscal, languageGB: LanguageDate): string =>
  labels(languageGB).get(value)!;

const getOption = (
  value: FiscalDifferenceReportIsFiscal,
  languageGB: LanguageDate
): Option<FiscalDifferenceReportIsFiscal> => ({
  label: getLabel(value, languageGB),
  value,
});

const options = (languageGB: LanguageDate): Option<FiscalDifferenceReportIsFiscal>[] =>
  Array.from(labels(languageGB)).map(([value, label]) => ({ label, value }));

export const fiscalDifferenceReportIsFiscalOptions = { getLabel, getOption, options };
