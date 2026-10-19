// src/constants/relatorios/herd-composition-report/options/herd-composition-report-order-direction-options.ts
// -----------------------------------------------------------------------------
// Fábrica de opções do campo `order_direction` do relatório F-269 "Composição
// Rebanho" (lote 079, F-269-plano-frontend.md §6 TASK-F269-FE-01) —
// `asc`/`desc`, mirror ESTRUTURAL de `report-order-direction-options.ts`
// (AccountsReports).
//
// Fábrica PRÓPRIA deste domínio (NÃO reusa `reportOrderDirectionOptions`/
// `ReportOrderDirection` de `@/constants/Relatorios/accounts-reports/**` —
// confirmado por grep que aquele catálogo é consumido EXCLUSIVAMENTE pelas 4
// telas de relatório de Contas, Financeiro; importar o tipo/fábrica de
// AccountsReports dentro de `Relatorios/Pecuaria/**` seria import
// cross-feature, disciplina já vedada nesta SPA — ver cabeçalho de
// `nutrition-consumption-report.ts`/`death-animal-report-format-options.ts`).
// -----------------------------------------------------------------------------

import type { LanguageDate } from '@/@types/language';
import { Option } from '@/@types/option';
import type { HerdCompositionReportOrderDirection } from '@/@types/v2/Relatorios/herd-composition-report';

const labels = (languageGB: LanguageDate): Map<HerdCompositionReportOrderDirection, string> => {
  const dictionary = languageGB.herdCompositionReport.report.orderDirectionOptions;
  return new Map([
    ['asc', dictionary.asc],
    ['desc', dictionary.desc],
  ]);
};

const getLabel = (value: HerdCompositionReportOrderDirection, languageGB: LanguageDate): string =>
  labels(languageGB).get(value)!;

const getOption = (
  value: HerdCompositionReportOrderDirection,
  languageGB: LanguageDate
): Option<HerdCompositionReportOrderDirection> => ({
  label: getLabel(value, languageGB),
  value,
});

const options = (languageGB: LanguageDate): Option<HerdCompositionReportOrderDirection>[] =>
  Array.from(labels(languageGB)).map(([value, label]) => ({ label, value }));

export const herdCompositionReportOrderDirectionOptions = { getLabel, getOption, options };
