// src/validations/schemas/BaseRegistrations/lowReasons-schema.ts
// -----------------------------------------------------------------------------
// Schema de validação Yup do formulário de Motivo de Baixa (LowReason) —
// mirror mecânico de BaseRegistrations/diagnosisPregnancy-schema.ts: FUNÇÃO
// que recebe `languageGB` e devolve o schema (mensagens i18n), compondo a
// partir de `fieldValidationSchema`.
//
// `description` obrigatório/trim/máx 100 (LowReasonRequest.rules()).
// `do_movement`/`is_enabled` boolean obrigatórios (Select Chakra, valor
// convertido para boolean puro no onChange do form).
//
// `code` NÃO entra neste schema — é gerado no servidor (DA-LR-16) e nunca é
// submetido.
// -----------------------------------------------------------------------------

import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

import fieldValidationSchema from '@/validations/field-validation-schema';

import type { LanguageDate } from '@/@types/language';

export const lowReasonsSchema = (languageGB: LanguageDate) => {
  const v = fieldValidationSchema(languageGB);
  const messages = languageGB.baseRegistrations.lowReason.form.validation;

  return yup.object({
    description: v
      .string()
      .required(messages.descriptionRequired)
      .max(100, messages.descriptionMaxLength),
    do_movement: v.boolean().required(),
    is_enabled: v.boolean().required(),
  });
};

/**
 * Resolver pronto para o `useForm({ resolver })`.
 * @param {LanguageDate} languageGB - Pacote de idioma ativo (mensagens de validação i18n).
 * @return {Function} Resolver ligado ao schema do módulo.
 */
export const lowReasonsSchemaResolver = (languageGB: LanguageDate) =>
  yupResolver(lowReasonsSchema(languageGB));

export default lowReasonsSchemaResolver;
