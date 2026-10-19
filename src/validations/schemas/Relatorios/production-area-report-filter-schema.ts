// src/validations/schemas/Relatorios/production-area-report-filter-schema.ts
// -----------------------------------------------------------------------------
// Schema de validação Yup do filtro "Prod./Área" (F-299, 97-Esteiras/012,
// Tarefa 47). Mirror ESTRUTURAL de
// `cost-calculation-report-filter-schema.ts` (par `start_date`/`end_date`
// sempre obrigatório, `end_date >= start_date` via `.test()`). Este fork usa
// yup 0.32.11 + `yupResolver` — não zod (contrato de tela §9.3).
//
// `production_cycle` e `area_uuids` são OPCIONAIS — a autoridade final do
// período continua sendo o `422` do servidor (`after_or_equal:start_date`).
// -----------------------------------------------------------------------------

import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

import type { LanguageDate } from '@/@types/language';

const optionSchema = yup
  .object({ value: yup.mixed(), label: yup.string() })
  .nullable()
  .default(null);

export const productionAreaReportFilterSchema = (languageGB: LanguageDate) => {
  const messages = languageGB.productionAreaReport.report;

  return yup.object({
    production_cycle: optionSchema,
    area_uuids: yup.array().of(yup.string().required()).nullable().default([]),
    start_date: yup.string().trim().nullable().required(messages.validation.periodRequired),
    end_date: yup
      .string()
      .trim()
      .nullable()
      .required(messages.validation.periodRequired)
      .test(
        'end-date-after-start-date',
        messages.validation.endDateBeforeStart,
        (value, context) => {
          const parent = context.parent as { start_date?: string | null };
          const startDate = parent.start_date;
          if (!value || !startDate) return true;
          return value >= startDate;
        }
      ),
  });
};

export const productionAreaReportFilterSchemaResolver = (languageGB: LanguageDate) =>
  yupResolver(productionAreaReportFilterSchema(languageGB)) as any;

export default productionAreaReportFilterSchemaResolver;
