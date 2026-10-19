// src/validations/schemas/LoteFazenda/newBatch-schema.ts
// -----------------------------------------------------------------------------
// Schema de validação Yup do modal "Novo Lote" (`DLG-BATCH`/`FRM-BATCH`,
// 97-Esteiras/041, TASK-FE-041-LF-03), espelhando `BatchRequest::rules()`
// (lido no código real, `GB.Cerne.Api`, `POST /batches`, F-BT01-13):
// `description` (required, max 200), `date` (required), `employee_uuid`
// (opcional), `specie_uuid` (required), `category_uuids` (required, min 1),
// `corral_uuid`/`parameter_weight_uuid` (opcionais). SEM `animal_uuids` —
// este modal cria um Lote vazio (o wizard de Processamentos popula os
// animais depois).
// -----------------------------------------------------------------------------

import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

import type { LanguageDate } from '@/@types/language';

const optionSchema = yup
  .object({ value: yup.mixed(), label: yup.string() })
  .nullable()
  .default(null);

/**
 * Schema do modal "Novo Lote".
 * @param {LanguageDate} languageGB - Pacote de idioma ativo (mensagens de validação i18n).
 * @return {yup.ObjectSchema<any>} Schema Yup do modal.
 */
export const newBatchSchema = (languageGB: LanguageDate) => {
  const messages = languageGB.loteFazenda.newBatch.validation;

  return yup.object({
    description: yup.string().trim().max(200).required(messages.descriptionRequired),
    date: yup.string().trim().nullable().required(messages.dateRequired),
    employee_uuid: optionSchema,
    specie_uuid: optionSchema.required(messages.specieRequired),
    category_uuids: yup
      .array()
      .of(optionSchema)
      .min(1, messages.categoriesRequired)
      .required(messages.categoriesRequired),
    corral_uuid: optionSchema,
    parameter_weight_uuid: optionSchema,
  });
};

/**
 * Resolver pronto para o `useForm({ resolver })`.
 * @param {LanguageDate} languageGB - Pacote de idioma ativo (mensagens de validação i18n).
 * @return {Function} Resolver ligado ao schema do modal "Novo Lote".
 */
export const newBatchSchemaResolver = (languageGB: LanguageDate) =>
  yupResolver(newBatchSchema(languageGB)) as any;
