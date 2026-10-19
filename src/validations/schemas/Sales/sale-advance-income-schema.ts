// src/validations/schemas/Sales/sale-advance-income-schema.ts
// -----------------------------------------------------------------------------
// Schema Yup do formulário de Adiantamento da Venda COMERCIAL (Sale — venda
// de PRODUTOS, Operacional / Vendas, 97-Esteiras/043, SALE-FE-COM-07/08,
// `FM006`/`FM007`). Mirror `sale-schema.ts` (localização, `numberOrNull`) +
// `CONTRATO-API-SALE-COMERCIAL.md §2 A9` (`SaleAdvanceIncomeRequest`, campos
// reais do backend).
//
// `allocations[]` (`FM007`) — `.min(1)` (mín. 1 linha, `IG015`) +
// `.test()` cruzado de soma (`IG016`, Σ valores == `amount` do título) —
// mensagem traduzida; o `422` do servidor é a rede de segurança (nunca
// bloqueia sozinho, o cliente valida primeiro).
//
// Localização: `src/validations/schemas/Sales/`, NUNCA em `pages/`.
// -----------------------------------------------------------------------------

import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

import fieldValidationSchema from '@/validations/field-validation-schema';

import type { LanguageDate } from '@/@types/language';
import type { SaleAdvanceIncomeAllocationRowForm, SaleAdvanceIncomeForm } from '@/@types/v2/Sales';
import type Shape from '@/@types/validations/shape';

const numberOrNull = () =>
  yup
    .number()
    .transform((value, original) => (original === '' || original === null ? null : value))
    .nullable()
    .default(null);

export const saleAdvanceIncomeSchema = (languageGB: LanguageDate) => {
  const v = fieldValidationSchema(languageGB);
  const messages = languageGB.sales.sale.advanceIncome.validation;

  const allocationRowSchema = yup.object().shape<Shape<SaleAdvanceIncomeAllocationRowForm>>({
    category_uuid: v.option<string>().required(messages.categoryRequired),
    center_uuid: v.option<string>().required(messages.centerRequired),
    plan_account_uuid: yup.object().nullable().default(null),
    value: numberOrNull()
      .typeError(messages.numberType)
      .moreThan(0, messages.valueRequired)
      .required(messages.valueRequired),
  });

  return yup.object({
    number: yup.string().trim().required(messages.numberRequired).max(14, messages.numberMax),
    type_title_uuid: v.option<string>().required(messages.typeTitleRequired),
    proprietary_uuid: yup.object().nullable().default(null),
    payment_type: yup.number().oneOf([4]).default(4),
    installment: yup.number().oneOf([1]).default(1),
    qtd_installments: yup.number().oneOf([1]).default(1),
    amount: numberOrNull()
      .typeError(messages.numberType)
      .moreThan(0, messages.amountRequired)
      .required(messages.amountRequired),
    dt_emission: v.date(),
    due_date: v.date(),
    note: yup.string().trim().required(messages.noteRequired).max(600, messages.noteMax),
    fiscal_document: yup.object().nullable().default(null),
    discount: numberOrNull().min(0, messages.numberType),
    penalty: numberOrNull().min(0, messages.numberType),
    interest: numberOrNull().min(0, messages.numberType),
    perc_interest: numberOrNull().min(0, messages.numberType),
    increase: numberOrNull().min(0, messages.numberType),

    // `IG015`/`IG016` — mín. 1 linha; Σ `value` deve fechar exatamente com
    // `amount` do título (tolerância de centavo, arredondamento de ponto
    // flutuante). Arrow function + `ctx.parent` (nunca `this.parent`,
    // mirror `sale-schema.ts`).
    allocations: yup
      .array()
      .of(allocationRowSchema)
      .min(1, messages.sumMismatch)
      .test('sale-advance-income-allocation-sum', messages.sumMismatch, (rows, ctx) => {
        const { amount } = ctx.parent as SaleAdvanceIncomeForm;
        const sum = (rows ?? []).reduce((acc, row) => acc + (Number(row?.value) || 0), 0);
        return Math.abs(sum - (Number(amount) || 0)) < 0.01;
      })
      .default([]),
  });
};

export const saleAdvanceIncomeSchemaResolver = (languageGB: LanguageDate) =>
  yupResolver(saleAdvanceIncomeSchema(languageGB)) as any;

export default saleAdvanceIncomeSchemaResolver;
