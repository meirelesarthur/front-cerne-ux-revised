// src/validations/schemas/Relatorios/products-exit-cost-center-report-filter-schema.ts
// -----------------------------------------------------------------------------
// Schema de validação Yup do filtro do relatório "Saídas x Centro Custo"
// (F-301, execução 97-Esteiras/078, TASK-F301-F02). Mirror ESTRUTURAL de
// `savings-report-filter-schema.ts` — `start_date`/`end_date` OBRIGATÓRIOS
// (fidelidade ao legado, LAC-01) com `end_date >= start_date`; `center`/
// `warehouse`/`product` opcionais (`optionSchema.notRequired()`).
// -----------------------------------------------------------------------------

import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

import type { LanguageDate } from '@/@types/language';

const optionSchema = yup
  .object({ value: yup.mixed(), label: yup.string() })
  .nullable()
  .default(null);

export const productsExitCostCenterReportFilterSchema = (languageGB: LanguageDate) => {
  const messages = languageGB.productsExitCostCenterReport.report;

  return yup.object({
    start_date: yup.string().trim().nullable().required(messages.validation.periodRequired),
    end_date: yup
      .string()
      .trim()
      .nullable()
      .required(messages.validation.periodRequired)
      .test(
        'end-date-after-start-date',
        messages.validation.endDateAfterStartDate,
        (value, context) => {
          const parent = context.parent as { start_date?: string | null };
          const startDate = parent.start_date;
          if (!value || !startDate) return true;
          return value >= startDate;
        }
      ),
    center: optionSchema.notRequired(),
    warehouse: optionSchema.notRequired(),
    product: optionSchema.notRequired(),
  });
};

export const productsExitCostCenterReportFilterSchemaResolver = (languageGB: LanguageDate) =>
  yupResolver(productsExitCostCenterReportFilterSchema(languageGB)) as any;

export default productsExitCostCenterReportFilterSchemaResolver;
