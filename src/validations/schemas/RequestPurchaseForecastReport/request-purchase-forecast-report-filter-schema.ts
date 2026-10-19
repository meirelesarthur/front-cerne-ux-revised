// src/validations/schemas/RequestPurchaseForecastReport/request-purchase-forecast-report-filter-schema.ts
// -----------------------------------------------------------------------------
// Schema de validação Yup do filtro do relatório "Produtos x Prev. Entrega"
// (F-309, esteira 97-Esteiras/058, TASK-058-F309-FE-01). Mirror ESTRUTURAL de
// `request-purchase-management-report-filter-schema.ts` (F-310): par
// `start_date`/`end_date` SEMPRE obrigatório, `end_date >= start_date` via
// `.test()`, mensagens SEPARADAS para "obrigatório" vs. "intervalo inválido".
//
// Demais campos (`farm_id`/`user_id`/`status`/`priority`/`authorizer_id`/
// `number`/`product`/`service`) são OPCIONAIS (`Option` nullable ou string
// nullable) — SEM `.test()` de proibição condicional entre si (plano §2.2:
// nenhum outro campo é obrigatório, SEM cascata entre campos).
// -----------------------------------------------------------------------------

import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

import type { LanguageDate } from '@/@types/language';

const optionSchema = yup
  .object({ value: yup.mixed(), label: yup.string() })
  .nullable()
  .default(null);

export const requestPurchaseForecastReportFilterSchema = (languageGB: LanguageDate) => {
  const messages = languageGB.requestPurchaseForecastReport.report.validation;

  return yup.object({
    start_date: yup.string().trim().nullable().required(messages.periodRequired),
    end_date: yup
      .string()
      .trim()
      .nullable()
      .required(messages.periodRequired)
      .test('end-date-after-start-date', messages.invalidDateRange, (value, context) => {
        const parent = context.parent as { start_date?: string | null };
        if (!value || !parent.start_date) return true;
        return value >= parent.start_date;
      }),
    farm_id: optionSchema,
    user_id: optionSchema,
    status: optionSchema,
    priority: optionSchema,
    authorizer_id: optionSchema,
    number: yup.string().trim().nullable().default(null),
    product: optionSchema,
    service: yup.string().trim().nullable().default(null),
  });
};

export const requestPurchaseForecastReportFilterSchemaResolver = (languageGB: LanguageDate) =>
  yupResolver(requestPurchaseForecastReportFilterSchema(languageGB)) as any;

export default requestPurchaseForecastReportFilterSchemaResolver;
