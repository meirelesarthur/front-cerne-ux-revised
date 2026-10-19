// src/validations/schemas/BaseRegistrations/indexer-schema.ts
// -----------------------------------------------------------------------------
// Schema de validação Yup do formulário de Indexadores (TASK-FE-212) — mirror
// mecânico de `ObservacaoNascimento/birth-note-schema.ts` + 1 campo
// (`descriptive`, mesma regra de `description`): FUNÇÃO que recebe
// `languageGB` e devolve o schema (mensagens i18n).
//
// 3 campos de negócio, todos obrigatórios — sem FK, sem `code`. SEM regra
// `unique` para `description`/`descriptive` — a API explicitamente não
// valida unicidade (Indexer-contrato §2.1/§9: legado não diferencia os dois
// campos e não tem índice único), então nenhum `.test()`/chamada assíncrona
// é adicionada aqui.
// -----------------------------------------------------------------------------

import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

import type { LanguageDate } from '@/@types/language';

export const indexerSchema = (languageGB: LanguageDate) => {
  const messages = languageGB.baseRegistrations.indexer.form.validation;

  return yup.object({
    description: yup
      .string()
      .trim()
      .required(messages.descriptionRequired)
      .max(100, messages.descriptionMaxLength),
    descriptive: yup
      .string()
      .trim()
      .required(messages.descriptiveRequired)
      .max(100, messages.descriptiveMaxLength),
    is_enabled: yup.boolean().required(),
  });
};

/**
 * Resolver pronto para o `useForm({ resolver })`.
 * @param {LanguageDate} languageGB - Pacote de idioma ativo (mensagens de validação i18n).
 * @return {Function} Resolver ligado ao schema do módulo.
 */
export const indexerSchemaResolver = (languageGB: LanguageDate) =>
  yupResolver(indexerSchema(languageGB));

export default indexerSchemaResolver;
