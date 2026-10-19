// src/validations/schemas/BaseRegistrations/reversalExpenses-schema.ts
// -----------------------------------------------------------------------------
// Schema de validação Yup do formulário de Estorno — mirror de
// CondicoesPagamento/condicao-pagamento-schema.ts: FUNÇÃO que recebe
// `languageGB` e devolve o schema (mensagens i18n).
//
// `description` obrigatório/trim/máx 30 (ReversalExpenseRequest::rules(),
// mais restritivo que a coluna física, fiel ao legado).
// `is_enabled`/`use_kg` boolean obrigatórios.
// `value` numérico obrigatório, mínimo 0 (endurecido, D6 do contrato).
// -----------------------------------------------------------------------------

import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

import type { LanguageDate } from '@/@types/language';

export const reversalExpenseSchema = (languageGB: LanguageDate) => {
  const messages = languageGB.baseRegistrations.reversalExpense.form.validation;

  return yup.object({
    description: yup
      .string()
      .trim()
      .required(messages.descriptionRequired)
      .max(30, messages.descriptionMaxLength),
    is_enabled: yup.boolean().required(),
    use_kg: yup.boolean().required(),
    value: yup
      .number()
      .typeError(messages.valueInvalid)
      .required(messages.valueRequired)
      .min(0, messages.valueMin),
  });
};

/**
 * Resolver pronto para o `useForm({ resolver })`.
 * @param {LanguageDate} languageGB - Pacote de idioma ativo (mensagens de validação i18n).
 * @return {Function} Resolver ligado ao schema do módulo.
 */
export const reversalExpenseSchemaResolver = (languageGB: LanguageDate) =>
  yupResolver(reversalExpenseSchema(languageGB));

export default reversalExpenseSchemaResolver;
