// src/validations/schemas/Configuracoes/help-schema.ts
// -----------------------------------------------------------------------------
// Schema de validação Yup do formulário "Tutoriais" (Help — TASK-HP-06).
// Vive em `src/validations/schemas/` (NUNCA em `pages/`) — mirror estrutural
// de `animal-schema.ts`/`equipment-schema.ts` (fábrica que recebe
// `languageGB` e devolve o schema).
//
// Mensagens SEMPRE derivadas de `fieldValidationSchema(languageGB)` (fonte
// única de `languageGB.defaltStrings.validations.*`) — instrução explícita
// do task-packet desta Tarefa. NUNCA string literal.
//
// `url`: obrigatória, formato de URL, máx. 100 chars (Help-contrato §4.2:
// `HelpRequest::rules()` → `['required','string','max:100','url']`).
// `permission`: Select do lookup de telas — Option OBRIGATÓRIO (não string),
// via `fv.option()` (já é `object().nullable().required()`).
// -----------------------------------------------------------------------------

import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

import fieldValidationSchema from '@/validations/field-validation-schema';

import type { LanguageDate } from '@/@types/language';

export const helpSchema = (languageGB: LanguageDate) => {
  const fv = fieldValidationSchema(languageGB);
  const messages = languageGB.defaltStrings.validations;

  return yup.object({
    url: fv.string().max(100, messages.invalidValue).url(messages.invalidValue),
    permission: fv.option(),
  });
};

/**
 * Resolver pronto para o `useForm({ resolver })`.
 * @param {LanguageDate} languageGB - Pacote de idioma ativo (mensagens de validação i18n).
 * @return {Function} Resolver ligado ao schema do módulo.
 */
export const helpSchemaResolver = (languageGB: LanguageDate) =>
  yupResolver(helpSchema(languageGB) as any);

export default helpSchemaResolver;
