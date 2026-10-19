// src/validations/schemas/MeuPerfil/personal-data-schema.ts
// -----------------------------------------------------------------------------
// Schema Yup do card "Dados pessoais" — Execução 071, TASK-071-FE-03.
// Espelha `UpdateProfileRequest` (contrato API §2.2): `name` obrigatório,
// mínimo 3 (legado, C-L06/FM-02), máximo 120 (coluna `people.name`, DIV-04
// resolvida — decisão de arquitetura AD-FE-04, NÃO os 3..70 da UX).
// `email` não é validado aqui: o campo é readonly e nunca é enviado (D1/P-01,
// contrato de tela §4.1).
// -----------------------------------------------------------------------------

import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

import type { LanguageDate } from '@/@types/language';

export const personalDataSchema = (languageGB: LanguageDate) => {
  const messages = languageGB.common.myProfile.personalData.name;

  return yup.object({
    name: yup
      .string()
      .trim()
      .required(messages.requiredError)
      .min(3, messages.minError)
      .max(120, messages.maxError),
    email: yup.string().optional(),
  });
};

export const personalDataSchemaResolver = (languageGB: LanguageDate) =>
  yupResolver(personalDataSchema(languageGB));

export default personalDataSchemaResolver;
