// src/pages/CadastrosBase/CausaMortePerda/death-loss-schema.ts
// -----------------------------------------------------------------------------
// Schema de validação Yup do formulário de Causa Morte/Perda — mirror
// mecânico de `Racas/breed-schema.ts` (FUNÇÃO que recebe `languageGB` e
// devolve o schema, mensagens i18n), MAIS a validação de `cause` (enum de 2
// valores, guardado como `Option` — mesmo racional de `specie_uuid`).
//
// `specie_uuid`/`cause` guardam o Option `{ label, value }` inteiro (Select/
// SelectAsyncPaginate, não uma folha simples) — validados com `.required()`
// (o backend rejeita `null`/ausente com 422 em ambos, `DeathLossRequest::
// rules()`). Validar no client evita um roundtrip desnecessário.
// -----------------------------------------------------------------------------

import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

import type { LanguageDate } from '@/@types/language';

export const deathLossSchema = (languageGB: LanguageDate) => {
  const messages = languageGB.deathLosses.deathLoss.form.validation;

  return yup.object({
    description: yup
      .string()
      .trim()
      .required(messages.descriptionRequired)
      .max(191, messages.descriptionMaxLength),
    is_enabled: yup.boolean().required(),
    specie_uuid: yup.mixed().required(messages.specieRequired),
    cause: yup.mixed().required(messages.causeRequired),
  });
};

/**
 * Resolver pronto para o `useForm({ resolver })`.
 * @param {LanguageDate} languageGB - Pacote de idioma ativo (mensagens de validação i18n).
 * @return {Function} Resolver ligado ao schema do módulo.
 */
export const deathLossSchemaResolver = (languageGB: LanguageDate) =>
  yupResolver(deathLossSchema(languageGB));

export default deathLossSchemaResolver;
