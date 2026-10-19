// src/validations/schemas/Relatorios/herd-composition-report-filter-schema.ts
// -----------------------------------------------------------------------------
// Schema de validação Yup do filtro do relatório F-269 "Composição Rebanho"
// (lote 079, F-269-plano-frontend.md §6 TASK-F269-FE-01). Mirror ESTRUTURAL
// de `income-report-filter-schema.ts` (colunas + order/order_direction/
// format sempre obrigatórios via `fieldValidationSchema(...).option<T>()`) +
// `nutrition-consumption-report-filter-schema.ts` (par de datas com
// `.test()` de `fim >= início`, aqui OPCIONAL — nenhum dos 9 filtros do
// `HerdCompositionReportRequest::rules()` é `required`, todos `sometimes`).
//
// `weight_min`/`weight_max` são independentes (SEM `.test()` cruzado — o
// `HerdCompositionReportRequest` também não declara essa regra, `sometimes|
// numeric|min:0` cada um isoladamente; não inventar validação além do
// contrato real).
// -----------------------------------------------------------------------------

import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

import fieldValidationSchema from '@/validations/field-validation-schema';

import type { LanguageDate } from '@/@types/language';
import type {
  HerdCompositionReportFormat,
  HerdCompositionReportOrderDirection,
  HerdCompositionReportOrderKey,
} from '@/@types/v2/Relatorios/herd-composition-report';

const optionSchema = yup
  .object({ value: yup.mixed(), label: yup.string() })
  .nullable()
  .default(null);

export const herdCompositionReportFilterSchema = (languageGB: LanguageDate) => {
  const v = fieldValidationSchema(languageGB);
  const messages = languageGB.herdCompositionReport.report;

  return yup.object({
    batch: optionSchema,
    gender: optionSchema,
    breed: optionSchema,
    category: optionSchema,
    start_date: yup.string().trim().nullable().default(null),
    end_date: yup
      .string()
      .trim()
      .nullable()
      .default(null)
      .test('end-date-after-start-date', messages.validation.invalidDateRange, (value, context) => {
        const parent = context.parent as { start_date?: string | null };
        if (!value || !parent.start_date) return true;
        return value >= parent.start_date;
      }),
    weight_min: yup
      .number()
      .transform((value, original) => (original === '' || original === null ? null : value))
      .min(0, messages.validation.invalidValue)
      .nullable()
      .default(null),
    weight_max: yup
      .number()
      .transform((value, original) => (original === '' || original === null ? null : value))
      .min(0, messages.validation.invalidValue)
      .nullable()
      .default(null),
    status: optionSchema,
    columns: yup
      .array(yup.string().required())
      .min(1, messages.validation.columnsRequired)
      .default([]),
    order: v.option<HerdCompositionReportOrderKey>(),
    order_direction: v.option<HerdCompositionReportOrderDirection>(),
    format: v.option<HerdCompositionReportFormat>(),
  });
};

export const herdCompositionReportFilterSchemaResolver = (languageGB: LanguageDate) =>
  yupResolver(herdCompositionReportFilterSchema(languageGB)) as any;

export default herdCompositionReportFilterSchemaResolver;
