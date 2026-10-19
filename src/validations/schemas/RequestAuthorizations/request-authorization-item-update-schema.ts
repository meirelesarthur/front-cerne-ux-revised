// src/validations/schemas/RequestAuthorizations/request-authorization-item-update-schema.ts
// -----------------------------------------------------------------------------
// Schema de validação Yup do payload `PUT /request-authorizations/{uuid}/items/{itemUuid}`
// (RequestAuthorizationItemUpdatePayload, TASK-AUTH-FE-01). Campo único
// editável (`quantity`), sempre obrigatório e > 0.
// -----------------------------------------------------------------------------

import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

import type { LanguageDate } from '@/@types/language';

export const requestAuthorizationItemUpdateSchema = (languageGB: LanguageDate) => {
  const v = languageGB.requestAuthorizations.requestAuthorization.validation;

  return yup.object({
    quantity: yup
      .number()
      .typeError(v.quantityRequired)
      .required(v.quantityRequired)
      .moreThan(0, v.quantityMin),
  });
};

/**
 * Resolver pronto para o `useForm({ resolver })`.
 * @param {LanguageDate} languageGB - Pacote de idioma ativo (mensagens de validação i18n).
 * @return {Function} Resolver ligado ao schema do módulo.
 */
export const requestAuthorizationItemUpdateSchemaResolver = (languageGB: LanguageDate) =>
  yupResolver(requestAuthorizationItemUpdateSchema(languageGB));

export default requestAuthorizationItemUpdateSchemaResolver;
