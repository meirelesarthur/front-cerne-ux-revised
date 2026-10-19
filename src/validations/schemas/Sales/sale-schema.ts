// src/validations/schemas/Sales/sale-schema.ts
// -----------------------------------------------------------------------------
// Schema de validação Yup do formulário de CRIAÇÃO/EDIÇÃO de Venda COMERCIAL
// (Sale — venda de PRODUTOS, Operacional / Vendas, 97-Esteiras/043,
// SALE-FE-COM-01 — fundação). Mirror `order-schema.ts` (irmão comercial
// migrado), cruzado com `CONTRATO-TELA-VENDAS-COMERCIAL-FE.md §4/§6` e
// `CONTRATO-API-SALE-COMERCIAL.md §3.1/§4` (campos NUNCA input: `code`/
// `status`/`order_id`/`installment_details`/`subtotal`/`discount`
// (agregado)/`total` — sempre gerados/recalculados no servidor, CV002-CV004).
//
// Localização: `src/validations/schemas/Sales/`, NUNCA em `pages/`.
//
// SALE-FE-COM-04 aperta `items[]`: `.min(1)` (a seção `SaleItemsEditor` já
// existe e sempre nasce com 1 linha em criação ou hidratada em edição) +
// `.test()` cruzado de `discount <= quantity×price` (IG005, `ctx.parent`,
// arrow function — mirror `order-schema.ts`, nunca `this.parent`).
// -----------------------------------------------------------------------------

import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

import fieldValidationSchema from '@/validations/field-validation-schema';

import type { LanguageDate } from '@/@types/language';
import type { SaleItemForm } from '@/@types/v2/Sales';
import type Shape from '@/@types/validations/shape';

const numberOrNull = () =>
  yup
    .number()
    .transform((value, original) => (original === '' || original === null ? null : value))
    .nullable()
    .default(null);

export const saleSchema = (languageGB: LanguageDate) => {
  const v = fieldValidationSchema(languageGB);
  const messages = languageGB.sales.sale.form.validation;

  // Linha de item (SALE-FE-COM-04) — cascatas de estoque/UM ficam em
  // `SaleItemRow` (client-side); aqui só o que o Yup valida de fato: produto/
  // qtd/preço obrigatórios e o teto cruzado de desconto (IG005/006).
  const itemRowSchema = yup.object().shape<Shape<SaleItemForm>>({
    uuid: yup.string().nullable().notRequired(),
    warehouse: yup.object().nullable().default(null),
    product: v.option<string>().required(messages.itemProductRequired),
    qtd_stock: numberOrNull(),
    um: yup.string().nullable().default(''),
    quantity: numberOrNull()
      .typeError(messages.numberType)
      .moreThan(0, messages.itemQuantityRequired)
      .required(messages.itemQuantityRequired),
    price: numberOrNull()
      .typeError(messages.numberType)
      .min(0, messages.itemPriceRequired)
      .required(messages.itemPriceRequired),
    // IG005 — desconto (valor) nunca pode exceder `quantity×price` da
    // PRÓPRIA linha. Arrow function + `ctx.parent` (nunca `this.parent`,
    // mirror `order-schema.ts`/`advance-schema.ts` — evita `no-invalid-this`).
    discount: numberOrNull()
      .min(0, messages.numberType)
      .test('sale-item-discount-max', messages.itemDiscountExceedsTotal, (value, ctx) => {
        const { quantity, price } = ctx.parent as SaleItemForm;
        const base = (Number(quantity) || 0) * (Number(price) || 0);
        return (Number(value) || 0) <= base;
      }),
    // IG006 — percentual nunca pode exceder 100 (UI puro, não persistido).
    discount_percent: numberOrNull().max(100, messages.itemDiscountPercentMax),
    total_amount: numberOrNull(),
    note: yup.string().nullable().default(null),
  });

  return yup.object({
    dt_sale: v.date(),
    dt_shipping: v.date(),
    due_date: yup.string().nullable().default(null),
    client: v.option<string>().required(messages.clientRequired),
    payment_method: v.option<string>().required(messages.paymentMethodRequired),
    transporter: yup.object().nullable().default(null),
    proprietary: yup.object().nullable().default(null),
    driver: yup.string().nullable().max(250, messages.driverMax).default(null),
    note: yup.string().nullable().max(200, messages.noteMax).default(null),

    // Bloco de totais (CV002-CV004, contrato-api §4) — `icms`/`freight`/
    // `other_values` são inputs editáveis; `subtotal`/`discount`/`total` são
    // sempre readonly (derivados no cliente e recalculados no servidor,
    // nunca validados aqui).
    icms: numberOrNull().min(0, messages.numberType).default(0),
    freight: numberOrNull().min(0, messages.numberType).default(0),
    other_values: numberOrNull().min(0, messages.numberType).default(0),

    // `.min(1)` — `SaleItemsEditor` já existe e sempre nasce com 1 linha
    // (create) ou hidratada (edit), então exigir o mínimo aqui não bloqueia
    // nenhum submit sem UI capaz de satisfazê-lo (mirror `order-schema.ts`).
    items: yup.array().of(itemRowSchema).min(1, messages.itemsMin).default([]),
  });
};

export const saleSchemaResolver = (languageGB: LanguageDate) =>
  yupResolver(saleSchema(languageGB)) as any;

export default saleSchemaResolver;
