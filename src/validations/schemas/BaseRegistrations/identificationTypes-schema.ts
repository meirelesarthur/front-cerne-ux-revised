// src/validations/schemas/BaseRegistrations/identificationTypes-schema.ts
// -----------------------------------------------------------------------------
// Schema de validação Yup do formulário de Tipo de Identificação (TASK-FE-039) —
// mirror mecânico de BaseRegistrations/diagnosisPregnancy-schema.ts:
// FUNÇÃO que recebe `languageGB` e devolve o schema (mensagens i18n).
//
// Só 2 campos de negócio, ambos obrigatórios — sem FK, sem `code`. SEM regra
// `unique` para `description` — a API explicitamente não valida unicidade
// (Doc Bruta §5/§10, contrato §7 do backend: "description duplicada
// permitida"), então nenhum `.test()`/chamada assíncrona é adicionada aqui.
// -----------------------------------------------------------------------------

import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

import type { LanguageDate } from '@/@types/language';

export const identificationTypesSchema = (languageGB: LanguageDate) => {
  const messages = languageGB.baseRegistrations.identificationType.form.validation;

  return yup.object({
    description: yup
      .string()
      .trim()
      .required(messages.descriptionRequired)
      .max(100, messages.descriptionMaxLength),
    is_enabled: yup.boolean().required(),
  });
};

/**
 * Resolver pronto para o `useForm({ resolver })`.
 * @param {LanguageDate} languageGB - Pacote de idioma ativo (mensagens de validação i18n).
 * @return {Function} Resolver ligado ao schema do módulo.
 */
export const identificationTypesSchemaResolver = (languageGB: LanguageDate) =>
  yupResolver(identificationTypesSchema(languageGB));

export default identificationTypesSchemaResolver;
