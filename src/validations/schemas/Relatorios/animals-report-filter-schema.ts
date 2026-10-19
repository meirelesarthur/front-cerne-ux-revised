// src/validations/schemas/Relatorios/animals-report-filter-schema.ts
// -----------------------------------------------------------------------------
// Schema de validação Yup do filtro do relatório "Estoque/Rebanho" (F-228,
// execução 97-Esteiras/078, TASK-F228-F02). Mirror ESTRUTURAL de
// `discards-report-filter-schema.ts` — `start_date`/`end_date` OBRIGATÓRIOS
// (fidelidade ao `required` do HTML legado) com `end_date >= start_date`.
//
// FIX GAP-16/item 8 (2026-09, decisão do dono — homologação): `species` é
// array MULTISELECT OBRIGATÓRIO (`min(1)`), fiel ao legado
// (`Form::select('species', ..., ['required' => 'required'])`). O migrado
// deixava vazio = "Todas" e produzia linhas-fantasma de todas as espécies no
// PDF; mirror `array().min(1)` de `equipment_ids` em
// `machines-maintenance-report-filter-schema.ts` (F-276).
// -----------------------------------------------------------------------------

import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

import type { LanguageDate } from '@/@types/language';

const optionSchema = yup.object({ value: yup.mixed(), label: yup.string() });

export const animalsReportFilterSchema = (languageGB: LanguageDate) => {
  const messages = languageGB.animalsReport.report;

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
    species: yup
      .array()
      .of(optionSchema)
      .min(1, messages.validation.speciesRequired)
      .required(messages.validation.speciesRequired),
  });
};

export const animalsReportFilterSchemaResolver = (languageGB: LanguageDate) =>
  yupResolver(animalsReportFilterSchema(languageGB)) as any;

export default animalsReportFilterSchemaResolver;
