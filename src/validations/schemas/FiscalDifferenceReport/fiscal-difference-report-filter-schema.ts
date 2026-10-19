// src/validations/schemas/FiscalDifferenceReport/fiscal-difference-report-filter-schema.ts
// -----------------------------------------------------------------------------
// Schema de validação Yup do filtro do relatório "Fiscal/Não Fiscal" (F-266,
// lote 076). Mirror ESTRUTURAL de
// `CashFlowByCategoryReport/cash-flow-by-category-report-filter-schema.ts`
// (par `start_date`/`end_date` SEMPRE obrigatório, `end_date >= start_date`
// via `.test()`, `is_fiscal`/`condition` obrigatórios `v.option<T>()` — ambos
// têm default de UI sempre selecionado, `noClearable`).
//
// `accounts`/`proprietary`/`center_id`/`categories` são OPCIONAIS, sem
// `.test()` de proibição condicional entre si — mirror fiel do Request real
// (`FiscalDifferenceReportRequest::rules()`, todos `nullable`).
// -----------------------------------------------------------------------------

import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

import fieldValidationSchema from '@/validations/field-validation-schema';

import type { LanguageDate } from '@/@types/language';
import type {
  FiscalDifferenceReportCondition,
  FiscalDifferenceReportIsFiscal,
} from '@/@types/v2/FiscalDifferenceReport';

const optionSchema = yup
  .object({ value: yup.mixed(), label: yup.string() })
  .nullable()
  .default(null);

export const fiscalDifferenceReportFilterSchema = (languageGB: LanguageDate) => {
  const v = fieldValidationSchema(languageGB);
  const messages = languageGB.fiscalDifferenceReport.report;

  return yup.object({
    accounts: yup.array(yup.string().required()).default([]),
    proprietary: optionSchema,
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
    center_id: optionSchema,
    categories: yup.array(yup.string().required()).default([]),
    is_fiscal: v.option<FiscalDifferenceReportIsFiscal>(),
    condition: v.option<FiscalDifferenceReportCondition>(),
  });
};

export const fiscalDifferenceReportFilterSchemaResolver = (languageGB: LanguageDate) =>
  yupResolver(fiscalDifferenceReportFilterSchema(languageGB)) as any;

export default fiscalDifferenceReportFilterSchemaResolver;
