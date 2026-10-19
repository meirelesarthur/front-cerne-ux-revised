import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

import { LanguageDate } from '@/@types/language';

export interface MarketplaceSignupForm {
  email: string;
  password: string;
  username: string;
}

export const marketplaceSignupSchema = (languageGB: LanguageDate) => {
  return yup.object({
    email: yup
      .string()
      .required(languageGB.common.marketplace.validation.emailRequired)
      .email(languageGB.common.marketplace.validation.emailInvalid),
    password: yup
      .string()
      .required(languageGB.common.marketplace.validation.passwordRequired)
      .min(8, languageGB.common.marketplace.validation.passwordMinLength),
    username: yup.string(),
  });
};

export const marketplaceSignupResolver = (languageGB: LanguageDate) =>
  yupResolver(marketplaceSignupSchema(languageGB));
