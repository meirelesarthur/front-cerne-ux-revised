// src/validations/schemas/BaseRegistrations/categoryTypes-schema.ts
// Schema de validação Yup do formulário de Tipo de Categoria (CategoryType —
// Cadastros Base / Financeiros). Só 2 campos, sem FK. Fábrica que recebe
// `languageGB` e devolve o resolver — mesmo padrão de diagnosisPregnancy-schema.
//
// `description` obrigatório/máx 100 + `is_enabled` boolean obrigatório —
// espelha `CategoryTypeRequest::rules()` (api_root), que não distingue verbo
// (store/update exigem os 2 campos sempre).

import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

import fieldValidationSchema from '@/validations/field-validation-schema';

import type { LanguageDate } from '@/@types/language';

export const categoryTypesSchema = (languageGB: LanguageDate) => {
  const v = fieldValidationSchema(languageGB);
  const messages = languageGB.baseRegistrations.categoryType.form.validation;

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
export const categoryTypesSchemaResolver = (languageGB: LanguageDate) =>
  yupResolver(categoryTypesSchema(languageGB));

export default categoryTypesSchemaResolver;
