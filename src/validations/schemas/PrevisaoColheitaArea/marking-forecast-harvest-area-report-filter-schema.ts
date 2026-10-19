// src/validations/schemas/PrevisaoColheitaArea/marking-forecast-harvest-area-report-filter-schema.ts
// -----------------------------------------------------------------------------
// Schema de validação Yup do filtro do relatório "Previsão Colheita/Área"
// (F-282, esteira 059). Mirror ESTRUTURAL de
// `PrevisaoAreaReceita/marking-forecast-area-report-filter-schema.ts` (F-280)
// — nenhum campo `.required()` (mirror `MarkingForecastHarvestAreaReportRequest::rules()`,
// TODOS os campos `nullable` no servidor — submit vazio ainda gera o
// relatório completo).
//
// O schema valida a FORMA INTERNA do form (Option-based, react-hook-form),
// NÃO o payload final do service (`MarkingForecastHarvestAreaReportParams`):
//   production_cycle: Option<string> | null  (opcional, JS-only)
//   areas: Option<string>[] | null           (opcional)
//   start_date: string | null                (opcional)
//   end_date: string | null                  (opcional; >= start_date só quando ambas preenchidas)
//   cultivation: Option<string> | null       (opcional)
//   forecast: Option<number> | null          (opcional — universo {1,2,3,4})
//   week: number | null                      (opcional — inteiro 1-53)
//   year: number | null                      (opcional — inteiro 4 dígitos)
// -----------------------------------------------------------------------------

import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

import type { LanguageDate } from '@/@types/language';

const optionSchema = yup
  .object({ value: yup.mixed(), label: yup.string() })
  .nullable()
  .default(null);

const optionListSchema = yup.array().of(optionSchema).nullable().default(null);

export const markingForecastHarvestAreaReportFilterSchema = (languageGB: LanguageDate) => {
  const messages = languageGB.markingForecastHarvestAreaReport.report;

  return yup.object({
    production_cycle: optionSchema,
    areas: optionListSchema,
    start_date: yup.string().trim().nullable().default(null),
    end_date: yup
      .string()
      .trim()
      .nullable()
      .default(null)
      .test(
        'end-date-after-start-date',
        messages.validation.endDateAfterStartDate,
        (value, context) => {
          const parent = context.parent as { start_date?: string | null };
          const startDate = parent.start_date;
          if (!value || !startDate) return true; // ambas opcionais — só valida quando as 2 existem
          return value >= startDate;
        }
      ),
    cultivation: optionSchema,
    forecast: optionSchema,
    week: yup
      .number()
      .transform((value, original) => (original === '' || original === null ? null : value))
      .nullable()
      .default(null)
      .min(1)
      .max(53),
    year: yup
      .number()
      .transform((value, original) => (original === '' || original === null ? null : value))
      .nullable()
      .default(null)
      .test('year-4-digits', '', (value) => {
        if (value === null || value === undefined) return true;
        return value >= 1000 && value <= 9999;
      }),
  });
};

export const markingForecastHarvestAreaReportFilterSchemaResolver = (languageGB: LanguageDate) =>
  yupResolver(markingForecastHarvestAreaReportFilterSchema(languageGB)) as any;

export default markingForecastHarvestAreaReportFilterSchemaResolver;
