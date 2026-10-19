// src/validations/schemas/BaseRegistrations/permission-schema.ts
// -----------------------------------------------------------------------------
// Schema de validação Yup do formulário de Permissão — execução 032,
// TASK-FE-2400. Fábrica `(languageGB) => resolver`, mesma convenção de
// `systemUpdate-schema.ts`/`accountingGroupers-schema.ts`.
//
// `name`: obrigatório + `trim` + `max(60)` (contrato de tela §4 — NÃO
// `max(20)` do legado, o limite maior do fork é o correto/mantido).
// `description`: obrigatório + `trim` + `max(191)`.
//
// Schema mais simples da família — sem transform numérico, sem campos
// condicionais (mirror mecânico de outros cadastros de 2 campos texto puro).
// -----------------------------------------------------------------------------

import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

import type { LanguageDate } from '@/@types/language';

export const permissionSchema = (languageGB: LanguageDate) => {
  const messages = languageGB.baseRegistrations.permission.form.validation;

  return yup.object({
    name: yup.string().trim().required(messages.nameRequired).max(60, messages.nameMaxLength),
    description: yup
      .string()
      .trim()
      .required(messages.descriptionRequired)
      .max(191, messages.descriptionMaxLength),
  });
};

/**
 * Resolver pronto para o `useForm({ resolver })`.
 * @param {LanguageDate} languageGB - Pacote de idioma ativo (mensagens de validação i18n).
 * @return {Function} Resolver ligado ao schema do módulo.
 */
export const permissionSchemaResolver = (languageGB: LanguageDate) =>
  yupResolver(permissionSchema(languageGB));

export default permissionSchemaResolver;
