// src/validations/schemas/Relatorios/Agricultura/appropriation-occurrence-report-filter-schema.ts
// -----------------------------------------------------------------------------
// Schema de validação Yup do filtro do relatório "Ocorrências Talhões" (F-232,
// Tarefa 50, esteira CORE_WORKSPACE/97-Esteiras/015). Mirror ESTRUTURAL de
// `received-interest-report-filter-schema.ts` (datas OBRIGATÓRIAS + ordem via
// `.test()`, contrato de tela §6).
//
// `area_uuids` valida a FORMA INTERNA do form (`Select multiple` → `Option[]`,
// mirror `marking-forecast-area-report-filter-schema.ts::optionListSchema`),
// NÃO o payload final do service (`AppropriationOccurrenceReportParams`, que
// recebe `string[]` já achatado em `buildParams()`).
//
// O schema valida a FORMA INTERNA do form (Option-based, react-hook-form):
//   production_cycle_uuid: Option<string> | null  (opcional, JS-only)
//   area_uuids: Option<string>[] | null            (opcional)
//   start_date: string | null                      (OBRIGATÓRIO)
//   end_date: string | null                        (OBRIGATÓRIO; >= start_date)
// -----------------------------------------------------------------------------

import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

import type { LanguageDate } from '@/@types/language';

const optionSchema = yup
  .object({ value: yup.mixed(), label: yup.string() })
  .nullable()
  .default(null);

const optionListSchema = yup.array().of(optionSchema).nullable().default(null);

export const appropriationOccurrenceReportFilterSchema = (languageGB: LanguageDate) => {
  const messages = languageGB.appropriationOccurrenceReport.report;

  return yup.object({
    production_cycle_uuid: optionSchema,
    area_uuids: optionListSchema,
    start_date: yup.string().trim().nullable().required(messages.validation.periodRequired),
    end_date: yup
      .string()
      .trim()
      .nullable()
      .required(messages.validation.periodRequired)
      .test('end-date-after-start-date', messages.validation.periodOrder, (value, context) => {
        const parent = context.parent as { start_date?: string | null };
        const startDate = parent.start_date;
        if (!value || !startDate) return true;
        return value >= startDate;
      }),
  });
};

export const appropriationOccurrenceReportFilterSchemaResolver = (languageGB: LanguageDate) =>
  yupResolver(appropriationOccurrenceReportFilterSchema(languageGB)) as any;

export default appropriationOccurrenceReportFilterSchemaResolver;
