// src/validations/schemas/Relatorios/discards-report-filter-schema.ts
// -----------------------------------------------------------------------------
// Schema de validação Yup do filtro do relatório "Descarte Romaneio" (F-256,
// execução 97-Esteiras/078, TASK-F256-F02). Mirror ESTRUTURAL de
// `products-exit-cost-center-report-filter-schema.ts` — `start_date`/
// `end_date` OBRIGATÓRIOS (fidelidade ao `required` do HTML legado) com
// `end_date >= start_date`; `area` opcional (`optionSchema.notRequired()`).
// -----------------------------------------------------------------------------

import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

import type { LanguageDate } from '@/@types/language';

const optionSchema = yup
  .object({ value: yup.mixed(), label: yup.string() })
  .nullable()
  .default(null);

export const discardsReportFilterSchema = (languageGB: LanguageDate) => {
  const messages = languageGB.discardsReport.report;

  return yup.object({
    start_date: yup.string().trim().nullable().required(messages.validation.periodRequired),
    end_date: yup
      .string()
      .trim()
      .nullable()
      .required(messages.validation.periodRequired)
      .test(
        'end-date-after-start-date',
        messages.validation.endDateAfterStartDate,
        (value, context) => {
          const parent = context.parent as { start_date?: string | null };
          const startDate = parent.start_date;
          if (!value || !startDate) return true;
          return value >= startDate;
        }
      ),
    area: optionSchema.notRequired(),
  });
};

export const discardsReportFilterSchemaResolver = (languageGB: LanguageDate) =>
  yupResolver(discardsReportFilterSchema(languageGB)) as any;

export default discardsReportFilterSchemaResolver;
