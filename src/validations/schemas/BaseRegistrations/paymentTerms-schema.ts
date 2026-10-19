// src/validations/schemas/BaseRegistrations/paymentTerms-schema.ts
// -----------------------------------------------------------------------------
// Schema de validação Yup do formulário de Condição de Pagamento (PaymentTerm)
// — FUNÇÃO que recebe `languageGB` e devolve o schema (mensagens i18n), mesma
// convenção da referência `diagnosisPregnancy-schema.ts`.
//
// `description` obrigatório/trim/máx 100 (PaymentTermRequest::rules()).
// `condition` obrigatório/trim/máx 100, validado por regex
// `^\d+(,\d+)*$` (lista de dias separada por vírgula, ex. "10,20,30").
// `type`: o Select do RHF guarda a SLUG STRING diretamente
// ('compra'|'venda'|'ambos') — o schema aqui só garante "não vazio"
// (presença); o `Rule::in(...)` real já é validado no backend contra o Enum
// PaymentTermType.
// `is_enabled`/`out_day` boolean obrigatórios.
// -----------------------------------------------------------------------------

import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

import type { LanguageDate } from '@/@types/language';

const CONDITION_REGEX = /^\d+(,\d+)*$/;

export const paymentTermsSchema = (languageGB: LanguageDate) => {
  const messages = languageGB.baseRegistrations.paymentTerm.form.validation;

  return yup.object({
    description: yup
      .string()
      .trim()
      .required(messages.descriptionRequired)
      .max(100, messages.descriptionMaxLength),
    condition: yup
      .string()
      .trim()
      .required(messages.conditionRequired)
      .max(100, messages.conditionMaxLength)
      .matches(CONDITION_REGEX, { message: messages.conditionInvalid, excludeEmptyString: true }),
    type: yup.string().required(messages.typeRequired),
    is_enabled: yup.boolean().required(),
    out_day: yup.boolean().required(),
  });
};

/**
 * Resolver pronto para o `useForm({ resolver })`.
 * @param {LanguageDate} languageGB - Pacote de idioma ativo (mensagens de validação i18n).
 * @return {Function} Resolver ligado ao schema do módulo.
 */
export const paymentTermsSchemaResolver = (languageGB: LanguageDate) =>
  yupResolver(paymentTermsSchema(languageGB));

export default paymentTermsSchemaResolver;
