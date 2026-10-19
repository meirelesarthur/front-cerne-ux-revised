// src/validations/schemas/Carregamentos/finish-charge-schema.ts
// -----------------------------------------------------------------------------
// Schema de validação Yup da tela de FINALIZAR Carregamento (`FinishCharge.
// tsx`, TASK-FE-CG-05), espelhando `FinishChargeRequest::rules()` (leitura
// direta do backend, `app/Http/Requests/Api/V1/FinishChargeRequest.php`).
//
// Armadilhas respeitadas:
//   - `items[]` (linhas EXISTENTES) exige `quantity_real` sempre (mirror
//     `required_with:items.*.item_uuid` do servidor — nesta tela toda linha
//     do array JÁ tem `item_uuid`, então é sempre obrigatório).
//   - `new_item` é um slot ÚNICO OPCIONAL (mirror da Leitura do dev da
//     Tarefa) — só valida `quantity`/`amount` como obrigatórios quando
//     `product_uuid` foi preenchido (`.when`), nunca força o usuário a
//     lançar um item novo.
//   - `driver_*` reusa as MESMAS mensagens de `charge.form.validation`
//     (mesmos campos do cabeçalho do Carregamento, sem duplicar tradução).
// -----------------------------------------------------------------------------

import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

import { isValidPlate } from '@/utils/masks/plate';

import type { LanguageDate } from '@/@types/language';

export const finishChargeSchema = (languageGB: LanguageDate) => {
  const messages = languageGB.carregamentos.charge.form.validation;
  const finishMessages = languageGB.carregamentos.charge.finish.validation;

  const optionOrNull = () =>
    yup.object({ label: yup.string(), value: yup.mixed() }).nullable().default(null);

  const numberOrNull = () =>
    yup
      .number()
      .transform((value, original) => (original === '' || original === null ? null : value))
      .nullable()
      .default(null);

  return yup.object({
    driver_name: yup.string().trim().max(40, messages.driverNameMaxLength).default(''),
    // UT-000787: formato de placa só quando preenchida.
    driver_plate: yup
      .string()
      .trim()
      .max(9, messages.driverPlateMaxLength)
      .test(
        'plate-format',
        languageGB.defaltStrings.validations.plateInvalid,
        (value) => !value || isValidPlate(value)
      )
      .default(''),
    driver_uf: optionOrNull(),
    driver_nif: yup.string().trim().max(20, messages.driverNifMaxLength).default(''),

    items: yup
      .array()
      .of(
        yup.object({
          item_uuid: yup.string().required(),
          product_label: yup.string().default(''),
          quantity: yup.number().default(0),
          amount: yup.number().default(0),
          quantity_real: numberOrNull()
            .required(finishMessages.quantityRealRequired)
            .min(0, finishMessages.quantityRealMin),
        })
      )
      .default([]),

    // Slot ÚNICO opcional — `product_uuid` vazio = nenhum item novo nesta
    // finalização (caso majoritário); só quando preenchido é que
    // `quantity`/`amount` passam a ser exigidos (mirror `required_without:
    // items.*.item_uuid` do servidor, reframed para este slot dedicado).
    new_item: yup.object({
      product_uuid: optionOrNull(),
      quantity: numberOrNull().when('product_uuid', {
        is: (value: unknown) => !!value,
        then: (schema) =>
          schema
            .required(finishMessages.newItemQuantityRequired)
            .min(0.01, finishMessages.newItemQuantityMin),
        otherwise: (schema) => schema.nullable(),
      }),
      amount: numberOrNull().when('product_uuid', {
        is: (value: unknown) => !!value,
        then: (schema) =>
          schema
            .required(finishMessages.newItemAmountRequired)
            .min(0, finishMessages.newItemAmountMin),
        otherwise: (schema) => schema.nullable(),
      }),
    }),
  });
};

export const finishChargeSchemaResolver = (languageGB: LanguageDate) =>
  yupResolver(finishChargeSchema(languageGB));

export default finishChargeSchemaResolver;
