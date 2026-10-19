// src/validations/schemas/BaseRegistrations/productGroups-schema.ts
// -----------------------------------------------------------------------------
// Schema de validação Yup do formulário de Grupo de Produto (TASK-GRP-02) —
// mirror mecânico de Racas/breed-schema.ts / CentroCusto/centro-custo-schema.ts:
// FUNÇÃO que recebe `languageGB` e devolve o schema (mensagens i18n).
//
// `is_enabled` guarda o Option `{ label, value }` inteiro (Select Ativo/
// Inativo, não um Switch) — validado com `.required()` (o backend rejeita
// `null`/ausente com 422, `GroupProductRequest`: `is_enabled` é `required`
// tanto no create quanto no update).
// -----------------------------------------------------------------------------

import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

import type { LanguageDate } from '@/@types/language';

export const productGroupsSchema = (languageGB: LanguageDate) => {
  const messages = languageGB.productGroups.productGroup.form.validation;

  return yup.object({
    description: yup
      .string()
      .trim()
      .required(messages.descriptionRequired)
      .max(100, messages.descriptionMaxLength),
    is_enabled: yup.mixed().required(messages.isEnabledRequired),
  });
};

/**
 * Resolver pronto para o `useForm({ resolver })`.
 * @param {LanguageDate} languageGB - Pacote de idioma ativo (mensagens de validação i18n).
 * @return {Function} Resolver ligado ao schema do módulo.
 */
export const productGroupsSchemaResolver = (languageGB: LanguageDate) =>
  yupResolver(productGroupsSchema(languageGB));

export default productGroupsSchemaResolver;
