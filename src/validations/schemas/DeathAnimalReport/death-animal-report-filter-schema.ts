// src/validations/schemas/DeathAnimalReport/death-animal-report-filter-schema.ts
// -----------------------------------------------------------------------------
// Schema de validação Yup do filtro do relatório "Mortes" (F-254, esteira
// 97-Esteiras/077). Mirror ESTRUTURAL EXATO de
// `stock-abc-report-filter-schema.ts` (F-322, mesma esteira): `start_date`/
// `end_date` usam `fieldValidationSchema(languageGB).date()` (REQUIRED por
// padrão, string ISO 'yyyy-MM-dd'), `end_date` valida
// `end-date-after-start-date` comparando com `start_date` — reforça o
// `after_or_equal:start_date` do `FormRequest` planejado
// (`F-254-plano-api.md §4.5`).
// -----------------------------------------------------------------------------

import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

import fieldValidationSchema from '@/validations/field-validation-schema';

import type { LanguageDate } from '@/@types/language';
import type { DeathAnimalReportFormat } from '@/@types/v2/DeathAnimalReport';

export const deathAnimalReportFilterSchema = (languageGB: LanguageDate) => {
  const v = fieldValidationSchema(languageGB);
  const messages = languageGB.deathAnimalReport.report;

  return yup.object({
    start_date: v.date(),
    end_date: v
      .date()
      .test(
        'end-date-after-start-date',
        messages.validation.endDateBeforeStartDate,
        (value, context) => {
          const parent = context.parent as { start_date?: string | null };
          const startDate = parent.start_date;
          if (!value || !startDate) return true; // ambas required — guarda contra estado transitório
          return value >= startDate;
        }
      ),
    format: v.option<DeathAnimalReportFormat>(),
  });
};

export const deathAnimalReportFilterSchemaResolver = (languageGB: LanguageDate) =>
  yupResolver(deathAnimalReportFilterSchema(languageGB)) as any;

export default deathAnimalReportFilterSchemaResolver;
