// src/validations/schemas/BreedingMating/breeding-mating-schema.ts
// -----------------------------------------------------------------------------
// Schema de validação Yup do formulário "Acasalamento" (BreedingMating —
// Operacional / Reprodução, F-016, 97-Esteiras/001, Tarefa 02), espelhando
// `field_matrix`/CLM-004 (contrato de tela §6.3, §5.3). Todo validator sai de
// `fieldValidationSchema(languageGB)` — proibido `yup.string().required(...)`
// escrito à mão (regra não-negociável da Tarefa). Vive em
// `src/validations/schemas/BreedingMating/` (pasta pelo NOME DA ENTIDADE,
// nunca em `src/pages/`).
//
// ⚠️ AUTORIDADE: este schema é a PRIMEIRA barreira, não a única — o
// `field_matrix` devolvido por `EP-BM-03`/`EP-BM-04` é quem decide
// required/visible em runtime; este schema nunca pode ficar MAIS restritivo
// que ele. `type` e `protocol_uuid` são imutáveis no update (CLM-002) — a
// tela de edição não reenvia esses campos (`UpdateBreedingMatingRequest`).
// -----------------------------------------------------------------------------

import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

import fieldValidationSchema from '@/validations/field-validation-schema';

import type { LanguageDate } from '@/@types/language';
import type {
  BreedingMatingForm,
  BreedingMatingNaturalFormValue,
  BreedingMatingProtocolAnimalFormValue,
  BreedingMatingSimplifiedAnimalFormValue,
} from '@/@types/v2/BreedingMating';
import type Shape from '@/@types/validations/shape';

const optionSchema = yup
  .object({ value: yup.mixed(), label: yup.string() })
  .nullable()
  .default(null);

export const breedingMatingSchema = (languageGB: LanguageDate) => {
  const fv = fieldValidationSchema(languageGB);
  const messages = languageGB.breedingMatings.breedingMating.form.validation;

  // Estação/Touro-Sêmen-Embrião/Lote — obrigatórios no modo Normal
  // (`launch_type=1`), OPCIONAIS quando `launch_type=2` (CLM-004, regra 7 da
  // Tarefa). `optionSchema` já é `nullable()` por padrão — o `.when()` só
  // ACRESCENTA `.required()` no ramo Normal.
  const cascadeFieldSchema = (requiredMessage: string) =>
    optionSchema.when('launch_type', {
      is: (launchType: { value?: number } | null) => launchType?.value !== 2,
      then: (schema) => schema.required(requiredMessage),
    });

  return yup.object({
    code: yup.string().required(),
    date: fv.date(),
    responsible_name: yup.string().nullable(), // InputReadOnly nunca sincronizado em modo criação — GAP-FE-BM-08
    // Campo interno de carregamento/ressubmissão (mirror `type`/`protocol_uuid`), nunca um
    // input visível — autoridade real de required/formato é o backend (`ERRO-03`).
    protocol_identification: yup.string().nullable(),
    type: optionSchema.required(messages.typeRequired),
    launch_type: optionSchema.required(messages.launchTypeRequired),
    breeding_season: cascadeFieldSchema(messages.breedingSeasonRequired),
    bull_seed_season: cascadeFieldSchema(messages.bullSeedSeasonRequired),
    // Protocolo — obrigatório SÓ para IATF/FIV (`type != 1`) em modo Normal
    // (`launch_type=1`); NATURAL nunca exige (forçado vazio/oculto, C1) e
    // Simplificado dispensa (CLM-004).
    protocol: optionSchema.when(['type', 'launch_type'], {
      is: (type: { value?: number } | null, launchType: { value?: number } | null) =>
        type?.value !== 1 && launchType?.value !== 2,
      then: (schema) => schema.required(messages.protocolRequired),
    }),
    breeding_batch: cascadeFieldSchema(messages.breedingBatchRequired),

    // Bloco Natural — exigido SÓ quando `type.value === 1` (mensagens
    // literais do legado, regra 4 da Tarefa 01: `Selecione um touro` /
    // `Selecione ao menos uma vaca`).
    natural: yup
      .object()
      .shape<Shape<BreedingMatingNaturalFormValue>>({
        bull: optionSchema,
        cows: yup.array().of(optionSchema),
      })
      .when('type', {
        is: (type: { value?: number } | null) => type?.value === 1,
        then: (schema) =>
          schema.shape<Shape<BreedingMatingNaturalFormValue>>({
            bull: optionSchema.required(messages.naturalBullRequired),
            cows: yup.array().of(optionSchema).min(1, messages.naturalCowsRequired),
          }),
      }),

    // Linhas de Protocolo — exigidas SÓ para IATF/FIV em modo Normal
    // (`type != 1 && launch_type == 1`). Cada linha exige `animal`; `Apta`
    // controla a obrigatoriedade entre `Produtos` e `Transferência/Lote` (C9)
    // — mas a autoridade real de estoque/campo é o `field_matrix` do
    // servidor, este `.test()` só cobre a presença mínima da linha.
    protocol_animals: yup
      .array()
      .of(
        yup.object().shape<Shape<BreedingMatingProtocolAnimalFormValue>>({
          animal: optionSchema.required(messages.protocolAnimalRequired),
          time: yup.string().nullable(),
          body_score: optionSchema,
          ink: optionSchema,
          eligible: yup.boolean().default(true),
          provider: optionSchema,
          products: yup.array().of(optionSchema),
          semen_or_embryo: optionSchema,
          batch: optionSchema,
        })
      )
      .when(['type', 'launch_type'], {
        is: (type: { value?: number } | null, launchType: { value?: number } | null) =>
          type?.value !== 1 && launchType?.value === 1,
        then: (schema) => schema.min(1, messages.protocolAnimalRequired),
      }),

    // Linhas do Simplificado — exigidas SÓ quando `launch_type.value === 2`
    // (CLM-004). Mensagens literais derivadas de `fieldValidationSchema`.
    simplified_animals: yup
      .array()
      .of(
        yup.object().shape<Shape<BreedingMatingSimplifiedAnimalFormValue>>({
          animal: optionSchema.required(messages.simplifiedAnimalRequired),
          warehouse: optionSchema.required(messages.simplifiedWarehouseRequired),
          product: optionSchema.required(messages.simplifiedProductRequired),
          measurement: optionSchema.required(messages.simplifiedMeasurementRequired),
          stock: yup.number().nullable(),
          quantity: yup
            .number()
            .transform((value, original) =>
              original === '' || original === null ? undefined : value
            )
            .typeError(messages.simplifiedQuantityRequired)
            .required(messages.simplifiedQuantityRequired)
            .moreThan(0, messages.simplifiedQuantityRequired),
          provider: optionSchema,
        })
      )
      .when('launch_type', {
        is: (launchType: { value?: number } | null) => launchType?.value === 2,
        then: (schema) => schema.min(1, messages.simplifiedAnimalRequired),
      }),
  });
};

export const breedingMatingSchemaResolver = (languageGB: LanguageDate) =>
  yupResolver(breedingMatingSchema(languageGB)) as any;

export default breedingMatingSchemaResolver;

// Re-exportado só para teste unitário do schema (cenários da Tarefa) sem
// acoplar o teste ao resolver.
export type { BreedingMatingForm };
