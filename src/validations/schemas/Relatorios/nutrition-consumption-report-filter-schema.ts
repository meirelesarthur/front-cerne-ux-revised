// src/validations/schemas/Relatorios/nutrition-consumption-report-filter-schema.ts
// -----------------------------------------------------------------------------
// Schema de validação Yup do filtro do relatório "Nutrição/Lote" (F-288,
// esteira 053, TASK-288-FE-01). Mirror ESTRUTURAL de
// `management-batch-report-filter-schema.ts` (F-279) na parte
// `start_date`/`end_date`/`category`/`batch`: `start_date`/`end_date`
// SEMPRE obrigatórios no CLIENTE + `.test('end-date-after-start-date', ...)`
// (mesma correção "SR-02/CL-07" adjudicada pela `_DECISOES-FIDELIDADE-053.md`
// — a API TAMBÉM exige agora via `NutritionConsumptionReportRequest`).
//
// `category`/`batch` são OPCIONAIS, SEM `.test()` condicional entre eles — os
// 2 filtros são independentes (roteiro-front-F288-nutricao.md FID-G3F,
// FM-01/FM-02/CL-10, dimensão "cascatas" = `NAO_APLICAVEL`). Nenhum
// `useEffect` de preenchimento cruzado nesta tela.
//
// `format` é `.required()` via `fieldValidationSchema(...).option<ReportFormat>()`
// (sempre tem valor default `pdf` pré-selecionado no form, `noClearable` no
// Select — mirror `stock-provider-lot-report-filter-schema.ts`, reusando o
// tipo GLOBAL `ReportFormat` de `@/@types/v2/AccountsReports`).
//
// O schema valida a FORMA INTERNA do form (Option-based, react-select), NÃO
// o payload final do service (`NutritionConsumptionReportParams`):
//   category: Option<string> | null
//   batch: Option<string> | null
//   start_date: string | null
//   end_date: string | null
//   format: Option<ReportFormat> | null
// -----------------------------------------------------------------------------

import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

import fieldValidationSchema from '@/validations/field-validation-schema';

import type { LanguageDate } from '@/@types/language';
import type { ReportFormat } from '@/@types/v2/AccountsReports';

const optionSchema = yup
  .object({ value: yup.mixed(), label: yup.string() })
  .nullable()
  .default(null);

export const nutritionConsumptionReportFilterSchema = (languageGB: LanguageDate) => {
  const v = fieldValidationSchema(languageGB);
  const messages = languageGB.nutritionConsumptionReport.report;

  return yup.object({
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
    category: optionSchema,
    batch: optionSchema,
    format: v.option<ReportFormat>(),
  });
};

export const nutritionConsumptionReportFilterSchemaResolver = (languageGB: LanguageDate) =>
  yupResolver(nutritionConsumptionReportFilterSchema(languageGB)) as any;

export default nutritionConsumptionReportFilterSchemaResolver;
