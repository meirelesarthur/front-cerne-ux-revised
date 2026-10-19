// src/validations/schemas/Weighing/weighing-schema.ts
// -----------------------------------------------------------------------------
// Schema de validação Yup do formulário de Pesagem (CRUD raiz, F-071,
// TASK-PES-FE-01). Fábrica `(languageGB) => resolver`, mirror
// `sanitary-schema.ts`. Schema NUNCA em `pages/` (SEVERIDADE inviolável).
//
// Client-side só impede submit de linha OBVIAMENTE incompleta — a
// autoridade final de negócio é sempre o 422 do backend (`WeighingRequest::
// rules()`, CTR-PES §7).
//
// Campos obrigatórios/condicionais (Tarefa, "Regras"):
//   - date obrigatório.
//   - batch_uuid XOR category_uuid (exatamente 1 preenchido).
//   - is_stock boolean; arroba_value obrigatório quando is_stock=true.
//   - animals mín. 1, cada linha com animal_uuid/weight/last_weight/
//     last_weight_date obrigatórios.
//   - sanitary boolean, só true permitido quando batch_uuid preenchido
//     (regra cruzada, mirror CL-024/OQ-P7).
//   - sanitary_items mín. 1 quando sanitary=true, cada item com
//     warehouse_uuid/product/measurement_uuid/quantity obrigatórios.
// -----------------------------------------------------------------------------

import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

import { isWeighingAnimalSemId } from '@/utils/weighingAnimalSemId';

import fieldValidationSchema from '@/validations/field-validation-schema';

import type { LanguageDate } from '@/@types/language';

