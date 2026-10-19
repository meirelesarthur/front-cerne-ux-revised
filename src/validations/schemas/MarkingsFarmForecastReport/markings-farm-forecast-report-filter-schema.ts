// src/validations/schemas/MarkingsFarmForecastReport/markings-farm-forecast-report-filter-schema.ts
// -----------------------------------------------------------------------------
// Schema de validação Yup do filtro do relatório "Previsão Fazenda/Receita"
// (F-281, execução 055, roteiro-front-F281-prev-fazenda-receita.md
// §3/§6-TASK-01). Mirror ESTRUTURAL de
// `weighing-harvest-report-filter-schema.ts`, DIVERGINDO no essencial: RN-01
// (fiel ao legado) exige TODOS os 6 campos OPCIONAIS — SEM `.required()` em
// nenhum deles, submit vazio gera PDF (mirror `stock-movement-report-
// filter-schema.ts::products`, não o par obrigatório de Pesagens/Colheita).
// `end_date >= start_date` só é reprovado quando AMBOS estão preenchidos
// (mirror do `.test()`, mas sem exigir a ausência). `week` — inteiro 1-53
// (RN-03/CL-007). `year` — inteiro 4 dígitos (D-FRONT-1).
//
// O schema valida a FORMA INTERNA do form (Option-based, react-select para
// `cultivation`/`forecast`), NÃO o payload final do service
// (`MarkingsFarmForecastReportParams`).
// -----------------------------------------------------------------------------

import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

import type { LanguageDate } from '@/@types/language';

const optionSchema = yup
  .object({ value: yup.mixed(), label: yup.string() })
  .nullable()
  .default(null);

export const markingsFarmForecastReportFilterSchema = (languageGB: LanguageDate) => {
  const messages = languageGB.markingsFarmForecastReport.report.validation;

  return yup.object({
    start_date: yup.string().trim().nullable().default(null),
    end_date: yup
      .string()
      .trim()
      .nullable()
      .default(null)
      .test('end-date-after-start-date', messages.periodInvalidRange, (value, context) => {
        const parent = context.parent as { start_date?: string | null };
        const startDate = parent.start_date;
        // Ambos opcionais (RN-01) — só valida a ordem quando os dois estão
        // preenchidos; ausência de qualquer um deles NÃO reprova.
        if (!value || !startDate) return true;
        return value >= startDate;
      }),
    cultivation: optionSchema,
    forecast: optionSchema,
    week: yup
      .number()
      .transform((value, original) => (original === '' || original === null ? null : value))
      .nullable()
      .default(null)
      .typeError(messages.weekInvalid)
      .min(1, messages.weekInvalid)
      .max(53, messages.weekInvalid),
    year: yup
      .number()
      .transform((value, original) => (original === '' || original === null ? null : value))
      .nullable()
      .default(null)
      .typeError(messages.yearInvalid)
      .test('year-4-digits', messages.yearInvalid, (value) => {
        if (value === null || value === undefined) return true;
        return value >= 1000 && value <= 9999;
      }),
  });
};

export const markingsFarmForecastReportFilterSchemaResolver = (languageGB: LanguageDate) =>
  yupResolver(markingsFarmForecastReportFilterSchema(languageGB)) as any;

export default markingsFarmForecastReportFilterSchemaResolver;
