// src/pages/CadastrosBase/Produtos/Classes/kind-schema.ts
// -----------------------------------------------------------------------------
// Schema de validação Yup do formulário de Classe de Produto (Kind) — mirror
// mecânico de Racas/breed-schema.ts: FUNÇÃO que recebe `languageGB` e devolve
// o schema (mensagens i18n).
//
// `category_uuid` guarda o Option `{ label, value }` inteiro
// (SelectAsyncPaginate, não uma folha simples) — validado com `.required()`
// (o backend rejeita `null`/ausente com 422, `KindRequest`: `category_uuid` é
// `required` tanto no create quanto no update, mesmas regras em ambos os
// verbos — Kind-Frontend-Contrato.md §1).
// -----------------------------------------------------------------------------

import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

import type { LanguageDate } from '@/@types/language';

export const kindSchema = (languageGB: LanguageDate) => {
  const messages = languageGB.kinds.kind.form.validation;

  return yup.object({
    name: yup.string().trim().required(messages.nameRequired).max(100, messages.nameMaxLength),
    is_enabled: yup.boolean().required(),
    category_uuid: yup.mixed().required(messages.categoryRequired),
  });
};

/**
 * Resolver pronto para o `useForm({ resolver })`.
 * @param {LanguageDate} languageGB - Pacote de idioma ativo (mensagens de validação i18n).
 * @return {Function} Resolver ligado ao schema do módulo.
 */
export const kindSchemaResolver = (languageGB: LanguageDate) => yupResolver(kindSchema(languageGB));

export default kindSchemaResolver;
