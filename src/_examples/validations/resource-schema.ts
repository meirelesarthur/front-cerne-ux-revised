// src/_examples/validations/resource-schema.ts
// -----------------------------------------------------------------------------
// CAMADA DE EXEMPLO — schema de validação Yup (referência de padrão).
//
// Segue o padrão de validação da empresa: uma FUNÇÃO que recebe `languageGB` e
// devolve o schema Yup. Reaproveita o helper REAL de infraestrutura
// `fieldValidationSchema` (em `src/validations/`) para os campos genéricos
// (string obrigatória), e sobrescreve pontualmente com regras/mensagens
// ESPECÍFICAS da feature (ex.: nome com mínimo de 2 caracteres, mensagens de
// `languageGB.examples.resource.form.validation.*`).
//
// Consumo na tela:
//   const method = useForm({ resolver: resourceSchemaResolver(languageGB) });
// -----------------------------------------------------------------------------

import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";

import type { LanguageDate } from "@/@types/language";
import fieldValidationSchema from "@/validations/field-validation-schema";

export const resourceSchema = (languageGB: LanguageDate) => {
  const v = fieldValidationSchema(languageGB);
  const messages = languageGB.examples.resource.form.validation;

  return yup.object({
    // Regra específica da feature: obrigatório + mínimo de 2 caracteres, com
    // mensagens do dicionário do próprio módulo de exemplo.
    name: yup
      .string()
      .trim()
      .required(messages.nameRequired)
      .min(2, messages.nameMinLength),
    // Campo genérico reaproveitado da infraestrutura, mas com mensagem própria.
    code: yup.string().trim().required(messages.codeRequired),
    status: yup.string().required(messages.statusRequired),
    // `description` é opcional — usa string simples (não o helper obrigatório).
    description: yup.string().nullable(),
    // `enabled` é booleano: reaproveita direto o helper genérico da infra.
    enabled: v.boolean(),
  });
};

/** Resolver pronto para o `useForm({ resolver })`. */
export const resourceSchemaResolver = (languageGB: LanguageDate) =>
  yupResolver(resourceSchema(languageGB));

export default resourceSchemaResolver;
