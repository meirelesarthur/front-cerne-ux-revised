// src/validations/schemas/Dre/dre-annual-report-filter-schema.ts
// -----------------------------------------------------------------------------
// Schema de validação Yup do filtro do relatório de DRE Anual (F-258,
// TASK-DRE-FE-03, esteira 049). Mesma forma de `dre-report-filter-schema.ts`
// (tela irmã), trocando `start_date`/`end_date` (string) por `start_year`/
// `end_year` (inteiro), `end_year >= start_year` via `.test()`. Teto dinâmico
// `new Date().getFullYear()` — mirror do backend (`contrato-api-dre.md §4`),
// NUNCA copiar o número mágico "2022" do legado como teto de validação.
// -----------------------------------------------------------------------------

import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

import type { LanguageDate } from '@/@types/language';

const optionSchema = yup
  .object({ value: yup.mixed(), label: yup.string() })
  .nullable()
  .default(null);

const TYPE_REPORTS = [1, 2] as const;

export const dreAnnualReportFilterSchema = (languageGB: LanguageDate) => {
  const messages = languageGB.dreAnnual.report;
  const currentYear = new Date().getFullYear();

  return yup.object({
    type_report: yup
      .mixed<(typeof TYPE_REPORTS)[number]>()
      .oneOf([...TYPE_REPORTS])
      .required(messages.validation.typeReportRequired),
    start_year: yup
      .number()
      .integer()
      .max(currentYear)
      .nullable()
      .required(messages.validation.yearRangeRequired),
    end_year: yup
      .number()
      .integer()
      .max(currentYear)
      .nullable()
      .required(messages.validation.yearRangeRequired)
      .test(
        'end-year-after-start-year',
        messages.validation.yearRangeRequired,
        (value, context) => {
          const parent = context.parent as { start_year?: number | null };
          const startYear = parent.start_year;
          if (value == null || startYear == null) return true;
          return value >= startYear;
        }
      ),
    center_id: optionSchema,
  });
};

export const dreAnnualReportFilterSchemaResolver = (languageGB: LanguageDate) =>
  yupResolver(dreAnnualReportFilterSchema(languageGB)) as any;

export default dreAnnualReportFilterSchemaResolver;
