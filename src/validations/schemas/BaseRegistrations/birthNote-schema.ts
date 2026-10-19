// src/validations/schemas/BaseRegistrations/birthNote-schema.ts
// Schema de validação Yup do formulário de Observação Nascimento (só 2 campos,
// sem FK). Fábrica que recebe `languageGB` e devolve o schema.
//
// SEM regra `unique` para `description` — a API explicitamente não valida
// unicidade (BirthNote-contrato §2.1/§9: "sem regra de unicidade — duplicatas
// passam"), então nenhum `.test()`/chamada assíncrona é adicionada aqui.

import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

import fieldValidationSchema from '@/validations/field-validation-schema';

import type { LanguageDate } from '@/@types/language';

export const birthNoteSchema = (languageGB: LanguageDate) => {
  const v = fieldValidationSchema(languageGB);
  const messages = languageGB.baseRegistrations.birthNote.form.validation;

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
export const birthNoteSchemaResolver = (languageGB: LanguageDate) =>
  yupResolver(birthNoteSchema(languageGB));

export default birthNoteSchemaResolver;