export const weighingSchema = (languageGB: LanguageDate) => {
  const fv = fieldValidationSchema(languageGB);
  const msgs = languageGB.weighing.weighing.form.validation;

  // -- Linha de animal (mín. 1, contrato-tela §6.5) --
  const animalSchema = yup.object({
    row_uuid: yup.string().nullable(),
    animal_uuid: yup.object().nullable().required(msgs.animalRequired),
    weight: yup
      .number()
      .transform((_value, original) =>
        original === '' || original == null ? undefined : Number(original)
      )
      .typeError(msgs.weightRequired)
      .required(msgs.weightRequired),
    // Informado pelo cliente — servidor nunca recalcula (CTR-PES §2).
    last_weight: yup
      .number()
      .transform((_value, original) =>
        original === '' || original == null ? undefined : Number(original)
      )
      .typeError(msgs.lastWeightRequired)
      .when('animal_uuid', {
        // Animal S/ID: Último Peso/Data ficam vazios (legado) — não obrigatórios.
        is: (animal: { label?: string } | null) => isWeighingAnimalSemId(animal),
        then: (schema) => schema.notRequired(),
        otherwise: (schema) => schema.required(msgs.lastWeightRequired),
      }),
    last_weight_date: yup
      .string()
      .nullable()
      .when('animal_uuid', {
        is: (animal: { label?: string } | null) => isWeighingAnimalSemId(animal),
        then: (schema) => schema.notRequired(),
        otherwise: (schema) => schema.required(msgs.lastWeightDateRequired),
      }),
    has_ultrasound: yup.boolean().default(false),
    // Correção de fidelidade (97-Esteiras/002 execução 002 lane C) — mirror
    // `processing-schema.ts` (`required_if:has_ultrasound,true` que a API já
    // valida em `WeighingRequest::guardUltrasoundFields()`): feedback
    // client-side imediato, servidor continua autoridade final.
    aol: yup
      .number()
      .nullable()
      .typeError(msgs.aolRequired)
      .when('has_ultrasound', {
        is: true,
        then: (schema) => schema.required(msgs.aolRequired),
      }),
    egs: yup
      .number()
      .nullable()
      .typeError(msgs.egsRequired)
      .when('has_ultrasound', {
        is: true,
        then: (schema) => schema.required(msgs.egsRequired),
      }),
    marm: yup
      .number()
      .nullable()
      .typeError(msgs.marmRequired)
      .when('has_ultrasound', {
        is: true,
        then: (schema) => schema.required(msgs.marmRequired),
      }),
    classification: yup
      .string()
      .nullable()
      .max(1, msgs.classificationMaxLength)
      .when('has_ultrasound', {
        is: true,
        then: (schema) => schema.required(msgs.classificationRequired),
      }),
  });

  // -- Item do bloco sanitário embutido (mín. 1 quando sanitary=true,
  // contrato-tela §6.6, mirror ADR-FE-PES-00) --
  const sanitaryItemSchema = yup.object({
    row_uuid: yup.string().nullable(),
    warehouse_uuid: yup.object().nullable().required(msgs.warehouseRequired),
    // Opção = linha de `Stock` (produto+lote), mirror `sanitary-schema.ts`.
    product: yup.object().nullable().required(msgs.productRequired),
    measurement_uuid: yup.object().nullable().required(msgs.measurementRequired),
    quantity: yup
      .number()
      .transform((_value, original) =>
        original === '' || original == null ? undefined : Number(original)
      )
      .typeError(msgs.quantityRequired)
      .required(msgs.quantityRequired)
      .min(0, msgs.quantityMin),
    note: yup.string().nullable(),
  });

  return yup.object({
    date: fv.date(),
    // Lote XOR Categoria — exatamente 1 preenchido, no form E no filtro
    // (contrato-tela §6.4/§8.3). O teste vive em cada campo (`context.parent`)
    // para que o erro apareça no Select certo.
    batch_uuid: yup
      .object()
      .nullable()
      .test('batch-xor-category', msgs.batchOrCategoryRequired, (value, context) => {
        const categoryUuid = context.parent?.category_uuid;
        return (!!value && !categoryUuid) || (!value && !!categoryUuid);
      }),
    category_uuid: yup
      .object()
      .nullable()
      .test('category-xor-batch', msgs.batchOrCategoryRequired, (value, context) => {
        const batchUuid = context.parent?.batch_uuid;
        return (!!value && !batchUuid) || (!value && !!batchUuid);
      }),
    is_stock: yup.boolean().default(false),
    // Obrigatório só quando `is_stock=true` (contrato-tela §6.4/§8.7).
    arroba_value: yup
      .number()
      .transform((_value, original) =>
        original === '' || original == null ? undefined : Number(original)
      )
      .when('is_stock', {
        is: true,
        then: (schema) =>
          schema.typeError(msgs.arrobaValueRequired).required(msgs.arrobaValueRequired),
        otherwise: (schema) => schema.nullable(),
      }),
    animals: yup.array().of(animalSchema).min(1, msgs.animalsRequired),
    // `sanitary=true` só é possível com `batch_uuid` preenchido — regra
    // cruzada preservada (CL-024/OQ-P7, contrato-tela §6.4/§8.5).
    sanitary: yup
      .boolean()
      .default(false)
      .test('sanitary-requires-batch', msgs.batchOrCategoryRequired, (value, context) => {
        if (!value) return true;
        return !!context.parent?.batch_uuid;
      }),
    // Só validado linha-a-linha quando `sanitary=true` — o bloco fica oculto
    // (não removido do form state) quando `false`, mas não pode bloquear
    // submit (mirror `sanitary-schema.ts` §"labor"; `weighing-form-mapper.ts`,
    // Tarefa 39, é quem omite a chave `sanitary_data` do payload nesse caso).
    sanitary_items: yup.array().when('sanitary', {
      is: true,
      then: (schema) => schema.of(sanitaryItemSchema).min(1, msgs.itemsRequired),
      otherwise: (schema) => schema.nullable(),
    }),
  });
};

/**
 * Resolver pronto para o `useForm({ resolver })` — mirror
 * `sanitarySchemaResolver`.
 * @param {LanguageDate} languageGB - Pacote de idioma ativo.
 * @return {Function} Resolver ligado ao schema do módulo.
 */
export const weighingSchemaResolver = (languageGB: LanguageDate) =>
  yupResolver(weighingSchema(languageGB) as any);

export default weighingSchemaResolver;
