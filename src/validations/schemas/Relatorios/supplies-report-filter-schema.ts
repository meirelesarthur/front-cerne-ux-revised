// src/validations/schemas/Relatorios/supplies-report-filter-schema.ts
// -----------------------------------------------------------------------------
// Schema de validação Yup do filtro do relatório "Suprimentos" (F-325,
// execução CORE_WORKSPACE/97-Esteiras/015, Tarefa 52). Mirror ESTRUTURAL de
// `savings-report-filter-schema.ts` — DIFERENÇA DELIBERADA: os 8 campos são
// TODOS opcionais (Riscos #4 da Tarefa 52 — nenhum campo obrigatório, nenhum
// `disabled` de período nos botões). Única regra cruzada: `end_date >=
// start_date` SOMENTE quando ambos preenchidos (mirror a regra condicional
// `after_or_equal:start_date` do backend).
// -----------------------------------------------------------------------------

import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

import type { LanguageDate } from '@/@types/language';

const optionSchema = yup
  .object({ value: yup.mixed(), label: yup.string() })
  .nullable()
  .default(null);

export const suppliesReportFilterSchema = (languageGB: LanguageDate) => {
  const messages = languageGB.suppliesReport.report.validation;

  return yup.object({
    farm_uuid: optionSchema.notRequired(),
    user_uuid: optionSchema.notRequired(),
    authorizer_uuid: optionSchema.notRequired(),
    status: optionSchema.notRequired(),
    priority: optionSchema.notRequired(),
    number: yup.string().trim().nullable().notRequired(),
    start_date: yup.string().trim().nullable().notRequired(),
    end_date: yup
      .string()
      .trim()
      .nullable()
      .notRequired()
      .test('end-date-after-start-date', messages.endDateAfterStartDate, (value, context) => {
        const parent = context.parent as { start_date?: string | null };
        const startDate = parent.start_date;
        if (!value || !startDate) return true;
        return value >= startDate;
      }),
  });
};

export const suppliesReportFilterSchemaResolver = (languageGB: LanguageDate) =>
  yupResolver(suppliesReportFilterSchema(languageGB)) as any;

export default suppliesReportFilterSchemaResolver;
