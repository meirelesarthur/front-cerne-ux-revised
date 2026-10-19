// src/pages/CadastrosBase/Racas/breed-schema.ts
// -----------------------------------------------------------------------------
// Schema de validação Yup do formulário de Raça (TASK-BREED-02) — mirror
// mecânico de CentroCusto/centro-custo-schema.ts: FUNÇÃO que recebe
// `languageGB` e devolve o schema (mensagens i18n).
//
// `specie_uuid` guarda o Option `{ label, value }` inteiro (SelectAsyncPaginate,
// não uma folha simples) — validado com `.required()` (o backend rejeita
// `null`/ausente com 422, `BreedRequest.php:31-36`: `specie_uuid` é `required`
// tanto no create quanto no update). Validar no client evita um roundtrip
// desnecessário quando o usuário esquece de selecionar a Espécie.
// -----------------------------------------------------------------------------

import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

import type { LanguageDate } from '@/@types/language';

export const breedSchema = (languageGB: LanguageDate) => {
  const messages = languageGB.breeds.breed.form.validation;

  return yup.object({
    description: yup
      .string()
      .trim()
      .required(messages.descriptionRequired)
      .max(100, messages.descriptionMaxLength),
    is_enabled: yup.boolean().required(),
    specie_uuid: yup.mixed().required(messages.specieRequired),
  });
};

/**
 * Resolver pronto para o `useForm({ resolver })`.
 * @param {LanguageDate} languageGB - Pacote de idioma ativo (mensagens de validação i18n).
 * @return {Function} Resolver ligado ao schema do módulo.
 */
export const breedSchemaResolver = (languageGB: LanguageDate) =>
  yupResolver(breedSchema(languageGB));

export default breedSchemaResolver;
