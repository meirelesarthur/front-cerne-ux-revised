// src/validations/schemas/RequestAuthorizations/send-for-authorization-form-schema.ts
// -----------------------------------------------------------------------------
// Schema do FORMULÁRIO do modal "Enviar para Autorização" (T-743-FE-04, F3). No form,
// `authorizer_uuid` é uma `Option { label, value }` (Select); a conversão para o uuid
// string do payload acontece só no `onSubmit`. O schema do payload
// (`request-authorization-acknowledge-schema.ts`) continua intacto e não serve de
// resolver do form: aplicava `string().trim()` a um objeto (`val.trim is not a function`).
// -----------------------------------------------------------------------------

import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

import type { LanguageDate } from '@/@types/language';

const JUSTIFY_MAX = 400;

export const sendForAuthorizationFormSchema = (languageGB: LanguageDate) => {
  const v = languageGB.requestAuthorizations.requestAuthorization.validation;

  return yup.object({
    status: yup.number().required(v.statusRequired),
    authorizer_uuid: yup
      .object({ label: yup.string(), value: yup.string().required(v.authorizerRequired) })
      .nullable()
      .required(v.authorizerRequired),
    justify: yup.string().trim().max(JUSTIFY_MAX, v.justifyTooLong),
  });
};

export const sendForAuthorizationFormResolver = (languageGB: LanguageDate) =>
  yupResolver(sendForAuthorizationFormSchema(languageGB)) as any;

export default sendForAuthorizationFormResolver;
