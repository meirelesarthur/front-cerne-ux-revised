// src/validations/schemas/RequestAuthorizations/request-authorization-comment-schema.ts
// -----------------------------------------------------------------------------
// Schema de validação Yup do payload `POST /request-authorizations/{uuid}/comments`
// (RequestAuthorizationCommentPayload, TASK-AUTH-FE-01). Campo único, sempre
// obrigatório. Nome do campo no payload público é `comment` — NÃO `justify`
// (justify é o nome da coluna física do `RequestMovement`, ver nota de tipos).
// -----------------------------------------------------------------------------

import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

import type { LanguageDate } from '@/@types/language';

export const requestAuthorizationCommentSchema = (languageGB: LanguageDate) => {
  const v = languageGB.requestAuthorizations.requestAuthorization.validation;

  return yup.object({
    comment: yup
      .string()
      .trim()
      .nullable()
      .required(v.commentRequired)
      .test('is-valid', v.commentRequired, (value) => !!value && value.trim() !== ''),
  });
};

/**
 * Resolver pronto para o `useForm({ resolver })`.
 * @param {LanguageDate} languageGB - Pacote de idioma ativo (mensagens de validação i18n).
 * @return {Function} Resolver ligado ao schema do módulo.
 */
export const requestAuthorizationCommentSchemaResolver = (languageGB: LanguageDate) =>
  yupResolver(requestAuthorizationCommentSchema(languageGB));

export default requestAuthorizationCommentSchemaResolver;
