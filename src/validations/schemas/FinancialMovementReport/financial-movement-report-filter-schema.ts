// src/validations/schemas/FinancialMovementReport/financial-movement-report-filter-schema.ts
// -----------------------------------------------------------------------------
// Schema de validação Yup do filtro do relatório "Movimento Bancário" (F-264,
// esteira 97-Esteiras/058, TASK-058-F264-FE-01). Mirror ESTRUTURAL de
// `CostCenterReport/cost-center-report-filter-schema.ts` (par `start_date`/
// `end_date` SEMPRE obrigatório, `end_date >= start_date` via `.test()`) —
// CORRIGE a ausência de validação server-side do legado (CL-18, FID-13).
//
// `accounts`/`types`/`categories` (arrays de `CheckboxListField`) e
// `proprietary`/`center_id`/`farm_id` (Selects opcionais) são OPCIONAIS, sem
// `.test()` de proibição condicional entre si (contrato de tela — nenhum
// campo desta tela restringe outro). `condition`/`format` são
// `noClearable` com default sempre preenchido — `v.option()` (mirror
// `periodicity`/`order`/`format` de `expense-report-filter-schema.ts`).
//
// Nenhuma string literal em mensagem de validação.
// -----------------------------------------------------------------------------

import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

import fieldValidationSchema from '@/validations/field-validation-schema';

import type { LanguageDate } from '@/@types/language';
import type {
  FinancialMovementCondition,
  FinancialMovementReportFormat,
} from '@/@types/v2/FinancialMovementReport';

const optionSchema = yup
  .object({ value: yup.mixed(), label: yup.string() })
  .nullable()
  .default(null);

export const financialMovementReportFilterSchema = (languageGB: LanguageDate) => {
  const v = fieldValidationSchema(languageGB);
  const messages = languageGB.financialMovementReport.report.validation;

  return yup.object({
    accounts: yup.array(yup.string().required()).default([]),
    proprietary: optionSchema,
    types: yup.array(yup.string().required()).default([]),
    center_id: optionSchema,
    categories: yup.array(yup.string().required()).default([]),
    farm_id: optionSchema,
    condition: v.option<FinancialMovementCondition>(),
    start_date: yup.string().trim().nullable().required(messages.periodRequired),
    end_date: yup
      .string()
      .trim()
      .nullable()
      .required(messages.periodRequired)
      .test('end-date-after-start-date', messages.invalidDateRange, (value, context) => {
        const parent = context.parent as { start_date?: string | null };
        const startDate = parent.start_date;
        if (!value || !startDate) return true;
        return value >= startDate;
      }),
    format: v.option<FinancialMovementReportFormat>(),
  });
};

export const financialMovementReportFilterSchemaResolver = (languageGB: LanguageDate) =>
  yupResolver(financialMovementReportFilterSchema(languageGB)) as any;

export default financialMovementReportFilterSchemaResolver;
