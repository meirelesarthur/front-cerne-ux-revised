// src/validations/schemas/SupplyStatusSlas/supply-status-sla-schema.ts
// Schema de validação Yup da edição inline de `max_hours` (Parâmetros SLA).
// Fábrica que compõe `fieldValidationSchema(languageGB)`, mesma convenção de
// `parameterWeights-schema.ts`. Mirror client-side do `SupplyStatusSlaRequest`
// real (api_root): `max_hours => required|integer|min:0` (contrato de API
// §3.2/§3, sem regra para `status` — o campo nunca é lido do payload).
// Campo ÚNICO, sem cross-field (diferente de `parameterWeightsSchema`).

import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

import fieldValidationSchema from '@/validations/field-validation-schema';

import type { LanguageDate } from '@/@types/language';

export const supplyStatusSlaSchema = (languageGB: LanguageDate) => {
  const v = fieldValidationSchema(languageGB);
  const messages = languageGB.supplyStatusSlas.supplyStatusSla.list.validation;

  return yup.object({
    max_hours: v
      .number()
      .typeError(messages.maxHoursInvalid)
      .required(messages.maxHoursRequired)
      .integer(messages.maxHoursInvalid)
      .min(0, messages.maxHoursMin),
  });
};

/**
 * Resolver pronto para o `useForm({ resolver })`.
 * @param {LanguageDate} languageGB - Pacote de idioma ativo (mensagens de validação i18n).
 * @return {Function} Resolver ligado ao schema do módulo.
 */
export const supplyStatusSlaSchemaResolver = (languageGB: LanguageDate) =>
  yupResolver(supplyStatusSlaSchema(languageGB));

export default supplyStatusSlaSchemaResolver;
