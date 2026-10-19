// src/validations/schemas/Pastures/pasture-schema.ts
// -----------------------------------------------------------------------------
// Schema de validação Yup do formulário de Pastagem (Pasture) —
// TASK-PAST-FE-00 (fundação) + FE-03/04/05 (regras por linha das 5 listas).
// Fábrica `(languageGB) => resolver`, mirror `appropriation-schema.ts`.
// Client-side só impede submit de linha OBVIAMENTE incompleta — a
// autoridade final de negócio é sempre o 422 do backend
// (`PastureRequest::rules()`).
// -----------------------------------------------------------------------------

import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

import fieldValidationSchema from '@/validations/field-validation-schema';

import type { LanguageDate } from '@/@types/language';

export const pastureSchema = (languageGB: LanguageDate) => {
  const fv = fieldValidationSchema(languageGB);
  const genericMessages = languageGB.defaltStrings.validations;
  const formMessages = languageGB.pastures.pasture.form.errors;

  const optionalNumberMin0 = () =>
    yup
      .number()
      .transform((value, original) =>
        original === '' || original === null || original === undefined ? null : value
      )
      .nullable()
      .min(0, genericMessages.invalidValue)
      .typeError(genericMessages.invalidValue);

  // Área XOR Módulo de Pastejo — mirror AC-REQ-01 (`area_uuid`
  // `required_without:grazing_uuid`+`prohibits:grazing_uuid`, e vice-versa).
  // Client-side é UX antecipada; a autoridade final é o 422 do backend.
  function areaXorGrazing(value: unknown, context: yup.TestContext) {
    const area = context.parent?.area_uuid;
    const grazing = context.parent?.grazing_uuid;
    return Boolean(area) !== Boolean(grazing);
  }

  const equipmentItemSchema = yup.object({
    equipment_uuid: fv.option(),
    measurement_uuid: fv.option(),
    start_hour_meter: optionalNumberMin0(),
    end_hour_meter: optionalNumberMin0(),
    note: yup.string().nullable(),
  });

  const serviceItemSchema = yup.object({
    func_type: fv.option<number>(),
    employee_uuid: yup.mixed().nullable(),
    function_uuid: yup.mixed().nullable(),
    provider_uuid: yup.mixed().nullable(),
    measurement_uuid: fv.option(),
    quantity: optionalNumberMin0(),
    total_quantity: optionalNumberMin0(),
  });

  const inputItemSchema = yup.object({
    stock_uuid: fv.option(),
    measurement_uuid: fv.option(),
    quantity: optionalNumberMin0(),
    quantity_unitary: optionalNumberMin0(),
    total_quantity: optionalNumberMin0(),
  });

  const productionItemSchema = yup.object({
    product_uuid: fv.option(),
    measurement_uuid: fv.option(),
    quantity: yup
      .number()
      .transform((value, original) => (original === '' || original === null ? null : value))
      .required(genericMessages.requiredField)
      .moreThan(0, genericMessages.invalidValue)
      .typeError(genericMessages.invalidValue),
    note: yup.string().nullable(),
  });

  const occurrenceImageSchema = yup.object({
    latitude: yup.number().default(0),
    longitude: yup.number().default(0),
    existingUrl: yup.string().nullable(),
    file: yup.mixed().nullable(),
  });

  // CLM-53 — a Action só persiste a linha se `recommendation` não for
  // vazio (diferente de Appropriations, que exige `diagnosis`), fiel ao
  // legado (`PastureController@store/@update`, `agro365`:
  // `if (! empty($occurrence['recommendation']))`). Sem `.required()`
  // incondicional (o usuário pode adicionar uma linha TOTALMENTE vazia por
  // engano — essa linha é ignorada em silêncio, nunca bloqueia) — a
  // filtragem por "linha relevante" acontece no submit (mirror
  // `hasAtLeastOneAppropriationItem`).
  //
  // TASK-PAST-FIX-FE-02c (decisão do dono, correção de fidelidade) —
  // `recommendation` passa a ser CONDICIONALMENTE obrigatório: quando a
  // linha já tem CONTEÚDO (imagem e/ou diagnóstico preenchido), a
  // Recomendação passa a ser exigida — bloqueia o submit com aviso claro em
  // vez de deixar o backend descartar a linha em silêncio (perdendo a
  // imagem sem o usuário entender o motivo). Linha totalmente vazia
  // continua passando (`hasContent` falso → `true`, sem erro).
  function occurrenceHasContentWithoutRecommendation(
    value: string | null | undefined,
    context: yup.TestContext
  ): boolean {
    const diagnosis = context.parent?.diagnosis as string | null | undefined;
    const images = context.parent?.images as unknown[] | undefined;
    const hasContent = !!diagnosis?.trim() || !!images?.length;
    if (!hasContent) return true;
    return !!value?.trim();
  }

  const occurrenceItemSchema = yup.object({
    diagnosis: yup.string().nullable(),
    recommendation: yup
      .string()
      .nullable()
      .test(
        'occurrence-recommendation-required-with-content',
        formMessages.occurrenceRecommendationRequired,
        occurrenceHasContentWithoutRecommendation
      ),
    priority: fv.option(),
    images: yup.array().of(occurrenceImageSchema).max(3, genericMessages.invalidValue),
  });

  return yup.object({
    date: fv.date(),
    area_uuid: yup
      .mixed()
      .nullable()
      .test('area-xor-grazing', formMessages.areaOrGrazingRequired, areaXorGrazing),
    grazing_uuid: yup
      .mixed()
      .nullable()
      .test('area-xor-grazing', formMessages.areaOrGrazingRequired, areaXorGrazing),
    operation_uuid: fv.option(),
    activity_uuid: fv.option(),
    batch_uuid: yup.mixed().nullable(),
    animal_uuid: yup.mixed().nullable(),
    inputs_warehouse_uuid: yup.mixed().nullable(),
    productions_warehouse_uuid: yup.mixed().nullable(),
    equipments: yup.array().of(equipmentItemSchema),
    services: yup.array().of(serviceItemSchema),
    inputs: yup.array().of(inputItemSchema),
    productions: yup.array().of(productionItemSchema),
    occurrences: yup.array().of(occurrenceItemSchema),
  });
};

/**
 * Resolver pronto para o `useForm({ resolver })` — mirror `appropriationSchemaResolver`.
 * @param {LanguageDate} languageGB - Pacote de idioma ativo.
 * @return {Function} Resolver ligado ao schema do módulo.
 */
export const pastureSchemaResolver = (languageGB: LanguageDate) =>
  yupResolver(pastureSchema(languageGB) as any);

export default pastureSchemaResolver;
