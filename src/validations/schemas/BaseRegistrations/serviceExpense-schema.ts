// src/validations/schemas/BaseRegistrations/serviceExpense-schema.ts
// -----------------------------------------------------------------------------
// Schema de validação Yup do formulário de Serviços — mirror de
// Estorno/reversal-expense-schema.ts: FUNÇÃO que recebe `languageGB` e
// devolve o schema (mensagens i18n).
//
// `description` obrigatório/trim/máx 30 (ServiceExpenseRequest::rules(), mais
// restritivo que a coluna física, fiel ao legado).
// `is_enabled`/`use_kg`/`pay_team`/`has_commission` boolean obrigatórios.
// `value`/`commission` numéricos obrigatórios, mínimo 0 (D6/D-S2 do
// contrato) — SEM `required_if` cruzado entre `has_commission`/`commission`
// (fidelidade ao legado, D-S2).
// -----------------------------------------------------------------------------

import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

import type { LanguageDate } from '@/@types/language';

export const serviceExpenseSchema = (languageGB: LanguageDate) => {
  const messages = languageGB.baseRegistrations.serviceExpense.form.validation;

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
    pay_team: yup.boolean().required(),
    has_commission: yup.boolean().required(),
    commission: yup
      .number()
      .typeError(messages.commissionInvalid)
      .required(messages.commissionRequired)
      .min(0, messages.commissionMin),
    // Sem required_if(has_commission) — fidelidade ao legado (D-S2 do contrato de API).
  });
};

/**
 * Resolver pronto para o `useForm({ resolver })`.
 * @param {LanguageDate} languageGB - Pacote de idioma ativo (mensagens de validação i18n).
 * @return {Function} Resolver ligado ao schema do módulo.
 */
export const serviceExpenseSchemaResolver = (languageGB: LanguageDate) =>
  yupResolver(serviceExpenseSchema(languageGB));

export default serviceExpenseSchemaResolver;
