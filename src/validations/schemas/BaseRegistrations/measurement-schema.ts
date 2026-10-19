// src/validations/schemas/BaseRegistrations/measurement-schema.ts
// -----------------------------------------------------------------------------
// Schema de validação Yup do formulário de Un. de Medida (TASK-FE-055) —
// mirror mecânico de CadastrosBase/TiposIdentificacao/identification-type-schema.ts:
// FUNÇÃO que recebe `languageGB` e devolve o schema (mensagens i18n).
//
// Só 2 campos de negócio, ambos obrigatórios — sem FK, sem status/ativo
// (Measurement não tem `is_enabled`). `name` (Sigla) é `max:8` — bem mais
// curto que qualquer outro campo "sigla-like" do projeto; `description` é
// `max:100`, igual ao resto dos catálogos simples.
// -----------------------------------------------------------------------------

import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

import type { LanguageDate } from '@/@types/language';

export const measurementSchema = (languageGB: LanguageDate) => {
  const messages = languageGB.baseRegistrations.measurement.form.validation;

  return yup.object({
    name: yup.string().trim().required(messages.nameRequired).max(8, messages.nameMaxLength),
    description: yup
      .string()
      .trim()
      .required(messages.descriptionRequired)
      .max(100, messages.descriptionMaxLength),
  });
};

/**
 * Resolver pronto para o `useForm({ resolver })`.
 * @param {LanguageDate} languageGB - Pacote de idioma ativo (mensagens de validação i18n).
 * @return {Function} Resolver ligado ao schema do módulo.
 */
export const measurementSchemaResolver = (languageGB: LanguageDate) =>
  yupResolver(measurementSchema(languageGB));

export default measurementSchemaResolver;
