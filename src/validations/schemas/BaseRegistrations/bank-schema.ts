// src/validations/schemas/BaseRegistrations/bank-schema.ts
// -----------------------------------------------------------------------------
// Schema de validação Yup do formulário de Banco (TASK-BANK-FE-02) — mirror
// mecânico de GruposProduto/product-group-schema.ts: FUNÇÃO que recebe
// `languageGB` e devolve o schema (mensagens i18n).
//
// `code` (máx. 4 caracteres) e `name` (máx. 100 caracteres) — ambos
// obrigatórios em ambos os verbos (`BankRequest::rules()`, full-resource-
// replace). Sem nenhum Select/enum/booleano — cadastro flat puro de 2 campos
// de texto.
// -----------------------------------------------------------------------------

import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

import type { LanguageDate } from '@/@types/language';

export const bankSchema = (languageGB: LanguageDate) => {
  const messages = languageGB.baseRegistrations.bank.form.validation;

  return yup.object({
    code: yup.string().trim().required(messages.codeRequired).max(4, messages.codeMaxLength),
    name: yup.string().trim().required(messages.nameRequired).max(100, messages.nameMaxLength),
  });
};

/**
 * Resolver pronto para o `useForm({ resolver })`.
 * @param {LanguageDate} languageGB - Pacote de idioma ativo (mensagens de validação i18n).
 * @return {Function} Resolver ligado ao schema do módulo.
 */
export const bankSchemaResolver = (languageGB: LanguageDate) => yupResolver(bankSchema(languageGB));

export default bankSchemaResolver;
