// src/validations/schemas/Relatorios/production-costing-area-report-filter-schema.ts
// -----------------------------------------------------------------------------
// Schema de validação Yup do filtro do relatório "Produção/Custeio/Área"
// (F-298, esteira 051, TASK-298-FE-01). Mirror ESTRUTURAL de
// `food-beat-aggregate-report-filter-schema.ts` (par `start_date`/`end_date`
// SEMPRE obrigatório no CLIENTE + `.test('end-date-after-start-date', ...)`).
//
// `production_cycle`/`areas` são OPCIONAIS, sem `.test()` condicional entre
// eles — o contrato legado (IG-02) não impõe exclusão mútua entre "escolher
// ciclo" e "editar manualmente"; a cascata é UX de conveniência, não regra de
// validação de servidor (roteiro-front-F298 §"Desenho da fatia frontend").
//
// O schema valida a FORMA INTERNA do form (Option-based, react-select), NÃO
// o payload final do service (`ProductionCostingAreaReportParams`):
//   production_cycle: Option<string> | null
//   areas: Option<string>[] | null
//   start_date: string | null
//   end_date: string | null
// -----------------------------------------------------------------------------

import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

import type { LanguageDate } from '@/@types/language';

const optionSchema = yup
  .object({ value: yup.mixed(), label: yup.string() })
  .nullable()
  .default(null);

export const productionCostingAreaReportFilterSchema = (languageGB: LanguageDate) => {
  const messages = languageGB.productionCostingAreaReport.report;

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
    production_cycle: optionSchema,
    areas: yup.array().of(optionSchema).nullable().default(null),
  });
};

export const productionCostingAreaReportFilterSchemaResolver = (languageGB: LanguageDate) =>
  yupResolver(productionCostingAreaReportFilterSchema(languageGB)) as any;

export default productionCostingAreaReportFilterSchemaResolver;
