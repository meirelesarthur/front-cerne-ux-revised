import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

import { isValidPlate } from '@/utils/masks/plate';

import fieldValidationSchema from '@/validations/field-validation-schema';

import type { LanguageDate } from '@/@types/language';

export const equipmentDialogSchema = (languageGB: LanguageDate) => {
  const v = fieldValidationSchema(languageGB);
  const messages = languageGB.equipments.equipment.form.validation;

  return yup.object({
    familyEquipment: v.option<string>().required(messages.familyRequired),
    description: yup
      .string()
      .trim()
      .required(messages.descriptionRequired)
      .max(60, messages.descriptionMaxLength),
    model: yup.string().trim().nullable().max(30, messages.modelMaxLength),
    useFiscal: yup.boolean().default(true),
    equipmentType: v.optionalOption<string>().when('useFiscal', {
      is: true,
      then: (schema) => schema.required(messages.typeRequiredWithFiscal),
    }),
    yearMod: yup.string().trim().nullable().required(messages.yearModRequired),
    brand: yup.string().trim().nullable(),
    // UT-000787 (D4): formato estrito só com `useFiscal`; sem fiscal, livre (max 10).
    plate: yup
      .string()
      .trim()
      .nullable()
      .max(10, messages.plateMaxLength)
      .when('useFiscal', {
        is: true,
        then: (schema) =>
          schema.test(
            'plate-format',
            languageGB.defaltStrings.validations.plateInvalid,
            (value) => !value || isValidPlate(value)
          ),
      }),
    uf: v.optionalOption<string>(),
    color: yup.string().trim().nullable().max(10, messages.colorMaxLength),
    bodyType: yup
      .mixed()
      .nullable()
      .when('useFiscal', {
        is: true,
        then: (schema) => schema.required(messages.bodyTypeRequiredWithFiscal),
      }),
    wheelType: yup
      .mixed()
      .nullable()
      .when('useFiscal', {
        is: true,
        then: (schema) => schema.required(messages.wheelTypeRequiredWithFiscal),
      }),
    tara: yup
      .number()
      .transform((value, original) => (original === '' || original === null ? null : value))
      .nullable()
      .when('useFiscal', {
        is: true,
        then: (schema) => schema.required(messages.taraRequiredWithFiscal),
      }),
    capacity: yup
      .number()
      .transform((value, original) => (original === '' || original === null ? null : value))
      .nullable()
      .when('useFiscal', {
        is: true,
        then: (schema) => schema.required(messages.capacityRequiredWithFiscal),
      }),
    ownerType: yup
      .mixed()
      .nullable()
      .when('useFiscal', {
        is: true,
        then: (schema) => schema.required(messages.ownerTypeRequiredWithFiscal),
      }),
    ownerDocument: yup
      .string()
      .trim()
      .nullable()
      .when('useFiscal', {
        is: true,
        then: (schema) => schema.required(messages.ownerDocumentRequiredWithFiscal),
      }),
    ownerName: yup
      .string()
      .trim()
      .nullable()
      .max(100, messages.ownerNameMaxLength)
      .when('useFiscal', {
        is: true,
        then: (schema) => schema.required(messages.ownerNameRequiredWithFiscal),
      }),
    ownerIe: yup
      .string()
      .trim()
      .nullable()
      .max(12, messages.ownerIeMaxLength)
      .when('useFiscal', {
        is: true,
        then: (schema) => schema.required(messages.ownerIeRequiredWithFiscal),
      }),
    ownerUf: yup
      .mixed()
      .nullable()
      .when('useFiscal', {
        is: true,
        then: (schema) => schema.required(messages.ownerUfRequiredWithFiscal),
      }),
    ownerTp: yup
      .mixed()
      .nullable()
      .when('useFiscal', {
        is: true,
        then: (schema) => schema.required(messages.ownerTpRequiredWithFiscal),
      }),
  });
};

export const equipmentDialogSchemaResolver = (languageGB: LanguageDate) =>
  yupResolver(equipmentDialogSchema(languageGB));

export default equipmentDialogSchemaResolver;
