// src/validations/schemas/Processamentos/processing-schema.ts
// -----------------------------------------------------------------------------
// Schema de validação Yup do formulário de FINALIZAÇÃO de Processamentos
// (Processing — Operacional > Pecuária, 97-Esteiras/039, TASK-FE-039-PROC-01),
// espelhando `ProcessingRequest::rules()` (lido no código real, `GB.Cerne.Api`)
// + fidelidade de UX ao molde `transferAbcBatch-schema.ts` (mesma esteira,
// mesma classe de formulário: cabeçalho + repeater de animais).
//
// `arroba_value` — obrigatório SOMENTE quando `is_stock===true`, mirror
// EXATO do `Rule::requiredIf($this->boolean('is_stock'))` real do backend
// (front-plan-proc.md §1.3/§3.4.1) — o front envia `is_stock` como boolean
// real, nunca string (item de alto risco p/ E2E do task-packet).
//
// round-5 (correção do dono) — "Status Reprodutivo" (`reproductive_status`,
// round-4) REMOVIDO por completo. `category_matrice_uuid` ("Estágio
// Reprodutivo") passa a ser obrigatório quando a categoria é FÊMEA
// (`is_reproductive===true`, opção da Categoria/`prepare.category`, gravada
// no RHF por linha em `ProcessingAnimalRow.tsx`) — o `.when()` abaixo
// referencia esse irmão do mesmo objeto do array. O 422 real do servidor
// continua a autoridade final por trás do espelho client-side.
//
// `identifications[]` — mínimo 1 linha por animal (mirror `required|array`
// do backend), sub-schema idêntico a `birth-animal-schema.ts`
// (`id_animal_uuid`+`identification`, mesmo catálogo físico `id_animals`).
// -----------------------------------------------------------------------------

import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

import type { LanguageDate } from '@/@types/language';
import type {
  ProcessingAnimalForm,
  ProcessingAnimalIdentificationForm,
  SanitaryItemForm,
} from '@/@types/v2/Processamentos/processing';
import type Shape from '@/@types/validations/shape';

const optionSchema = yup
  .object({ value: yup.mixed(), label: yup.string() })
  .nullable()
  .default(null);

/**
 * Schema de finalização (`finish`) — cabeçalho (`date`/`is_stock`/
 * `arroba_value`) + repeater `animals[]` (cascata specie→category→breed,
 * lote, peso/valor, status reprodutivo condicional, sub-repeater de
 * identificações).
 * @param {LanguageDate} languageGB - Pacote de idioma ativo (mensagens de validação i18n).
 * @return {yup.ObjectSchema<any>} Schema Yup de finalização.
 */
