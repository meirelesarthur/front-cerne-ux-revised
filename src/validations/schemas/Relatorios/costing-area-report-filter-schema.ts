// src/validations/schemas/Relatorios/costing-area-report-filter-schema.ts
// -----------------------------------------------------------------------------
// Schema de validação Yup do filtro do relatório "Custeio/Área" (F-252,
// esteira 079, TASK-252-FE-01). Mirror EXATO de
// `production-costing-area-report-filter-schema.ts` (F-298) — par
// `start_date`/`end_date` SEMPRE obrigatório no CLIENTE +
// `.test('end-date-after-start-date', ...)`.
//
// `production_cycle`/`areas` são OPCIONAIS, sem `.test()` condicional entre
// eles — o contrato legado (IG-02) não impõe exclusão mútua entre "escolher
// ciclo" e "editar manualmente"; a cascata é UX de conveniência, não regra de
// validação de servidor.
//
// O schema valida a FORMA INTERNA do form (Option-based, react-select), NÃO
// o payload final do service (`CostingAreaReportParams`):
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

export const costingAreaReportFilterSchema = (languageGB: LanguageDate) => {
  const messages = languageGB.costingAreaReport.report;

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

export const costingAreaReportFilterSchemaResolver = (languageGB: LanguageDate) =>
  yupResolver(costingAreaReportFilterSchema(languageGB)) as any;

export default costingAreaReportFilterSchemaResolver;
