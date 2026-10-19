// src/validations/schemas/Relatorios/payment-cashflow-report-filter-schema.ts
// -----------------------------------------------------------------------------
// Schema de validação Yup do filtro do relatório "Fluxo Mensal de Pagamento"
// (`payment-cashflow.report`, F-293, execução 97-Esteiras/078,
// TASK-F293-F02). Mirror ESTRUTURAL de
// `request-quotation-report-filter-schema.ts` — `start_date`/`end_date`
// OBRIGATÓRIOS (fidelidade ao legado, `required` HTML) com `end_date >=
// start_date` (mirror `after_or_equal` server-side de
// `PaymentCashflowReportRequest`); `accounts`/`categories` opcionais
// (`array().notRequired()`); `proprietary`/`center_id`/`farm_id` opcionais
// (`optionSchema.notRequired()`).
// -----------------------------------------------------------------------------

import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

import type { LanguageDate } from '@/@types/language';

const optionSchema = yup
  .object({ value: yup.mixed(), label: yup.string() })
  .nullable()
  .default(null);

export const paymentCashflowReportFilterSchema = (languageGB: LanguageDate) => {
  const messages = languageGB.paymentCashflowReport.report;

  return yup.object({
    accounts: yup.array().of(yup.string().required()).notRequired(),
    categories: yup.array().of(yup.string().required()).notRequired(),
    proprietary: optionSchema.notRequired(),
    center_id: optionSchema.notRequired(),
    farm_id: optionSchema.notRequired(),
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
  });
};

export const paymentCashflowReportFilterSchemaResolver = (languageGB: LanguageDate) =>
  yupResolver(paymentCashflowReportFilterSchema(languageGB)) as any;

export default paymentCashflowReportFilterSchemaResolver;