export const processingFinishSchema = (languageGB: LanguageDate) => {
  const messages = languageGB.processamentos.processing.form.validation;

  return yup.object({
    date: yup.string().trim().required(messages.dateRequired),

    is_stock: yup.boolean().default(false),

    // Mirror EXATO do `Rule::requiredIf` real do backend — só exige quando
    // `is_stock===true` (boolean real, nunca string).
    arroba_value: yup
      .number()
      .nullable()
      .typeError(messages.numberType)
      .when('is_stock', {
        is: true,
        then: (schema) => schema.required(messages.arrobaValueRequired).min(0, messages.numberType),
      }),

    // Onda 1 (PROCFID-01) — a FLAG; ao desligar, `FinishProcessing.tsx` zera
    // `sanitary_items` (mirror do gesto já usado para `arroba_value`).
    sanitary: yup.boolean().default(false),

    // Onda 2 (PROCFID-04) — bloco "Item Sanitário". Mirror EXATO do gate
    // `guardSanitaryItems`/`required_if:sanitary,true` do backend: `.min(1)`
    // SOMENTE quando `sanitary===true` — com `sanitary===false` o array é
    // sempre `[]` (client nunca bloqueia por um bloco que não vai existir).
    sanitary_items: yup
      .array()
      .of(
        yup.object().shape<Shape<SanitaryItemForm>>({
          warehouse_uuid: optionSchema.required(messages.sanitaryWarehouseRequired),
          product_uuid: optionSchema.required(messages.sanitaryProductRequired),
          measurement_uuid: optionSchema.required(messages.sanitaryMeasurementRequired),
          quantity: yup
            .number()
            .nullable()
            .typeError(messages.numberType)
            .moreThan(0, messages.sanitaryQuantityRequired)
            .required(messages.sanitaryQuantityRequired),
          observation: yup.string().nullable().default(null),
        })
      )
      .when('sanitary', {
        is: true,
        then: (schema) => schema.min(1, messages.sanitaryItemsMin),
      }),

    animals: yup
      .array()
      .of(
        yup.object().shape<Shape<ProcessingAnimalForm>>({
          category_uuid: optionSchema.required(messages.categoryRequired),
          breed_uuid: optionSchema.required(messages.breedRequired),
          batch_uuid: optionSchema.required(messages.batchRequired),
          weight: yup
            .number()
            .nullable()
            .typeError(messages.numberType)
            .moreThan(0, messages.weightRequired)
            .required(messages.weightRequired),
          value: yup
            .number()
            .nullable()
            .typeError(messages.numberType)
            .min(0, messages.valueRequired)
            .required(messages.valueRequired),
          // CAMPO DE UI (round-5) — `is_reproductive` da categoria
          // selecionada (opção/`prepare.category`), NUNCA no payload.
          is_reproductive: yup.boolean().default(false),
          // round-5 (correção do dono) — obrigatório INLINE quando a
          // categoria é FÊMEA (`is_reproductive===true`), não mais só um
          // toast global 422.
          category_matrice_uuid: optionSchema.when('is_reproductive', {
            is: true,
            then: (schema) => schema.required(messages.categoryMatriceRequired),
          }),
          // Onda 1 (PROCFID-02) — sem obrigatoriedade, Optional também no servidor.
          birth_date: yup.string().nullable().default(null),
          has_ultrasound: yup.boolean().default(false),
          // Mirror `required_if:has_ultrasound,true` que a API adiciona como
          // RECOMMENDED (front-plan-proc-fidelidade-sanitaria-rework.md §2.3)
          // — feedback client-side imediato, servidor continua autoridade final.
          aol: yup
            .number()
            .nullable()
            .typeError(messages.numberType)
            .when('has_ultrasound', {
              is: true,
              then: (schema) => schema.required(messages.aolRequired),
            }),
          egs: yup
            .number()
            .nullable()
            .typeError(messages.numberType)
            .when('has_ultrasound', {
              is: true,
              then: (schema) => schema.required(messages.egsRequired),
            }),
          marm: yup
            .number()
            .nullable()
            .typeError(messages.numberType)
            .when('has_ultrasound', {
              is: true,
              then: (schema) => schema.required(messages.marmRequired),
            }),
          classification: yup
            .string()
            .nullable()
            .max(1, messages.classificationMaxLength)
            .when('has_ultrasound', {
              is: true,
              then: (schema) => schema.required(messages.classificationRequired),
            }),
          identifications: yup
            .array()
            .of(
              yup.object().shape<Shape<ProcessingAnimalIdentificationForm>>({
                id_animal_uuid: optionSchema.required(messages.identificationTypeRequired),
                identification: yup.string().trim().required(messages.identificationRequired),
              })
            )
            .min(1, messages.identificationsMin),
        })
      )
      .min(1, messages.animalsMin),
  });
};

/**
 * Resolver pronto para o `useForm({ resolver })`.
 * @param {LanguageDate} languageGB - Pacote de idioma ativo (mensagens de validação i18n).
 * @return {Function} Resolver ligado ao schema de finalização do módulo.
 */
export const processingFinishSchemaResolver = (languageGB: LanguageDate) =>
  yupResolver(processingFinishSchema(languageGB)) as any;

export default processingFinishSchemaResolver;
