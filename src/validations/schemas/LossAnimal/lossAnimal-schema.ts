// src/validations/schemas/LossAnimal/lossAnimal-schema.ts
// -----------------------------------------------------------------------------
// Schema de validação Yup do formulário de Perdas (LossAnimal) — mirror
// mecânico de `death-loss-schema.ts` (função que recebe `languageGB`,
// mensagens i18n). `batch_uuid` NÃO tem `.required()` — nullable no servidor
// real (FID-LA-011, CORRIGIDO vs. `required` client-side do legado, contrato
// de tela §7.3 linha 14). `animal_uuid`/`cause_uuid` guardam o Option
// `{ label, value }` inteiro (SelectAsyncPaginate/Select), validados com
// `.required()` — o backend rejeita `null`/ausente com 422 em ambos.
// -----------------------------------------------------------------------------

import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

import type { LanguageDate } from '@/@types/language';

export const lossAnimalSchema = (languageGB: LanguageDate) => {
  const messages = languageGB.lossAnimals.lossAnimal.form.validation;

  return yup.object({
    code: yup.string(), // readonly/calculado — nunca editado pelo usuário
    date: yup
      .string()
      .required(messages.dateRequired)
      .matches(/^\d{4}-\d{2}-\d{2}$/, messages.dateRequired),
    user_uuid: yup.string(), // interno, nunca exibido como Select
    user_name: yup.string(), // display-only
    // NÃO `.required()` — servidor real é `nullable` (DIV-005, contrato §7.3
    // linha 14). Fidelidade ao servidor, não à regra client-only do legado.
    batch_uuid: yup.mixed().nullable(),
    animal_uuid: yup.mixed().required(messages.animalRequired),
    cause_uuid: yup.mixed().required(messages.causeRequired),
    note: yup.string().nullable(),
  });
};

/**
 * Resolver pronto para o `useForm({ resolver })`.
 * @param {LanguageDate} languageGB - Pacote de idioma ativo (mensagens de validação i18n).
 * @return {Function} Resolver ligado ao schema do módulo.
 */
export const lossAnimalSchemaResolver = (languageGB: LanguageDate) =>
  yupResolver(lossAnimalSchema(languageGB));

export default lossAnimalSchemaResolver;
