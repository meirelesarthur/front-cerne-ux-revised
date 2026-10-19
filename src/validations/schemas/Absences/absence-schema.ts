// src/validations/schemas/Absences/absence-schema.ts
// -----------------------------------------------------------------------------
// Schema de validação Yup do formulário "Registro de Faltas" (Absence —
// Administrativo / Gestão Pessoal), espelhando `AbsenceRequest::rules()`
// (frontend-contract-registro-faltas.md §6): `date` obrigatório, `employee_
// uuid`/`event_uuid` obrigatórios (uuid), `amount` obrigatório numérico
// `>= 0`, `period` opcional (enum como STRING ou vazio).
//
// Vive em `src/validations/schemas/Absences/` (NÃO em `pages/`) — mesmo path
// canônico de `Eventos/evento-schema.ts`/`Advances/advance-schema.ts`.
//
// `date` é STRING 'YYYY-MM-DD' via `.matches()` — NUNCA `yup.date()` (mirror
// `advance-schema.ts`/`ciclo-producao-schema.ts`).
//
// `period` trafega como STRING no RHF (formato do `Select`, mirror
// `EventForm.type`) — opcional, `''` = nenhum período informado (preserva o
// legado); a conversão para `number|null` acontece só no payload
// (`tryPersistAbsence`, checklist item 3 da Tarefa 13).
// -----------------------------------------------------------------------------

import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

import type { LanguageDate } from '@/@types/language';

const ISO_DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const absenceSchema = (languageGB: LanguageDate) => {
  const messages = languageGB.absences.absence.form.validation;

  return yup.object({
    date: yup
      .string()
      .required(messages.dateRequired)
      .matches(ISO_DATE_REGEX, { message: messages.dateRequired, excludeEmptyString: true }),
    employee_uuid: yup
      .string()
      .required(messages.employeeRequired)
      .matches(UUID_REGEX, { message: messages.employeeRequired, excludeEmptyString: true }),
    event_uuid: yup
      .string()
      .required(messages.eventRequired)
      .matches(UUID_REGEX, { message: messages.eventRequired, excludeEmptyString: true }),
    // Opcional — `''` = "Selecione" (nenhum período informado, preserva o
    // legado); quando preenchido, deve ser um dos 3 valores do enum. O
    // `Select` nunca deixa passar um valor fora da lista, mas valida mesmo
    // assim (mesma cautela de `evento-schema.ts` para `type`/`method`).
    period: yup
      .string()
      .oneOf(['', '1', '2', '3'], languageGB.defaltStrings.validations.invalidValue),
    amount: yup
      .number()
      .transform((value, original) => (original === '' || original === null ? undefined : value))
      .typeError(messages.amountRequired)
      .required(messages.amountRequired)
      .min(0, messages.amountRequired),
  });
};

export const absenceSchemaResolver = (languageGB: LanguageDate) =>
  yupResolver(absenceSchema(languageGB));

export default absenceSchemaResolver;
