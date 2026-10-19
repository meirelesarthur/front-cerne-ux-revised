// src/validations/schemas/Relatorios/cost-calculation-report-filter-schema.ts
// -----------------------------------------------------------------------------
// Schema de validação Yup do filtro do relatório "Apuração de Custo" (F-245,
// TASK-245-FE-01, esteira 073). Mirror ESTRUTURAL de
// `src/validations/schemas/Relatorios/paid-interest-report-filter-schema.ts`
// (par `start_date`/`end_date` SEMPRE obrigatório, `end_date >= start_date`
// via `.test()`).
//
// `farm_uuid`, `cost_center_uuids`, `account_uuids` são OPCIONAIS, SEM
// `.test()` de proibição condicional entre si — nenhum campo desta tela
// restringe outro (contrato de tela §2, ausência de cascata JS/AJAX
// confirmada no contrato legado).
//
// O schema valida a FORMA INTERNA do form (Option-based, react-select), NÃO o
// payload final do service (`CostCalculationReportParams`) — mirror
// `optionSchema` de `paid-interest-report-filter-schema.ts`, com a variante em
// array para os 2 campos multiselect (`cost_center_uuids`/`account_uuids`):
//   start_date: string | null
//   end_date: string | null
//   farm_uuid: Option<string> | null
//   cost_center_uuids: Option<string>[] | null
//   account_uuids: Option<string>[] | null
//   order_by: 'asc' | 'desc'
// -----------------------------------------------------------------------------

import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

import type { LanguageDate } from '@/@types/language';

const optionSchema = yup
  .object({ value: yup.mixed(), label: yup.string() })
  .nullable()
  .default(null);

const optionListSchema = yup.array().of(optionSchema).nullable().default(null);

export const costCalculationReportFilterSchema = (languageGB: LanguageDate) => {
  const messages = languageGB.costCalculationReport.report;

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
    farm_uuid: optionSchema,
    cost_center_uuids: optionListSchema,
    account_uuids: optionListSchema,
    order_by: yup.mixed<'asc' | 'desc'>().oneOf(['asc', 'desc']).default('asc'),
  });
};

export const costCalculationReportFilterSchemaResolver = (languageGB: LanguageDate) =>
  yupResolver(costCalculationReportFilterSchema(languageGB)) as any;

export default costCalculationReportFilterSchemaResolver;
