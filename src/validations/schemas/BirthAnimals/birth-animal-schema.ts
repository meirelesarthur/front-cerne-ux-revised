// src/validations/schemas/BirthAnimals/birth-animal-schema.ts
// -----------------------------------------------------------------------------
// Schema de validação Yup do formulário de Nascimentos (BirthAnimal —
// Operacional > Pecuária, TASK-NASC-FE-02, frontend-contract-nascimentos.md
// §7). Mirror estrutural de `CadastrosBase/animal-schema.ts` (FUNÇÃO que
// recebe `languageGB` e devolve o schema) — mensagens sempre derivadas de
// `fieldValidationSchema(languageGB)`.
//
// `mother_uuid` — OBRIGATÓRIO no client (`GAP-NASC-12`, decisão de UX já
// tomada pelo Arquiteto Frontend, contrato §7.1) mesmo sendo `nullable` no
// servidor (`BirthAnimalRequest::rules()` real).
//
// `identifications` (`useFieldArray`) — mínimo 1 linha SEMPRE, incondicional
// (diferente de `animal-schema.ts`, onde a exigência depende de `type` —
// aqui `id_animals` é `required|array|min:1` incondicional no
// `BirthAnimalRequest::rules()` real, não existe um "tipo de nascimento sem
// identificação" que dispense a tabela, contrato §7.2).
// -----------------------------------------------------------------------------

import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

import fieldValidationSchema from '@/validations/field-validation-schema';

import type { LanguageDate } from '@/@types/language';

export const birthAnimalSchema = (languageGB: LanguageDate) => {
  const v = fieldValidationSchema(languageGB);
  const messages = languageGB.defaltStrings.validations;

  return yup.object({
    date: v.date(),
    specie_uuid: v.option(),
    category_uuid: v.option(),
    breed_uuid: v.option(),
    birth_note_uuid: v.option(),
    weight: v.number(),

    // `GAP-NASC-12` — nullable no servidor, mas obrigatório no client
    // (decisão de UX já tomada, contrato §7.1, não reabrir).
    mother_uuid: v.option(),

    // Texto livre — `animal_father_id` é resolvido pelo servidor por busca
    // textual, sem validação de existência (mirror `mother`/`father` de
    // `animal-schema.ts`, RN-4). `max:191` mirror `BirthAnimalRequest::rules()`
    // real (`father_text` => ['nullable', 'string', 'max:191']).
    father_text: yup.string().nullable().max(191, messages.invalidValue),

    // Não obrigatórios no client (contrato §7.1) — `batch_uuid` dispara IG4
    // (reset de `mother_uuid`) e `checkBatchDate`; `transfer_batch_uuid`
    // idem, ambos opcionais e independentes.
    batch_uuid: yup.mixed().nullable(),
    transfer_batch_uuid: yup.mixed().nullable(),

    // `max:100` mirror `BirthAnimalRequest::rules()` real
    // (`fur_description` => ['nullable', 'string', 'max:100']).
    fur_description: yup.string().nullable().max(100, messages.invalidValue),
    // `max:1000` mirror `BirthAnimalRequest::rules()` real
    // (`note` => ['nullable', 'string', 'max:1000']).
    note: yup.string().nullable().max(1000, messages.invalidValue),

    // Identificação dinâmica (`useFieldArray`) — mínimo 1 linha SEMPRE,
    // incondicional (contrato §7.2 — `id_animals` é `required|array|min:1`
    // incondicional no servidor real, sem "tipo sem identificação" que
    // dispense a tabela, diferente de `animal-schema.ts`).
    identifications: yup
      .array()
      .of(
        yup.object({
          id_animal_uuid: yup.mixed().nullable().required(messages.requiredField),
          identification: yup.string().nullable().required(messages.requiredField),
        })
      )
      .min(1, messages.requiredField),
  });
};

/**
 * Resolver pronto para o `useForm({ resolver })`.
 * @param {LanguageDate} languageGB - Pacote de idioma ativo (mensagens de validação i18n).
 * @return {Function} Resolver ligado ao schema do módulo.
 */
export const birthAnimalSchemaResolver = (languageGB: LanguageDate) =>
  yupResolver(birthAnimalSchema(languageGB) as any);

export default birthAnimalSchemaResolver;
