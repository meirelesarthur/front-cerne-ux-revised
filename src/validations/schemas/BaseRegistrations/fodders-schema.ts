// src/validations/schemas/BaseRegistrations/fodders-schema.ts
// -----------------------------------------------------------------------------
// Schema de validação Yup do formulário de Forragem (TASK-FD-FE-01 — fundação
// compartilhada; USADO de fato só pelo formulário da Tarefa irmã
// TASK-FD-FE-02) — mirror mecânico de
// BaseRegistrations/identificationTypes-schema.ts: FUNÇÃO que recebe
// `languageGB` e devolve o schema (mensagens i18n).
//
// Só 2 campos de negócio, ambos obrigatórios — sem FK, sem `code`. SEM regra
// `unique` para `description` (Fodder-contrato.md §7/DA-FD-13: sem `unique`
// novo em `description`), então nenhum `.test()`/chamada assíncrona é
// adicionada aqui.
// -----------------------------------------------------------------------------

import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

import type { LanguageDate } from '@/@types/language';

export const fodderSchema = (languageGB: LanguageDate) => {
  const messages = languageGB.baseRegistrations.fodder.form.validation;

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
export const fodderSchemaResolver = (languageGB: LanguageDate) =>
  yupResolver(fodderSchema(languageGB));

export default fodderSchemaResolver;
