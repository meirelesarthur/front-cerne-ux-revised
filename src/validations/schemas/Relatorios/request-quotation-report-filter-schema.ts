// src/validations/schemas/Relatorios/request-quotation-report-filter-schema.ts
// -----------------------------------------------------------------------------
// Schema de validação Yup do filtro do relatório "Orçamentos"
// (`request-quotation.report`, F-311, execução 97-Esteiras/078,
// TASK-F311-F02). Mirror ESTRUTURAL de
// `products-exit-cost-center-report-filter-schema.ts` — `start_date`/
// `end_date` OBRIGATÓRIOS (fidelidade ao legado, `required` HTML) com
// `end_date >= start_date`; `provider_id`/`farm_id` opcionais
// (`optionSchema.notRequired()`).
// -----------------------------------------------------------------------------

import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

import type { LanguageDate } from '@/@types/language';

const optionSchema = yup
  .object({ value: yup.mixed(), label: yup.string() })
  .nullable()
  .default(null);

export const requestQuotationReportFilterSchema = (languageGB: LanguageDate) => {
  const messages = languageGB.requestQuotationReport.report;

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
    provider_id: optionSchema.notRequired(),
    farm_id: optionSchema.notRequired(),
  });
};

export const requestQuotationReportFilterSchemaResolver = (languageGB: LanguageDate) =>
  yupResolver(requestQuotationReportFilterSchema(languageGB)) as any;

export default requestQuotationReportFilterSchemaResolver;
