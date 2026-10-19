// src/validations/schemas/BaseRegistrations/diagnosticTechnique-schema.ts
// Schema de validação Yup do formulário de Técnica Diagnóstico (só 2 campos,
// sem FK). Fábrica que recebe `languageGB` e devolve o schema — mesmo padrão de
// BaseRegistrations/diagnosisPregnancy-schema.

import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

import fieldValidationSchema from '@/validations/field-validation-schema';

import type { LanguageDate } from '@/@types/language';

export const diagnosticTechniqueSchema = (languageGB: LanguageDate) => {
  const v = fieldValidationSchema(languageGB);
  const messages = languageGB.baseRegistrations.diagnosticTechnique.form.validation;

  return yup.object({
    description: v
      .string()
      .required(messages.descriptionRequired)
      .max(100, messages.descriptionMaxLength),
    is_enabled: v.boolean().required(),
  });
};

/**
 * Resolver pronto para o `useForm({ resolver })`.
 * @param {LanguageDate} languageGB - Pacote de idioma ativo (mensagens de validação i18n).
 * @return {Function} Resolver ligado ao schema do módulo.
 */
export const diagnosticTechniqueSchemaResolver = (languageGB: LanguageDate) =>
  yupResolver(diagnosticTechniqueSchema(languageGB));

export default diagnosticTechniqueSchemaResolver;
