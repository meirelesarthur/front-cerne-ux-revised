// src/validations/schemas/Relatorios/food-beat-aggregate-report-filter-schema.ts
// -----------------------------------------------------------------------------
// Schema de validação Yup do filtro do relatório agregado "Custo Produção
// Batida" (F-267, TASK-267-FE-01, esteira 073). Mirror ESTRUTURAL de
// `paid-interest-report-filter-schema.ts` (par `start_date`/`end_date`
// SEMPRE obrigatório, `end_date >= start_date` via `.test()`), reduzido a
// 3 campos.
//
// `food_uuid` é OPCIONAL, sem `.test()` de proibição condicional com os
// demais campos (contrato de tela §5, sem cascata/condicional no legado).
//
// O schema valida a FORMA INTERNA do form (Option-based, react-select), NÃO
// o payload final do service (`GetFoodBeatAggregatedReportParams`):
//   start_date: string | null
//   end_date: string | null
//   food_uuid: Option<string> | null
// -----------------------------------------------------------------------------

import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

import type { LanguageDate } from '@/@types/language';

const optionSchema = yup
  .object({ value: yup.mixed(), label: yup.string() })
  .nullable()
  .default(null);

export const foodBeatAggregateReportFilterSchema = (languageGB: LanguageDate) => {
  const messages = languageGB.foodBeatAggregateReport.report;

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
    food_uuid: optionSchema,
  });
};

export const foodBeatAggregateReportFilterSchemaResolver = (languageGB: LanguageDate) =>
  yupResolver(foodBeatAggregateReportFilterSchema(languageGB)) as any;

export default foodBeatAggregateReportFilterSchemaResolver;
