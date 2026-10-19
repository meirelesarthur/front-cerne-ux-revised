// src/pages/CadastrosBase/Operacoes/operation-schema.ts
// -----------------------------------------------------------------------------
// Schema de validação Yup do formulário de Operação (TASK-FE-043) — mirror
// mecânico de Atividades/activity-schema.ts: FUNÇÃO que recebe `languageGB` e
// devolve o schema (mensagens i18n).
//
// `grouper_uuid` NÃO entra na validação Yup (campo opcional, sem regra
// própria — mesma ausência de regra Yup para `specie_uuid` opcional em telas
// equivalentes; a obrigatoriedade quando aplicável é 100% do backend/
// `Rule::exists`).
// -----------------------------------------------------------------------------

import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

import type { LanguageDate } from '@/@types/language';

export const operationSchema = (languageGB: LanguageDate) => {
  const messages = languageGB.operations.operation.form.validation;

  return yup.object({
    name: yup.string().trim().required(messages.nameRequired).max(30, messages.nameMaxLength),
    description: yup.string().trim().max(50, messages.descriptionMaxLength).optional(),
    order: yup.number().typeError(messages.orderRequired).required(messages.orderRequired),
    use: yup.string().required(messages.useRequired),
    is_enabled: yup.boolean().required(messages.isEnabledRequired),
  });
};

/**
 * Resolver pronto para o `useForm({ resolver })`.
 * @param {LanguageDate} languageGB - Pacote de idioma ativo (mensagens de validação i18n).
 * @return {Function} Resolver ligado ao schema do módulo.
 */
export const operationSchemaResolver = (languageGB: LanguageDate) =>
  yupResolver(operationSchema(languageGB));

export default operationSchemaResolver;
