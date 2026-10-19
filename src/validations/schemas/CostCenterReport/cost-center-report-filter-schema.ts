// src/validations/schemas/CostCenterReport/cost-center-report-filter-schema.ts
// -----------------------------------------------------------------------------
// Schema de validação Yup do filtro do relatório "Centro de Custo" (F-247,
// TASK-052-247-FE-01, esteira 97-Esteiras/052). Mirror ESTRUTURAL de
// `Relatorios/cost-calculation-report-filter-schema.ts` (par `start_date`/
// `end_date` SEMPRE obrigatório, `end_date >= start_date` via `.test()`) +
// `group` obrigatório (`v.option<T>()`, invariante de plataforma DEC-225 §7.1
// que fecha o defeito legado — servidor exige `group`/período).
//
// `accounts`/`proprietary_id`/`center_id`/`farm_id` são OPCIONAIS, sem
// `.test()` de proibição condicional entre si (contrato de tela — nenhum
// campo desta tela restringe outro).
// -----------------------------------------------------------------------------

import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

import fieldValidationSchema from '@/validations/field-validation-schema';

import type { LanguageDate } from '@/@types/language';
import type { CostCenterReportRegime } from '@/@types/v2/CostCenterReport';

const optionSchema = yup
  .object({ value: yup.mixed(), label: yup.string() })
  .nullable()
  .default(null);

export const costCenterReportFilterSchema = (languageGB: LanguageDate) => {
  const v = fieldValidationSchema(languageGB);
  const messages = languageGB.costCenterReport.report;

  return yup.object({
    group: v.option<CostCenterReportRegime>(),
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
    proprietary_id: optionSchema,
    center_id: optionSchema,
    farm_id: optionSchema,
  });
};

export const costCenterReportFilterSchemaResolver = (languageGB: LanguageDate) =>
  yupResolver(costCenterReportFilterSchema(languageGB)) as any;

export default costCenterReportFilterSchemaResolver;
