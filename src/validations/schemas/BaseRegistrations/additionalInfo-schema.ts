// src/validations/schemas/BaseRegistrations/additionalInfo-schema.ts
// -----------------------------------------------------------------------------
// Schema de validação Yup do formulário de Informação Complementar
// (TASK-AI-04) — mirror mecânico de
// CadastrosBase/MotivosBaixa/motivo-baixa-schema.ts: FUNÇÃO que recebe
// `languageGB` e devolve o schema (mensagens i18n).
//
// `description` obrigatório/trim/máx 100. `info` obrigatório/trim/máx 1000
// (AdditionalInfoRequest.rules()). `is_active` boolean obrigatório (Select
// Chakra, valor convertido para boolean puro no onChange do form).
// -----------------------------------------------------------------------------

import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

import type { LanguageDate } from '@/@types/language';

export const additionalInfoSchema = (languageGB: LanguageDate) => {
  const messages = languageGB.baseRegistrations.additionalInfo.form.validation;

  return yup.object({
    description: yup
      .string()
      .trim()
      .required(messages.descriptionRequired)
      .max(100, messages.descriptionMaxLength),
    info: yup.string().trim().required(messages.infoRequired).max(1000, messages.infoMaxLength),
    is_active: yup.boolean().required(),
  });
};

/**
 * Resolver pronto para o `useForm({ resolver })`.
 * @param {LanguageDate} languageGB - Pacote de idioma ativo (mensagens de validação i18n).
 * @return {Function} Resolver ligado ao schema do módulo.
 */
export const additionalInfoSchemaResolver = (languageGB: LanguageDate) =>
  yupResolver(additionalInfoSchema(languageGB));

export default additionalInfoSchemaResolver;
