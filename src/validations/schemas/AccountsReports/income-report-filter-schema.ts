// src/validations/schemas/AccountsReports/income-report-filter-schema.ts
// -----------------------------------------------------------------------------
// Schema de validação Yup do filtro do relatório F-271 C. a Receber (esteira
// 97-Esteiras/050, TASK-050-271-FE-01). Mirror direto de
// `expense-report-filter-schema.ts` (par de datas com `.test()` de
// `fim >= início`) + `fieldValidationSchema(languageGB).option<T>()` para os
// 3 campos sempre obrigatórios (`order`/`order_direction`/`format`) —
// mensagens de campo genéricas herdadas de
// `defaltStrings.validations.requiredField`; as 2 mensagens de intervalo de
// data e a de `columns` vêm de `accountsReports.shared.validation.*`.
//
// SEM `classification` (não existe no `IncomeReportFilterForm` — o
// `IncomeReportRequest` não aceita este parâmetro nesta rota).
//
// Nenhuma string literal em mensagem de validação.
// -----------------------------------------------------------------------------

import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

import fieldValidationSchema from '@/validations/field-validation-schema';

import type { LanguageDate } from '@/@types/language';
import type {
  IncomeReportOrderKey,
  ReportFormat,
  ReportOrderDirection,
} from '@/@types/v2/AccountsReports';

const optionSchema = yup
  .object({ value: yup.mixed(), label: yup.string() })
  .nullable()
  .default(null);

export const incomeReportFilterSchema = (languageGB: LanguageDate) => {
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
    clients: yup.array(yup.string().required()).default([]),
    categories: yup.array(yup.string().required()).default([]),
    proprietary_id: optionSchema,
    farm_id: optionSchema,
    center_id: optionSchema,
    periodicity: optionSchema,
    columns: yup.array(yup.string().required()).min(1, messages.columnsRequired).default([]),
    order: v.option<IncomeReportOrderKey>(),
    order_direction: v.option<ReportOrderDirection>(),
    format: v.option<ReportFormat>(),
  });
};

export const incomeReportFilterSchemaResolver = (languageGB: LanguageDate) =>
  yupResolver(incomeReportFilterSchema(languageGB)) as any;

export default incomeReportFilterSchemaResolver;
