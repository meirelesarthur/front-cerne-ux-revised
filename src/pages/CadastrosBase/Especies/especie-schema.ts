// src/pages/CadastrosBase/Especies/especie-schema.ts
// -----------------------------------------------------------------------------
// Schema de validação Yup do formulário de Espécie (TASK-ESP-02) — mirror
// mecânico de CadastrosBase/CentroCusto/centro-custo-schema.ts: FUNÇÃO que
// recebe `languageGB` e devolve o schema (mensagens i18n).
//
// `cost_center_uuid` NÃO entra no schema (mesmo racional de `parent_uuid` em
// `centro-custo-schema.ts`): guarda um objeto `Option | null` (não uma folha
// simples) e é opcional/nullable — nada a validar além do que o próprio
// `SelectAsyncPaginate` já resolve (sempre um par {label,value} ou null).
// -----------------------------------------------------------------------------

import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

import type { LanguageDate } from '@/@types/language';

export const especieSchema = (languageGB: LanguageDate) => {
  const messages = languageGB.species.specie.form.validation;

  return yup.object({
    description: yup
      .string()
      .trim()
      .required(messages.descriptionRequired)
      .max(100, messages.descriptionMaxLength),
    is_enabled: yup.boolean().required(),
  });
};

/**
 * Resolver pronto para o `useForm({ resolver })`.
 * @param {LanguageDate} languageGB - Pacote de idioma ativo (mensagens de validação i18n).
 * @return {Function} Resolver ligado ao schema do módulo.
 */
export const especieSchemaResolver = (languageGB: LanguageDate) =>
  yupResolver(especieSchema(languageGB));

export default especieSchemaResolver;
