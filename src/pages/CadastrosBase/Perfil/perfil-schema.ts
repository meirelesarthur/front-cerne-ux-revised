// src/pages/CadastrosBase/Perfil/perfil-schema.ts
// -----------------------------------------------------------------------------
// Schema de validação Yup do formulário de Perfil (Roles RBAC) — padrão da
// empresa: FUNÇÃO que recebe `languageGB` e devolve o schema (mensagens i18n).
// -----------------------------------------------------------------------------

import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";

import type { LanguageDate } from "@/@types/language";

export const perfilSchema = (languageGB: LanguageDate) => {
  const messages = languageGB.roles.role.form.validation;

  return yup.object({
    name: yup
      .string()
      .trim()
      .required(messages.nameRequired)
      .min(2, messages.nameMinLength),
    // Obrigatória no contrato do backend (RoleRequest) — 422 sem ela.
    description: yup.string().trim().required(messages.descriptionRequired),
    is_user_visible: yup.boolean(),
  });
};

/** Resolver pronto para o `useForm({ resolver })`. */
export const perfilSchemaResolver = (languageGB: LanguageDate) =>
  yupResolver(perfilSchema(languageGB));

export default perfilSchemaResolver;
