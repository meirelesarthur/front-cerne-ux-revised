// src/validations/schemas/AccountsReports/paid-income-report-filter-schema.ts
// -----------------------------------------------------------------------------
// Schema de validação Yup do filtro do relatório F-292 C. Recebidas (esteira
// 97-Esteiras/050, TASK-050-292-FE-01) — mesma forma do irmão
// `income-report-filter-schema.ts` (2 pares de data com `.test()` de
// `fim >= início`, `columns.min(1)`, `order`/`order_direction`/`format`
// obrigatórios via `fieldValidationSchema(languageGB).option<T>()`).
// SEM `periodicity` (não existe no `PaidIncomeReportFilterForm` — parâmetro
// inexistente nesta rota, `D-292-SIM`). Mensagens só de i18n
// (`accountsReports.shared.validation.*` +
// `defaltStrings.validations.requiredField` herdada).
// -----------------------------------------------------------------------------

import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

import fieldValidationSchema from '@/validations/field-validation-schema';

import type { LanguageDate } from '@/@types/language';
import type {
  PaidIncomeReportOrderKey,
  ReportFormat,
  ReportOrderDirection,
} from '@/@types/v2/AccountsReports';

const optionSchema = yup
  .object({ value: yup.mixed(), label: yup.string() })
  .nullable()
  .default(null);

export const paidIncomeReportFilterSchema = (languageGB: LanguageDate) => {
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
    account_id: optionSchema,
    center_id: optionSchema,
    farm_id: optionSchema,
    columns: yup.array(yup.string().required()).min(1, messages.columnsRequired).default([]),
    order: v.option<PaidIncomeReportOrderKey>(),
    order_direction: v.option<ReportOrderDirection>(),
    format: v.option<ReportFormat>(),
  });
};

export const paidIncomeReportFilterSchemaResolver = (languageGB: LanguageDate) =>
  yupResolver(paidIncomeReportFilterSchema(languageGB)) as any;

export default paidIncomeReportFilterSchemaResolver;
