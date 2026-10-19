import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

import type { LanguageDate } from '@/@types/language';

export const finishTransferSchema = (languageGB: LanguageDate) => {
  const messages = languageGB.transfers.transfer.finish.validation;

  return yup.object({
    items: yup
      .array()
      .of(
        yup.object({
          uuid: yup.string().required(),
          product_label: yup.string().default(''),
          measurement_label: yup.string().default(''),
          quantity: yup.number().default(0),
          delivery_quantity: yup
            .number()
            .transform((value, original) => (original === '' || original === null ? null : value))
            .nullable()
            .default(null)
            .required(messages.deliveryQuantityRequired)
            .min(0, messages.deliveryQuantityMin),
        })
      )
      .default([]),
  });
};

export const finishTransferSchemaResolver = (languageGB: LanguageDate) =>
  yupResolver(finishTransferSchema(languageGB));
