// src/validations/schemas/CashFlowByCategoryReport/cash-flow-by-category-report-filter-schema.ts
// -----------------------------------------------------------------------------
// Schema de validação Yup do filtro do relatório "Fluxo de Caixa Mensal"
// (F-240, TASK-053-240-FE-01, esteira 97-Esteiras/053). Mirror ESTRUTURAL de
// `cost-center-report-filter-schema.ts` (par `start_date`/`end_date` SEMPRE
// obrigatório, `end_date >= start_date` via `.test()`, `group` obrigatório
// `v.option<T>()`) + 3 campos novos obrigatórios (`last_balance`/
// `report_type`/`format`, mirror `v.option<T>()` de
// `expense-report-filter-schema.ts`).
//
// `accounts`/`proprietary_id`/`center_id`/`farm_id` são OPCIONAIS, sem
// `.test()` de proibição condicional entre si — a obrigatoriedade visual
// condicional de `accounts[]` quando `group==='C'` (IG-01) é SÓ COSMÉTICA
// (asterisco), sem bloqueio Yup (o servidor aceita vazio mesmo com
// `group=C`, CL-031 preservada fielmente).
// -----------------------------------------------------------------------------

import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

import fieldValidationSchema from '@/validations/field-validation-schema';

import type { LanguageDate } from '@/@types/language';
import type { ReportFormat } from '@/@types/v2/AccountsReports';
import type {
  CashFlowByCategoryReportGroup,
  CashFlowByCategoryReportType,
} from '@/@types/v2/CashFlowByCategoryReport';

const optionSchema = yup
  .object({ value: yup.mixed(), label: yup.string() })
  .nullable()
  .default(null);

export const cashFlowByCategoryReportFilterSchema = (languageGB: LanguageDate) => {
  const v = fieldValidationSchema(languageGB);
  const messages = languageGB.cashFlowByCategoryReport.report;

  return yup.object({
    group: v.option<CashFlowByCategoryReportGroup>(),
    start_date: yup.string().trim().nullable().required(messages.validation.periodRequired),
    end_date: yup
      .string()
      .trim()
      .nullable()
      .required(messages.validation.periodRequired)
      .test('end-date-after-start-date', messages.validation.periodRequired, (value, context) => {
        const parent = context.parent as { start_date?: string | null };
        const startDate = parent.start_date;
        if (!value || !startDate) return true;
        return value >= startDate;
      }),
    accounts: yup.array(yup.string().required()).default([]),
    last_balance: v.option<boolean>(),
    proprietary_id: optionSchema,
    center_id: optionSchema,
    farm_id: optionSchema,
    report_type: v.option<CashFlowByCategoryReportType>(),
    format: v.option<ReportFormat>(),
  });
};

export const cashFlowByCategoryReportFilterSchemaResolver = (languageGB: LanguageDate) =>
  yupResolver(cashFlowByCategoryReportFilterSchema(languageGB)) as any;

export default cashFlowByCategoryReportFilterSchemaResolver;
