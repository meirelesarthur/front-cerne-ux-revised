// src/validations/schemas/Relatorios/requisitions-report-filter-schema.ts
// -----------------------------------------------------------------------------
// Schema de validação Yup do filtro do relatório "Requisição/Saída" (F-312,
// execução 97-Esteiras/078, TASK-F312-F02). Mirror ESTRUTURAL de
// `products-exit-cost-center-report-filter-schema.ts` MENOS o campo
// `center` — `start_date`/`end_date` OBRIGATÓRIOS (fidelidade ao legado) com
// `end_date >= start_date`; `warehouse`/`product` opcionais
// (`optionSchema.notRequired()`).
// -----------------------------------------------------------------------------

import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

import type { LanguageDate } from '@/@types/language';

const optionSchema = yup
  .object({ value: yup.mixed(), label: yup.string() })
  .nullable()
  .default(null);

export const requisitionsReportFilterSchema = (languageGB: LanguageDate) => {
  const messages = languageGB.requisitionsReport.report;

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
    warehouse: optionSchema.notRequired(),
    product: optionSchema.notRequired(),
  });
};

export const requisitionsReportFilterSchemaResolver = (languageGB: LanguageDate) =>
  yupResolver(requisitionsReportFilterSchema(languageGB)) as any;

export default requisitionsReportFilterSchemaResolver;
