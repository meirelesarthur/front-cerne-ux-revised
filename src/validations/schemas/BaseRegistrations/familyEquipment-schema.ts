// src/validations/schemas/BaseRegistrations/familyEquipment-schema.ts
// -----------------------------------------------------------------------------
// Schema de validação Yup do formulário de Família de Bens (TASK-FE-FE-02) —
// padrão da empresa: FUNÇÃO que recebe `languageGB` e devolve o schema
// (mensagens i18n). Mirror mecânico de CentroCusto/centro-custo-schema.ts.
//
// `residual` É obrigatório (0-100) SOMENTE quando `type_depreciation === 1`
// (COM_RESIDUAL) — via `.when('type_depreciation', ...)`, mesma forma
// (`then: (schema) => schema...`) já confirmada em tempo de execução contra
// esta versão do Yup em `centro-custo-schema.ts`. Espelha
// `FamilyEquipmentRequest::rules()` (api_root): `residual` ->
// `Rule::requiredIf(type_depreciation === COM_RESIDUAL)`.
//
// `image`/`removeImage` NÃO entram neste schema — são geridos fora do RHF
// (estado dedicado em `CreateOrUpdateFamilyEquipments.tsx`, convertidos para
// FormData só no submit) e validados client-side pelo próprio `ImageUpload`.
// Movido de src/pages/CadastrosBase/FamiliaBens para o padrão modular
// (validations/schemas/BaseRegistrations) — igual a diagnosisPregnancy-schema.ts.
// -----------------------------------------------------------------------------

import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

import { FamilyEquipmentDepreciationType } from '@/constants/FamilyEquipmentDepreciationType';

import type { LanguageDate } from '@/@types/language';

export const familyEquipmentSchema = (languageGB: LanguageDate) => {
  const messages = languageGB.baseRegistrations.familyEquipment.form.validation;

  return yup.object({
    description: yup
      .string()
      .trim()
      .required(messages.descriptionRequired)
      .max(100, messages.descriptionMaxLength),
    type_depreciation: yup
      .number()
      .oneOf(
        [
          FamilyEquipmentDepreciationType.SEM_RESIDUAL,
          FamilyEquipmentDepreciationType.COM_RESIDUAL,
        ],
        messages.typeDepreciationRequired
      )
      .required(messages.typeDepreciationRequired),
    depreciation: yup
      .number()
      .transform((value, original) => (original === '' || original === null ? null : value))
      .nullable()
      .min(0, messages.depreciationRange)
      .max(100, messages.depreciationRange),
    residual: yup
      .number()
      .transform((value, original) => (original === '' || original === null ? null : value))
      .nullable()
      .when('type_depreciation', {
        is: FamilyEquipmentDepreciationType.COM_RESIDUAL,
        then: (schema) =>
          schema
            .required(messages.residualRequired)
            .min(0, messages.residualRange)
            .max(100, messages.residualRange),
        otherwise: (schema) =>
          schema.min(0, messages.residualRange).max(100, messages.residualRange),
      }),
    life_bens: yup
      .number()
      .transform((value, original) => (original === '' || original === null ? null : value))
      .nullable()
      .integer(messages.lifeBensPositive)
      .positive(messages.lifeBensPositive),
    vl_time_productive: yup
      .number()
      .transform((value, original) => (original === '' || original === null ? null : value))
      .nullable()
      .min(0, messages.vlTimeMin),
    vl_time_unproductive: yup
      .number()
      .transform((value, original) => (original === '' || original === null ? null : value))
      .nullable()
      .min(0, messages.vlTimeMin),
    is_enabled: yup.boolean().required(),
  });
};

/**
 * Resolver pronto para o `useForm({ resolver })`.
 * @param {LanguageDate} languageGB - Pacote de idioma ativo (mensagens de validação i18n).
 * @return {Function} Resolver ligado ao schema do módulo.
 */
export const familyEquipmentSchemaResolver = (languageGB: LanguageDate) =>
  yupResolver(familyEquipmentSchema(languageGB)) as any;

export default familyEquipmentSchemaResolver;
