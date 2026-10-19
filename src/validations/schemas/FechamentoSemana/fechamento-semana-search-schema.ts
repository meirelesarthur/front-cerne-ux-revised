// src/validations/schemas/FechamentoSemana/fechamento-semana-search-schema.ts
// -----------------------------------------------------------------------------
// Schema de validação Yup do form de busca de período (Fase 1) da tela de
// Novo Fechamento Semana, TASK-FE-FS-01 (fundação) — mirror ESTRUTURAL EXATO
// de `Carregamentos/charge-report-schema.ts`: espelha
// `ClosingWeekPreviewRequest::rules()` (leitura direta do backend, `app/Http/
// Requests/Api/V1/ClosingWeekPreviewRequest.php`): `start_date`/`end_date`
// ambos `required|date`, `end_date >= start_date` (`after_or_equal:start_date`).
//
// Datas são STRING 'YYYY-MM-DD' via `.matches()` — NUNCA `yup.date()` (mesmo
// racional já documentado em `@/@types/v2/Carregamentos`
// `ChargeReportParams`), mirror literal `charge-report-schema.ts`/
// `BreedingSeasons/breeding-season-schema.ts` (`.test()` de intervalo com
// comparação lexicográfica de strings ISO — válida para ordenação de datas).
// -----------------------------------------------------------------------------

import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

import type { LanguageDate } from '@/@types/language';

const ISO_DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

export const fechamentoSemanaSearchSchema = (languageGB: LanguageDate) => {
  const messages = languageGB.fechamentoSemana.closingWeek.search.validation;

  return yup.object({
    start_date: yup
      .string()
      .nullable()
      .required(messages.startDateRequired)
      .matches(ISO_DATE_REGEX, { message: messages.startDateRequired, excludeEmptyString: true }),
    // Mirror `chargeReportSchema.end_date` — `(value, context)` evita
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

export const fechamentoSemanaSearchSchemaResolver = (languageGB: LanguageDate) =>
  yupResolver(fechamentoSemanaSearchSchema(languageGB));

export default fechamentoSemanaSearchSchemaResolver;
