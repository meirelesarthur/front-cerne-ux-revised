// src/validations/schemas/BaseRegistrations/cultivation-schema.ts
// -----------------------------------------------------------------------------
// Schema de validação Yup do formulário de Cultura/Variedade (Cultivation) —
// padrão da empresa: FUNÇÃO que recebe `languageGB` e devolve o schema
// (mensagens i18n), mesmo formato de `perfil-schema.ts`/`resource-schema.ts`.
//
// Espelha client-side a validação real do backend (Cultivation-contrato.md
// Seção 4, CultivationRequest): `name` obrigatório; `is_enabled` booleano;
// `parent_uuid` é validado no backend (exists/tenant/anti-ciclo/profundidade
// — DA-CV-05) mas aqui é só uma string (vazia = sem pai) — a validação de
// hierarquia (MAX_DEPTH=2) é reproduzida na MONTAGEM das opções do Select
// (CreateOrUpdateCultivation.tsx), não neste schema.
// -----------------------------------------------------------------------------

import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";

import type { LanguageDate } from "@/@types/language";

export const cultivationSchema = (languageGB: LanguageDate) => {
  const messages = languageGB.cultivation.form.validation;

  return yup.object({
    name: yup
      .string()
      .trim()
      .required(messages.nameRequired)
      .min(2, messages.nameMinLength),
    is_enabled: yup.boolean().required(),
    // Sempre string no form ("" = sem pai) — convertida para `null` só na
    // montagem do payload de escrita (CreateOrUpdateCultivation.tsx).
    parent_uuid: yup.string().defined(),
  });
};

/** Resolver pronto para o `useForm({ resolver })`. */
export const cultivationSchemaResolver = (languageGB: LanguageDate) =>
  yupResolver(cultivationSchema(languageGB));

export default cultivationSchemaResolver;
