// src/validations/schemas/Pastures/appropriation-schema.ts
// -----------------------------------------------------------------------------
// Schema de validação Yup do formulário de Apropriação/rateio de Pastagem
// (`PUT /pastures/{uuid}/appropriation`) — TASK-PAST-FE-07. Mirror
// `AppropriatePastureRequest::rules()`: `center_uuid`/`class` obrigatórios
// por linha; `vl_time` obrigatório SÓ para linhas de `equipments` (CALC-06).
// -----------------------------------------------------------------------------

import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

import fieldValidationSchema from '@/validations/field-validation-schema';

import type { LanguageDate } from '@/@types/language';

export const appropriationLinesSchema = (languageGB: LanguageDate) => {
  const fv = fieldValidationSchema(languageGB);
  const genericMessages = languageGB.defaltStrings.validations;

  const lineSchema = (requireVlTime: boolean) =>
    yup.object({
      uuid: yup.string().required(),
      label: yup.string().required(),
      center_uuid: fv.option(),
      class: fv.option<number>(),
      vl_time: requireVlTime
        ? yup
            .number()
            .transform((value, original) => (original === '' || original === null ? null : value))
            .required(genericMessages.requiredField)
            .min(0, genericMessages.invalidValue)
            .typeError(genericMessages.invalidValue)
        : yup
            .number()
            .transform((value, original) => (original === '' || original === null ? null : value))
            .nullable()
            .min(0, genericMessages.invalidValue)
            .typeError(genericMessages.invalidValue),
    });

  return yup.object({
    equipments: yup.array().of(lineSchema(true)),
    inputs: yup.array().of(lineSchema(false)),
    productions: yup.array().of(lineSchema(false)),
    services: yup.array().of(lineSchema(false)),
  });
};

/**
 * Resolver pronto para o `useForm({ resolver })` da tela de Apropriação.
 * @param {LanguageDate} languageGB - Pacote de idioma ativo.
 * @return {Function} Resolver ligado ao schema de apropriação.
 */
export const appropriationLinesSchemaResolver = (languageGB: LanguageDate) =>
  yupResolver(appropriationLinesSchema(languageGB) as any);

export default appropriationLinesSchemaResolver;
