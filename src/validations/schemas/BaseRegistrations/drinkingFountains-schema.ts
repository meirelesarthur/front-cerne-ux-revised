// src/validations/schemas/BaseRegistrations/drinkingFountains-schema.ts
// -----------------------------------------------------------------------------
// Schema de validação Yup do formulário de Bebedouros (DrinkingFountain).
// Fábrica que recebe `languageGB`, mesma convenção de
// `diagnosisPregnancy-schema.ts`/`parameterWeights-schema.ts`. Mirror
// client-side de `DrinkingFountainRequest` (api_root):
//   type: required|Rule::enum(ShelterTypeEnum)
//   description: required|string|max:100
//   total_area ("Volume(L)"): required|numeric|min:0
//   length ("Comprimento(cm)"): nullable|numeric|min:0 — D5-BEB, SEM limite
//     superior artificial, campo que `Trough` NÃO tem.
//   area_uuid/grazing_uuid/feedlot_corral_uuid: nullable (XOR Área×Módulo é
//     regra de UI — desabilita o campo oposto, ver
//     `CreateOrUpdateDrinkingFountain.tsx` — o 422 de negócio do servidor é
//     tratado via `setError`, não duplicado aqui em Yup).
//   is_enabled: required|boolean
// -----------------------------------------------------------------------------

import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

import { GUID_REGEX } from '@/utils/guid';

import fieldValidationSchema from '@/validations/field-validation-schema';

import type { LanguageDate } from '@/@types/language';

export const drinkingFountainSchema = (languageGB: LanguageDate) => {
  const v = fieldValidationSchema(languageGB);
  const messages = languageGB.baseRegistrations.drinkingFountain.form.validation;

  return yup.object({
    type: yup.string().required(messages.typeRequired),
    description: yup
      .string()
      .trim()
      .required(messages.descriptionRequired)
      .max(100, messages.descriptionMaxLength),
    total_area: v.number().required(messages.totalAreaRequired).min(0, messages.totalAreaMin),
    // `length` — opcional de verdade (D5-BEB): `v.number()` sempre exige
    // valor, por isso `yup.number()` cru aqui, com `transform` convertendo
    // string vazia/`null` em `null` explícito (nunca `NaN`).
    length: yup
      .number()
      .transform((value, original) =>
        original === '' || original === null || original === undefined ? null : value
      )
      .nullable()
      .min(0, messages.lengthMin),
    area_uuid: yup.string().matches(GUID_REGEX, { excludeEmptyString: true }).nullable(),
    grazing_uuid: yup.string().matches(GUID_REGEX, { excludeEmptyString: true }).nullable(),
    feedlot_corral_uuid: yup.string().matches(GUID_REGEX, { excludeEmptyString: true }).nullable(),
    is_enabled: yup.boolean().required(messages.activeRequired),
  });
};

/**
 * Resolver pronto para o `useForm({ resolver })`.
 * @param {LanguageDate} languageGB - Pacote de idioma ativo (mensagens de validação i18n).
 * @return {Function} Resolver ligado ao schema do módulo.
 */
export const drinkingFountainSchemaResolver = (languageGB: LanguageDate) =>
  yupResolver(drinkingFountainSchema(languageGB));

export default drinkingFountainSchemaResolver;
