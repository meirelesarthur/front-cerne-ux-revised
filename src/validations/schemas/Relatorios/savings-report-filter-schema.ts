// src/validations/schemas/Relatorios/savings-report-filter-schema.ts
// -----------------------------------------------------------------------------
// Schema de validação Yup do filtro do relatório "Savings" (F-319, execução
// 97-Esteiras/013, TASK-013-F319-FE-01). Mirror ESTRUTURAL de
// `stock-movement-report-filter-schema.ts` — 4 campos VALIDADOS (`farm_uuid`
// array não-vazio obrigatório, `start_date`/`end_date` obrigatórios com
// `end_date >= start_date`, `status` opcional) + 1 campo DECLARADO sem
// validação (`user_id`, decorativo — `DEC-FE-02`): NUNCA `required`, NUNCA
// bloqueia o submit em nenhum estado.
// -----------------------------------------------------------------------------

import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

import type { LanguageDate } from '@/@types/language';

const optionSchema = yup
  .object({ value: yup.mixed(), label: yup.string() })
  .nullable()
  .default(null);

export const savingsReportFilterSchema = (languageGB: LanguageDate) => {
  const messages = languageGB.savingsReport.report;

  return yup.object({
    farm_uuid: yup
      .array()
      .of(yup.string().required())
      .min(1, messages.validation.farmRequired)
      .required(messages.validation.farmRequired),
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
    status: optionSchema.notRequired(),
    // Campo DECORATIVO (`DEC-FE-02`, mirror do filtro morto `user_id` do
    // legado, `CL-019`/`OQ-007`) — declarado só para tipar o form; NUNCA
    // `required`, NUNCA bloqueia o submit em nenhum estado.
    user_id: optionSchema.notRequired(),
  });
};

export const savingsReportFilterSchemaResolver = (languageGB: LanguageDate) =>
  yupResolver(savingsReportFilterSchema(languageGB)) as any;

export default savingsReportFilterSchemaResolver;
