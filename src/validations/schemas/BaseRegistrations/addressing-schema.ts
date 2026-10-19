// src/validations/schemas/BaseRegistrations/addressing-schema.ts
// -----------------------------------------------------------------------------
// Schema de validação Yup do formulário de Endereçamento (Addressing) —
// padrão da empresa: FUNÇÃO que recebe `languageGB` e devolve o schema
// (mensagens i18n), mesmo formato de `cultivation-schema.ts`/
// `perfil-schema.ts`.
//
// Só valida `description` — é o ÚNICO campo do `react-hook-form` (o pai é
// SEMPRE informação read-only/contextual, nunca um `Select` editável; ver
// "PONTO DE MODELAGEM DE UI" em TASK-AD-03b). Espelha client-side a
// validação real do backend (Addressing-contrato.md Seção 4,
// `AddressingRequest`): `description` obrigatório, `max:100`.
// -----------------------------------------------------------------------------

import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";

import type { LanguageDate } from "@/@types/language";

export const addressingSchema = (languageGB: LanguageDate) => {
  const messages = languageGB.baseRegistrations.addressing.form.validation;

  return yup.object({
    description: yup
      .string()
      .trim()
      .required(messages.descriptionRequired)
      .max(100),
  });
};

/** Resolver pronto para o `useForm({ resolver })`. */
export const addressingSchemaResolver = (languageGB: LanguageDate) =>
  yupResolver(addressingSchema(languageGB));

export default addressingSchemaResolver;
