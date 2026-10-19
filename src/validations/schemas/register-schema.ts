import { yupResolver } from '@hookform/resolvers/yup';
import { State } from 'country-state-city';
import * as yup from 'yup';

import { LanguageDate } from '@/@types/language';
import fieldValidationSchema from '../field-validation-schema';

export interface RegisterForm {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
  country: string;
  region: string | null;
  language: string;
}

export const registerSchema = (languageGB: LanguageDate) => {
  const v = fieldValidationSchema(languageGB);

  return yup.object({
    fullName: v.string(),
    email: v.email(),
    password: v.password(),
    confirmPassword: v.confirmPassword(),
    country: v.string(),
    region: yup.string().when('country', {
      is: (country: string) =>
        !!country && State.getStatesOfCountry(country).length > 0,
      then: (schema) =>
        schema.required(languageGB.defaltStrings.validations.requiredField),
      otherwise: (schema) => schema.nullable(),
    }),
    language: v.string(),
  });
};

export const registerSchemaResolver = (languageGB: LanguageDate) =>
  yupResolver(registerSchema(languageGB));

export default registerSchemaResolver;
