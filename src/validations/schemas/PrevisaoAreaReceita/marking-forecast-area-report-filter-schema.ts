// src/validations/schemas/PrevisaoAreaReceita/marking-forecast-area-report-filter-schema.ts
// -----------------------------------------------------------------------------
// Schema de validação Yup do filtro do relatório "Prev. Área/Receita" (F-280,
// TASK-MFA-FE-01, esteira 075). Mirror ESTRUTURAL de
// `stock-movement-report-filter-schema.ts` — nenhum campo `.required()`
// (mirror `CL-37`, legado nunca teve obrigatoriedade neste filtro).
//
// O schema valida a FORMA INTERNA do form (Option-based, react-hook-form),
// NÃO o payload final do service (`MarkingForecastAreaReportParams`):
//   production_cycle: Option<string> | null  (opcional, JS-only)
//   areas: Option<string>[] | null           (opcional)
//   start_date: string | null                (opcional)
//   end_date: string | null                  (opcional; >= start_date só quando ambas preenchidas)
//   variety: Option<string> | null           (opcional)
//   order: Option<number> | null             (opcional)
//   week: string                             (opcional)
//   year: string                             (opcional — pré-preenchido, `CL-18`)
// -----------------------------------------------------------------------------

import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

import type { LanguageDate } from '@/@types/language';

const optionSchema = yup
  .object({ value: yup.mixed(), label: yup.string() })
  .nullable()
  .default(null);

const optionListSchema = yup.array().of(optionSchema).nullable().default(null);

export const markingForecastAreaReportFilterSchema = (languageGB: LanguageDate) => {
  const messages = languageGB.markingForecastAreaReport.report;

  return yup.object({
    production_cycle: optionSchema,
    areas: optionListSchema,
    start_date: yup.string().trim().nullable(),
    end_date: yup
      .string()
      .trim()
      .nullable()
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
    variety: optionSchema,
    order: optionSchema,
    week: yup.string().trim(),
    year: yup.string().trim(),
  });
};

export const markingForecastAreaReportFilterSchemaResolver = (languageGB: LanguageDate) =>
  yupResolver(markingForecastAreaReportFilterSchema(languageGB)) as any;

export default markingForecastAreaReportFilterSchemaResolver;
