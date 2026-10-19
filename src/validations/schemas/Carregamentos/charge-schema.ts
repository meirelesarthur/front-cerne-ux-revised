// src/validations/schemas/Carregamentos/charge-schema.ts
// -----------------------------------------------------------------------------
// Schema de validação Yup do formulário de CARREGAMENTO (Charge) — Cabeçalho
// (TASK-FE-CG-03) + Itens (TASK-FE-CG-03) + Despesas acessórias
// (TASK-FE-CG-04), espelhando `ChargeRequest::rules()` (leitura direta do
// backend, `app/Http/Requests/Api/V1/ChargeRequest.php`).
//
// Armadilhas respeitadas:
//   - `client_uuid` OBRIGATÓRIO (fecha CL-03 — o legado só validava no
//     Blade; o servidor agora exige, e o schema Yup espelha).
//   - `driver_nif` SEM validação de formato client-side além da máscara —
//     o CPF/CNPJ real é validado no servidor via `CpfCnpj($countryId)`
//     (mirror `StepIdentificacao.tsx`).
//   - `items` `min(1)` (mirror `transfer-schema.ts`); `product_uuid`/
//     `quantity`/`amount` são os únicos 3 campos de linha REALMENTE
//     obrigatórios no servidor (`warehouse_uuid` continua opcional, fiel ao
//     legado FD-06).
//   - `total_amount`/`weight` da linha de item são CLIENT-ONLY (nota técnica
//     2 do plano de arquitetura) — SEM `.required()`, nunca vão ao payload.
//   - `expenses` SEM `.min(1)` (D6, `present|array` no servidor) — `[]` é o
//     mecanismo aprovado para remover todas as despesas.
// -----------------------------------------------------------------------------

import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

import { isValidPlate } from '@/utils/masks/plate';

import fieldValidationSchema from '@/validations/field-validation-schema';

import type { LanguageDate } from '@/@types/language';

export const chargeSchema = (languageGB: LanguageDate) => {
  const v = fieldValidationSchema(languageGB);
  const messages = languageGB.carregamentos.charge.form.validation;
  const itemRowText = languageGB.carregamentos.charge.form.itemRow;
  const itemMessages = itemRowText.validation;
  const expenseMessages = languageGB.carregamentos.charge.form.expenseRow.validation;

  const optionOrNull = () =>
    yup.object({ label: yup.string(), value: yup.mixed() }).nullable().default(null);

  const numberOrNull = () =>
    yup
      .number()
      .transform((value, original) => (original === '' || original === null ? null : value))
      .nullable()
      .default(null);

  return yup.object({
    // ---- Cabeçalho ----------------------------------------------------------
    dt_charge: v.date(),
    // Fecha CL-03 — o legado só validava `client_id` no Blade.
    client_uuid: v.option(),
    transporter_uuid: optionOrNull(),
    // `''`, nunca `null` no form (convenção do fork p/ `register()`, mirror
    // `driver`/`nfe` de `transfer-schema.ts`).
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
    // Sem validação de formato além da máscara (o servidor valida via
    // `CpfCnpj($countryId)`).
    driver_nif: yup.string().trim().max(20, messages.driverNifMaxLength).default(''),
    note: yup.string().trim().max(200, messages.noteMaxLength).default(''),

    // ---- Itens (TASK-FE-CG-03) ----------------------------------------------
    items: yup
      .array()
      .of(
        yup.object({
          item_uuid: yup.string().nullable().default(null),
          product_uuid: v.option(),
          // Opcional — fiel ao legado (FD-06, cascata armazém→produto→estoque).
          warehouse_uuid: optionOrNull(),
          quantity: numberOrNull()
            .required(itemMessages.quantityRequired)
            .min(0.01, itemMessages.quantityMin),
          amount: numberOrNull()
            .required(itemMessages.amountRequired)
            .min(0, itemMessages.amountMin),
          type: optionOrNull(),
          calibre: yup.string().trim().max(30, itemMessages.calibreMaxLength).default(''),
          team_uuid: optionOrNull(),
          seller_uuid: optionOrNull(),
          area_uuid: optionOrNull(),
          provider_uuid: optionOrNull(),
          note: yup.string().trim().default(''),
          // Hints client-only (nota técnica 2 do plano) — nunca vão ao
          // payload, sem validação de obrigatoriedade.
          total_amount: numberOrNull(),
          weight: numberOrNull(),
          // FD-30/FD-31 (CL-46) — hints client-only (Estoque/Un. Medida),
          // mesmo racional de `total_amount`/`weight`: SEM `.required()`,
          // nunca vão ao payload.
          qtd_stock: numberOrNull(),
          um: yup.string().nullable().default(null),
        })
      )
      // `required|array|min:1` no servidor — mensagem literal do repeater
      // (mirror `itemRowText.removeLastError` de `transfer-schema.ts`).
      .min(1, itemRowText.removeLastError)
      .default([]),

    // ---- Despesas acessórias (TASK-FE-CG-04) --------------------------------
    expenses: yup
      .array()
      .of(
        yup.object({
          expense_uuid: yup.string().nullable().default(null),
          type: v.option(),
          service_reversal_uuid: optionOrNull(),
          warehouse_uuid: optionOrNull(),
          product_uuid: optionOrNull(),
          provider_uuid: optionOrNull(),
          quantity: numberOrNull()
            .required(expenseMessages.quantityRequired)
            .min(0, expenseMessages.quantityMin),
          vl_unit: numberOrNull()
            .required(expenseMessages.vlUnitRequired)
            .min(0, expenseMessages.vlUnitMin),
          who_pay: v.option(),
          apropriation: v.option(),
          // Hint client-only — nunca vai ao payload.
          value: numberOrNull(),
        })
      )
      // `present|array` no servidor (D6) — SEM `.min(1)`: `[]` é o
      // mecanismo aprovado para remover TODAS as despesas.
      .default([]),
  });
};

export const chargeSchemaResolver = (languageGB: LanguageDate) =>
  yupResolver(chargeSchema(languageGB));

export default chargeSchemaResolver;
