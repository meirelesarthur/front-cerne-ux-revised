// src/validations/schemas/BaseRegistrations/accountingGroupers-schema.ts
// -----------------------------------------------------------------------------
// Schema de validação Yup do formulário de Agrupador Contábil (TASK-ACG-02) —
// mirror mecânico de Agrupadores/grouper-schema.ts / MotivosBaixa/motivo-baixa-schema.ts:
// FUNÇÃO que recebe `languageGB` e devolve o schema (mensagens i18n).
//
// `name` obrigatório/trim/máx 60, `is_enabled` obrigatório, `order`
// obrigatório/inteiro/mín 1 (`AccountingGrouperRequest.rules()`).
//
// `parent_uuid` — SEM validação de obrigatoriedade (raiz é um valor válido,
// `null`). A validação definitiva de ciclo (backend não impõe limite de
// profundidade — TASK-ACG-01) é 100% do backend; client só filtra o óbvio (o
// próprio nó, em edição — ver `listAccountingGroupersForParent` em
// `CreateOrUpdateAccountingGroupers.tsx`).
//
// `code` NÃO entra neste schema (mesmo racional de `parent_uuid` em
// `centro-custo-schema.ts`) — gerado no servidor, nunca submetido.
// -----------------------------------------------------------------------------

import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

import type { LanguageDate } from '@/@types/language';

export const accountingGrouperSchema = (languageGB: LanguageDate) => {
  const messages = languageGB.baseRegistrations.accountingGroupers.form.validation;

  return yup.object({
    name: yup.string().trim().required(messages.nameRequired).max(60, messages.nameMaxLength),

    is_enabled: yup.mixed().required(messages.isEnabledRequired),

    order: yup
      .number()
      .transform((_, originalValue) =>
        originalValue === '' || originalValue === null || originalValue === undefined
          ? undefined
          : Number(originalValue)
      )
      .typeError(messages.orderRequired)
      .required(messages.orderRequired)
      .integer(messages.orderRequired)
      .min(1, messages.orderMin),

    // Antecessor — sem validação de obrigatoriedade (raiz é um valor válido,
    // `null`). A validação definitiva de ciclo é 100% do backend (TASK-ACG-01
    // — sem limite de profundidade, diferente de `Grouper`).
    parent_uuid: yup.string().nullable(),
  });
};

/**
 * Resolver pronto para o `useForm({ resolver })`.
 * @param {LanguageDate} languageGB - Pacote de idioma ativo (mensagens de validação i18n).
 * @return {Function} Resolver ligado ao schema do módulo.
 */
export const accountingGrouperSchemaResolver = (languageGB: LanguageDate) =>
  yupResolver(accountingGrouperSchema(languageGB));

export default accountingGrouperSchemaResolver;
