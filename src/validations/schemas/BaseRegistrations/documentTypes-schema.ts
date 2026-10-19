// src/validations/schemas/BaseRegistrations/documentTypes-schema.ts
// -----------------------------------------------------------------------------
// Schema de validação Yup do formulário de Tipo Documento (DocumentType,
// TASK-DT-FE-02) — mirror mecânico de `accountingGroupers-schema.ts`: FUNÇÃO
// que recebe `languageGB` e devolve o schema (mensagens i18n).
//
// `name` obrigatório/trim/máx 60, `is_enabled` obrigatório, `order`
// obrigatório/inteiro (`DocumentTypeRequest::rules()`, `[[DocumentType-contrato]]
// §6`) — SEM `.min(1, ...)` (o contrato de tela §7 não define piso para
// `order` neste módulo, diferente de `AccountingGrouper`).
//
// `parent_uuid` — SEM validação de obrigatoriedade (raiz é um valor válido,
// `null`). A exclusão do próprio nó/subárvore (`GAP-DT-03`) é resolvida no
// SERVIDOR via `/document-types/options?except=<uuid>` — nenhum filtro de
// ciclo é feito neste schema.
//
// `code` NÃO entra neste schema — gerado no servidor (`DA-DT-06`), nunca
// submetido pelo cliente.
// -----------------------------------------------------------------------------

import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

import type { LanguageDate } from '@/@types/language';

export const documentTypesSchema = (languageGB: LanguageDate) => {
  const messages = languageGB.baseRegistrations.documentTypes.form.validation;

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
      .integer(messages.orderRequired),

    // Antecessor — sem validação de obrigatoriedade (raiz é um valor válido,
    // `null`). Exclusão de subárvore é 100% do backend (`GAP-DT-03`).
    parent_uuid: yup.string().nullable(),
  });
};

/**
 * Resolver pronto para o `useForm({ resolver })`.
 * @param {LanguageDate} languageGB - Pacote de idioma ativo (mensagens de validação i18n).
 * @return {Function} Resolver ligado ao schema do módulo.
 */
export const documentTypesSchemaResolver = (languageGB: LanguageDate) =>
  yupResolver(documentTypesSchema(languageGB));

export default documentTypesSchemaResolver;
