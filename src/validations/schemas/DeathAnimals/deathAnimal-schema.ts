// src/validations/schemas/DeathAnimals/deathAnimal-schema.ts
// -----------------------------------------------------------------------------
// Schema de validação Yup do formulário de Mortes (DeathAnimal) —
// TASK-DA-FE-02. Mirror `feedlotYard-schema.ts`/`birth-animal-schema.ts`
// (Yup direto, `yup.object<Record<keyof T, yup.AnySchema>>()` +
// `yupResolver`) — NÃO existe `fieldValidationSchema()` no repo, não usar.
//
// `date`/`batch_uuid`/`animal_uuid`/`cause_uuid` obrigatórios (mirror
// `DeathAnimalRequest::rules()`); `note` opcional/nullable, sem `max` (coluna
// `TEXT`, UI não limita, `FLD-11`). `code`/`user_name`/`photo` ficam FORA
// deste schema — `code`/`user_name` são texto estático (fora do `<Form>`),
// `photo` é estado dedicado (`useState`, mirror `Nascimentos`), nunca campo
// RHF.
// -----------------------------------------------------------------------------

import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

import type { LanguageDate } from '@/@types/language';
import type { DeathAnimalForm } from '@/@types/v2/DeathAnimals';

export const deathAnimalSchema = (languageGB: LanguageDate) => {
  const msgs = languageGB.deathAnimals.deathAnimal.form.validation;

  return yup.object<Record<keyof DeathAnimalForm, yup.AnySchema>>({
    date: yup.string().required(msgs.dateRequired),
    batch_uuid: yup.object().nullable().required(msgs.batchRequired),
    animal_uuid: yup.object().nullable().required(msgs.animalRequired),
    cause_uuid: yup.object().nullable().required(msgs.causeRequired),
    note: yup.string().nullable(),
  });
};

/**
 * Resolver pronto para o `useForm({ resolver })`.
 * @param {LanguageDate} languageGB - Pacote de idioma ativo (mensagens de validação i18n).
 * @return {Function} Resolver ligado ao schema do módulo.
 */
export const deathAnimalSchemaResolver = (languageGB: LanguageDate) =>
  yupResolver(deathAnimalSchema(languageGB) as any);

export default deathAnimalSchemaResolver;
