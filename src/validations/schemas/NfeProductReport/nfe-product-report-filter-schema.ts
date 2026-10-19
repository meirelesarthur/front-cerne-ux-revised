// src/validations/schemas/NfeProductReport/nfe-product-report-filter-schema.ts
// -----------------------------------------------------------------------------
// Schema de validação Yup do filtro do relatório "Faturamento" (F-286,
// esteira 97-Esteiras/054, TASK-054-286-FE-01). Mirror ESTRUTURAL de
// `machines-report-filter-schema.ts` (par `start_date`/`end_date` sempre
// obrigatório via `fieldValidationSchema(languageGB).date()`, mensagem
// PRÓPRIA do módulo para `end_date >= start_date` via `.test()`).
//
// Diferente da irmã Máquinas: NENHUM dos 4 filtros restantes (`client_ids`,
// `farm_ids`, `product_ids`, `issuer_id`) é obrigatório —
// `NfeProductReportRequest` só exige `start_date`/`end_date` (roteiro-api-
// F286 §3) — por isso nenhum `.min(1)` nos arrays, mirror do racional já
// aplicado a `farm_ids` em `machines-report-filter-schema.ts`.
// -----------------------------------------------------------------------------

import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

import fieldValidationSchema from '@/validations/field-validation-schema';

import type { LanguageDate } from '@/@types/language';
import type { NfeProductReportType } from '@/@types/v2/NfeProductReport';

const optionSchema = yup
  .object({ value: yup.mixed(), label: yup.string() })
  .nullable()
  .default(null);

export const nfeProductReportFilterSchema = (languageGB: LanguageDate) => {
  const v = fieldValidationSchema(languageGB);
  const messages = languageGB.nfeProductReport.report;

  return yup.object({
    start_date: v.date(),
    end_date: v.date().test(
      'end-date-after-start-date',
      messages.validation.endDateBeforeStartDate,
      (value, context) => {
        const parent = context.parent as { start_date?: string | null };
        if (!value || !parent.start_date) return true;
        return value >= parent.start_date;
      }
    ),
    client_ids: yup.array(yup.string().required()).default([]),
    farm_ids: yup.array(yup.string().required()).default([]),
    product_ids: yup.array(yup.string().required()).default([]),
    issuer_id: optionSchema,
    type: v.option<NfeProductReportType>(),
  });
};

export const nfeProductReportFilterSchemaResolver = (languageGB: LanguageDate) =>
  yupResolver(nfeProductReportFilterSchema(languageGB)) as any;

export default nfeProductReportFilterSchemaResolver;
