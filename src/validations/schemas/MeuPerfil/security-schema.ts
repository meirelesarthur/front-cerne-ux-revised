// src/validations/schemas/MeuPerfil/security-schema.ts
// -----------------------------------------------------------------------------
// Schema Yup do card "Segurança" — Execução 071, TASK-071-FE-04. Regra do
// LEGADO (D2, C-U01), NUNCA a de 8 caracteres + complexidade da UX:
// `current_password` obrigatório; `password` obrigatório, mínimo 6,
// DIFERENTE da senha atual; `password_confirmation` obrigatório, igual a
// `password`. Mensagens vêm de `myProfile.security.*` (i18n, TASK-071-FE-01).
// -----------------------------------------------------------------------------

import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

import type { LanguageDate } from '@/@types/language';

export const securitySchema = (languageGB: LanguageDate) => {
  const text = languageGB.common.myProfile.security;

  return yup.object({
    current_password: yup.string().required(text.currentPassword.requiredError),
    password: yup
      .string()
      .required(text.newPassword.requiredError)
      .min(6, text.newPassword.minError)
      .notOneOf([yup.ref('current_password')], text.newPassword.sameAsCurrentError),
    password_confirmation: yup
      .string()
      .required(text.confirmPassword.requiredError)
      .oneOf([yup.ref('password')], text.confirmPassword.mismatchError),
  });
};

export const securitySchemaResolver = (languageGB: LanguageDate) =>
  yupResolver(securitySchema(languageGB));

export default securitySchemaResolver;
