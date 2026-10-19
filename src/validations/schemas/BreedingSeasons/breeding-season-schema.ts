// src/validations/schemas/BreedingSeasons/breeding-season-schema.ts
// -----------------------------------------------------------------------------
// Schema de validação Yup do formulário "Estação de Monta" (BreedingSeason —
// Operacional / Reprodução, Tarefa 13), espelhando `BreedingSeasonRequest::
// rules()` (contrato de API §6): `date`/`description`/`start_date`/
// `end_date` obrigatórios.
//
// `end_date` ganha uma regra ADICIONAL, exclusiva da SPA
// (`GAP-ESTACAOMONTA-FE-06`, decisão do dono): deve ser `>= start_date`,
// bloqueando o submit com erro de campo real. O backend (`GAP-EM-08`)
// continua SEM essa validação — assimetria consciente, não replicar lá sem
// nova decisão explícita.
//
// Datas são STRING 'YYYY-MM-DD' via `.matches()` — NUNCA `yup.date()`
// (mirror `absence-schema.ts`). Comparação lexicográfica de strings ISO
// `yyyy-MM-dd` é válida para ordenação de datas.
// -----------------------------------------------------------------------------

import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

import type { LanguageDate } from '@/@types/language';

const ISO_DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

export const breedingSeasonSchema = (languageGB: LanguageDate) => {
  const messages = languageGB.breedingSeasons.breedingSeason.form.validation;

  return yup.object({
    date: yup
      .string()
      .required(messages.dateRequired)
      .matches(ISO_DATE_REGEX, { message: messages.dateRequired, excludeEmptyString: true }),
    description: yup.string().required(messages.descriptionRequired),
    start_date: yup
      .string()
      .required(messages.startDateRequired)
      .matches(ISO_DATE_REGEX, { message: messages.startDateRequired, excludeEmptyString: true }),
    // `GAP-ESTACAOMONTA-FE-06` — bloqueio real de submit quando
    // `end_date < start_date` (comparação lexicográfica de strings ISO).
    // `(value, context)` — mirror `food-beat-schema.ts` (`provider_lot`/
    // `shelf_life`), evita `function(){ this.parent }` (no-invalid-this).
    end_date: yup
      .string()
      .required(messages.endDateRequired)
      .matches(ISO_DATE_REGEX, { message: messages.endDateRequired, excludeEmptyString: true })
      .test('end-date-not-before-start-date', messages.endDateBeforeStartDate, (value, context) => {
        const startDate = (context?.parent as { start_date?: string } | undefined)?.start_date;
        if (!value || !startDate) return true;
        return value >= startDate;
      }),
  });
};

export const breedingSeasonSchemaResolver = (languageGB: LanguageDate) =>
  yupResolver(breedingSeasonSchema(languageGB));

export default breedingSeasonSchemaResolver;
