// src/validations/schemas/RequestQuotations/request-quotation-authorizer-schema.ts
// -----------------------------------------------------------------------------
// Schema de validação Yup do Dialog "Enviar para Autorização" (RequestQuotation
// — Administrativo / Suprimentos, esteira 97-Esteiras/035, TASK-CQ-FE-07,
// Dimensão B). Mirror estrutural de `request-quotation-saving-schema.ts` —
// fábrica `(languageGB) => yupResolver(...)`, sem parâmetro extra (nenhuma
// guarda de negócio client-side aqui: a elegibilidade é 100% server-side,
// CL-043, o front só valida "campo preenchido").
//
// Valida o único campo do payload real
// (`RequestPurchaseSendForAuthorizationRequest::rules()` —
// `authorizer_uuid`, `required|uuid|exists`). Mensagens 100% via
// `languageGB.requestQuotations.requestQuotation.authorizer.validation.*`
// (`get_pwa_validation_and_utils_pattern` §1.7) — zero string literal.
//
// Localização: `src/validations/schemas/RequestQuotations/`, NUNCA em
// `pages/` (regra inviolável da Tarefa).
// -----------------------------------------------------------------------------

import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

import fieldValidationSchema from '@/validations/field-validation-schema';

import type { LanguageDate } from '@/@types/language';

export const requestQuotationAuthorizerSchema = (languageGB: LanguageDate) => {
  const v = fieldValidationSchema(languageGB);
  const messages = languageGB.requestQuotations.requestQuotation.authorizer.validation;

  return yup.object({
    // `authorizer_uuid` — required, `SelectAsyncPaginate`/`Select` (Option).
    authorizer_uuid: v.option<string>().required(messages.authorizerRequired),
  });
};

/**
 * Resolver pronto para o `useForm({ resolver })`.
 * @param {LanguageDate} languageGB - Pacote de idioma ativo (mensagens de validação i18n).
 * @return {Function} Resolver ligado ao schema do módulo.
 */
export const requestQuotationAuthorizerSchemaResolver = (languageGB: LanguageDate) =>
  yupResolver(requestQuotationAuthorizerSchema(languageGB));

export default requestQuotationAuthorizerSchemaResolver;
