// src/validations/schemas/Carregamentos/charge-report-schema.ts
// -----------------------------------------------------------------------------
// Schema de validação Yup dos 2 relatórios PDF de Carregamentos (por
// produto/semanal), TASK-FE-CG-07 — espelha `ChargeReportRequest::rules()`
// (leitura direta do backend, `app/Http/Requests/Api/V1/ChargeReportRequest.php`):
// `start_date`/`end_date` ambos `required|date`, `end_date >=
// start_date` (`after_or_equal:start_date`).
//
// Datas são STRING 'YYYY-MM-DD' via `.matches()` — NUNCA `yup.date()`
// (mesmo racional já documentado em `@/@types/v2/Carregamentos`
// `ChargeReportParams`/`ChargeDocumentForm.date`), mirror literal
// `BreedingSeasons/breeding-season-schema.ts` (`.test()` de intervalo com
// comparação lexicográfica de strings ISO — válida para ordenação de
// datas).
// -----------------------------------------------------------------------------

import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

import type { LanguageDate } from '@/@types/language';

const ISO_DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

export const chargeReportSchema = (languageGB: LanguageDate) => {
  const messages = languageGB.carregamentos.charge.reports.validation;

  return yup.object({
    start_date: yup
      .string()
      .nullable()
      .required(messages.startDateRequired)
      .matches(ISO_DATE_REGEX, { message: messages.startDateRequired, excludeEmptyString: true }),
    // Mirror `breedingSeasonSchema.end_date` — `(value, context)` evita
    // `function(){ this.parent }` (no-invalid-this).
    end_date: yup
      .string()
      .nullable()
      .required(messages.endDateRequired)
      .matches(ISO_DATE_REGEX, { message: messages.endDateRequired, excludeEmptyString: true })
      .test('end-date-not-before-start-date', messages.endDateBeforeStartDate, (value, context) => {
        const startDate = (context?.parent as { start_date?: string } | undefined)?.start_date;
        if (!value || !startDate) return true;
        return value >= startDate;
      }),
  });
};

export const chargeReportSchemaResolver = (languageGB: LanguageDate) =>
  yupResolver(chargeReportSchema(languageGB));

export default chargeReportSchemaResolver;
