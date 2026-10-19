// src/validations/schemas/Weaning/weaning-schema.ts
// -----------------------------------------------------------------------------
// Schema de validação Yup do formulário de Desmama (Weaning — Operacional >
// Pecuária > Manejo, TASK-WN-FE-01/04). Mirror estrutural de
// `validations/schemas/BirthAnimals/birth-animal-schema.ts` (FUNÇÃO que
// recebe `languageGB`, usa `fieldValidationSchema(languageGB)`, mensagens
// sempre derivadas de `languageGB.defaltStrings.validations`).
//
// `type` permanece obrigatório no schema mesmo em modo editar — o campo é
// `InputReadOnly` na UI (nunca editável depois de criado, mirror CLM-030) e
// já vem preenchido pela hidratação (`fillWeaningForm`), então a validação
// nunca bloqueia o submit de edição; ela apenas garante que o criar exija
// a escolha do tipo.
//
// `animal_uuids` — uuid do `Animal` (MÃE), mínimo 1 sempre
// (`WeaningRequest::rules()` real: `required|array|min:1`).
// -----------------------------------------------------------------------------

import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

import fieldValidationSchema from '@/validations/field-validation-schema';

import type { LanguageDate } from '@/@types/language';

export const weaningSchema = (languageGB: LanguageDate) => {
  const v = fieldValidationSchema(languageGB);
  const messages = languageGB.defaltStrings.validations;

  return yup.object({
    date: v.date(),
    type: yup.mixed().nullable().required(messages.requiredField),
    batch_uuid: v.option(),

    // Opcional e independente de `batch_uuid` (`WeaningRequest::rules()`
    // real: `sometimes|nullable`) — nunca obrigatório.
    // Regra adicional (UT-000794): não pode ser igual ao lote de origem — a API
    // grava null em silêncio nesse caso (StoreWeaningAction), o registro
    // reabriria com o campo vazio.
    transfer_batch_uuid: yup
      .mixed()
      .nullable()
      .test(
        'transfer-different-from-origin',
        languageGB.weaning.weaning.form.validation.transferSameAsOrigin,
        (value: any, ctx) => {
          const origin = (ctx.parent as any)?.batch_uuid;
          if (!value?.value || !origin?.value) return true;
          return value.value !== origin.value;
        }
      ),

    animal_uuids: yup.array().min(1, messages.requiredField).required(messages.requiredField),
  });
};

/**
 * Resolver pronto para o `useForm({ resolver })`.
 * @param {LanguageDate} languageGB - Pacote de idioma ativo (mensagens de validação i18n).
 * @return {Function} Resolver ligado ao schema do módulo.
 */
export const weaningSchemaResolver = (languageGB: LanguageDate) =>
  yupResolver(weaningSchema(languageGB) as any);

export default weaningSchemaResolver;
