// src/validations/schemas/AccountsReports/expense-report-filter-schema.ts
// -----------------------------------------------------------------------------
// Schema de validação Yup do filtro do relatório F-262 C. à Pagar (esteira
// 97-Esteiras/050, TASK-050-262-FE-01). Mirror direto de
// `dre-report-filter-schema.ts` (par de datas com `.test()` de
// `fim >= início`) + `fieldValidationSchema(languageGB).option<T>()` para os
// 3 campos sempre obrigatórios (`order`/`order_direction`/`format`, mirror
// `charge-schema.ts::client_uuid`) — mensagens de campo genéricas herdadas
// de `defaltStrings.validations.requiredField`; as 2 mensagens de intervalo
// de data e a de `columns` vêm de `accountsReports.shared.validation.*`.
//
// Nenhuma string literal em mensagem de validação.
// -----------------------------------------------------------------------------

import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

import fieldValidationSchema from '@/validations/field-validation-schema';

import type { LanguageDate } from '@/@types/language';
import type {
  ExpenseReportOrderKey,
  ReportFormat,
  ReportOrderDirection,
} from '@/@types/v2/AccountsReports';

const optionSchema = yup
  .object({ value: yup.mixed(), label: yup.string() })
  .nullable()
  .default(null);

export const expenseReportFilterSchema = (languageGB: LanguageDate) => {
  const v = fieldValidationSchema(languageGB);
  const messages = languageGB.accountsReports.shared.validation;

  return yup.object({
    start_date: yup.string().trim().nullable().default(null),
    end_date: yup
      .string()
      .trim()
      .nullable()
      .default(null)
      .test('end-date-after-start-date', messages.invalidDateRange, (value, context) => {
        const parent = context.parent as { start_date?: string | null };
        if (!value || !parent.start_date) return true;
        return value >= parent.start_date;
      }),
    start_emission_date: yup.string().trim().nullable().default(null),
    end_emission_date: yup
      .string()
      .trim()
      .nullable()
      .default(null)
      .test(
        'end-emission-date-after-start-emission-date',
        messages.invalidEmissionDateRange,
        (value, context) => {
          const parent = context.parent as { start_emission_date?: string | null };
          if (!value || !parent.start_emission_date) return true;
          return value >= parent.start_emission_date;
        }
      ),
    classification: optionSchema,
    providers: yup.array(yup.string().required()).default([]),
    categories: yup.array(yup.string().required()).default([]),
    proprietary_id: optionSchema,
    farm_id: optionSchema,
    center_id: optionSchema,
    periodicity: optionSchema,
    columns: yup.array(yup.string().required()).min(1, messages.columnsRequired).default([]),
    order: v.option<ExpenseReportOrderKey>(),
    order_direction: v.option<ReportOrderDirection>(),
    format: v.option<ReportFormat>(),
  });
};

export const expenseReportFilterSchemaResolver = (languageGB: LanguageDate) =>
  yupResolver(expenseReportFilterSchema(languageGB)) as any;

export default expenseReportFilterSchemaResolver;
