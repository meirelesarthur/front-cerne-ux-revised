// src/validations/schemas/AnimalsSaleReport/animals-sale-report-filter-schema.ts
// -----------------------------------------------------------------------------
// Schema de validação Yup do filtro do relatório "Vendas/Animais" (F-227,
// esteira 97-Esteiras/077). Mirror ESTRUTURAL de
// `category-animal-report-filter-schema.ts`, mas os 3 selects de lookup
// (`sale_id`/`batch_id`/`client_uuid`) são TODOS opcionais e SEM cascata
// entre si — fiel ao legado (`cascatas: NAO_APLICAVEL`).
//
// NÃO usar `fieldValidationSchema(languageGB).option<T>()` nestes 3 campos —
// `field-validation-schema.ts` confirma que `.option()` é SEMPRE
// `.required()` (`.nullable().required(...)`), o que bloquearia o submit sem
// seleção. Usa-se `yup.object({label,value}).nullable().default(null)`
// inline. Só `format` usa `v.option<AnimalsSaleReportFormat>()` — sempre tem
// valor default (`pdf`), mirror `CategoryAnimalReport`.
//
// Datas OPCIONAIS e DECORATIVAS (CLM-04: zero validação server-side, zero
// required) — mantém uma validação leve `end_date >= start_date` só quando
// ambas preenchidas (melhoria não-bloqueante, nunca bloqueia submit por
// ausência).
// -----------------------------------------------------------------------------

import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

import fieldValidationSchema from '@/validations/field-validation-schema';

import type { LanguageDate } from '@/@types/language';
import type { AnimalsSaleReportFormat } from '@/@types/v2/AnimalsSaleReport';

// Select opcional — `Option<T> = {label, value}` OU `null`. NUNCA
// `v.option()` (sempre required por definição, ver nota de cabeçalho).
const optionalOption = () =>
  yup
    .object({
      label: yup.string(),
      value: yup.mixed(),
    })
    .nullable()
    .default(null);

export const animalsSaleReportFilterSchema = (languageGB: LanguageDate) => {
  const v = fieldValidationSchema(languageGB);
  const messages = languageGB.animalsSaleReport.report;

  return yup.object({
    sale_id: optionalOption(),
    batch_id: optionalOption(),
    client_uuid: optionalOption(),
    start_date: yup.string().trim().nullable().default(null),
    end_date: yup
      .string()
      .trim()
      .nullable()
      .default(null)
      .test(
        'end-date-after-start-date',
        messages.validation.endDateBeforeStartDate,
        (value, context) => {
          const parent = context.parent as { start_date?: string | null };
          const startDate = parent.start_date;
          if (!value || !startDate) return true; // ambas opcionais — só valida quando as 2 existem
          return value >= startDate;
        }
      ),
    format: v.option<AnimalsSaleReportFormat>(), // ÚNICO campo required (sempre tem default)
  });
};

export const animalsSaleReportFilterSchemaResolver = (languageGB: LanguageDate) =>
  yupResolver(animalsSaleReportFilterSchema(languageGB)) as any;

export default animalsSaleReportFilterSchemaResolver;
