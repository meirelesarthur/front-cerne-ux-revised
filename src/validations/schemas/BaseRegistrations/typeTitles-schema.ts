// src/validations/schemas/BaseRegistrations/typeTitles-schema.ts
// -----------------------------------------------------------------------------
// Schema de validação Yup do formulário de Tipo de Título (TypeTitle) — FUNÇÃO
// que recebe `languageGB` e devolve o resolver (mensagens i18n), igual à
// referência BaseRegistrations/diagnosisPregnancy-schema.ts.
//
// `description` obrigatório/trim/máx 100 (TypeTitleRequest::rules()).
// `type`/`factor`: o Select do RHF guarda STRING ('1'|'2'|'3'/'1'|'2') — o
// schema aqui só garante "não vazio" (presença); o `Rule::in(...)` real já é
// validado no backend contra o Enum (TypeTitleType/TypeTitleFactor).
// `is_enabled` boolean obrigatório.
// -----------------------------------------------------------------------------

import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

import type { LanguageDate } from '@/@types/language';

export const typeTitlesSchema = (languageGB: LanguageDate) => {
  const messages = languageGB.baseRegistrations.typeTitle.form.validation;

  return yup.object({
    description: yup
      .string()
      .trim()
      .required(messages.descriptionRequired)
      .max(100, messages.descriptionMaxLength),
    type: yup.string().required(messages.typeRequired),
    factor: yup.string().required(messages.factorRequired),
    is_enabled: yup.boolean().required(),
  });
};

/**
 * Resolver pronto para o `useForm({ resolver })`.
 * @param {LanguageDate} languageGB - Pacote de idioma ativo (mensagens de validação i18n).
 * @return {Function} Resolver ligado ao schema do módulo.
 */
export const typeTitlesSchemaResolver = (languageGB: LanguageDate) =>
  yupResolver(typeTitlesSchema(languageGB));

export default typeTitlesSchemaResolver;
