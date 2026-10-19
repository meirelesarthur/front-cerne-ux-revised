// src/validations/schemas/Sales/sale-from-order-schema.ts
// -----------------------------------------------------------------------------
// Schema de validação Yup da tela "Gerar Venda a partir do Pedido"
// (`GerarVendaFromOrder.tsx`, SALE-FE-COM-10, 97-Esteiras/063,
// `pedidos-f051-roteiro.md §4`). Mirror `sale-schema.ts` (Venda avulsa),
// SEM `client` (herdado do Pedido, nunca campo de input) e com o teto
// adicional IG-Q01 (`quantity <= remaining_quantity`, defesa em profundidade
// client-side — o servidor `CreateSaleFromOrderAction` é a autoridade final).
//
// Localização: `src/validations/schemas/Sales/`, NUNCA em `pages/`.
// -----------------------------------------------------------------------------

import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

import fieldValidationSchema from '@/validations/field-validation-schema';

import type { LanguageDate } from '@/@types/language';
import type { SaleFromOrderItemForm } from '@/@types/v2/Sales';
import type Shape from '@/@types/validations/shape';

const numberOrNull = () =>
  yup
    .number()
    .transform((value, original) => (original === '' || original === null ? null : value))
    .nullable()
    .default(null);

export const saleFromOrderSchema = (languageGB: LanguageDate) => {
  const v = fieldValidationSchema(languageGB);
  const saleMessages = languageGB.sales.sale.form.validation;
  const orderMessages = languageGB.orders.order.generateSaleScreen.validation;

  // Linha FECHADA (sem produto/qtd/preço "novos" — o produto vem do Pedido,
  // hidratado read-only). Aqui só o que o Yup valida de fato: quantidade
  // (>0 E ≤ saldo), preço obrigatório e o teto cruzado de desconto (mirror
  // `sale-schema.ts`, IG005/006).
  const itemRowSchema = yup.object().shape<Shape<SaleFromOrderItemForm>>({
    warehouse: yup.object().nullable().default(null),
    quantity: numberOrNull()
      .typeError(saleMessages.numberType)
      .moreThan(0, saleMessages.itemQuantityRequired)
      // Arrow function + acesso via colchetes ao `ctx.parent` — mirror
      // `parameterWeights-schema.ts` (evita `camelcase` do eslint do
      // projeto para o identificador snake_case `remaining_quantity`, que
      // só existe como chave de objeto aqui, não como binding declarado).
      .test(
        'sale-from-order-quantity-max-remaining',
        orderMessages.itemQuantityExceedsRemaining,
        (value, ctx) => {
          const remainingQuantity = (ctx.parent as SaleFromOrderItemForm)['remaining_quantity'];
          return (Number(value) || 0) <= (Number(remainingQuantity) || 0);
        }
      )
      .required(saleMessages.itemQuantityRequired),
    price: numberOrNull()
      .typeError(saleMessages.numberType)
      .min(0, saleMessages.itemPriceRequired)
      .required(saleMessages.itemPriceRequired),
    // IG005 (mirror `sale-schema.ts`) — arrow function + `ctx.parent`, nunca
    // `this.parent` (evita `no-invalid-this`).
    discount: numberOrNull()
      .min(0, saleMessages.numberType)
      .test('sale-from-order-discount-max', saleMessages.itemDiscountExceedsTotal, (value, ctx) => {
        const { quantity, price } = ctx.parent as SaleFromOrderItemForm;
        const base = (Number(quantity) || 0) * (Number(price) || 0);
        return (Number(value) || 0) <= base;
      }),
    note: yup.string().nullable().default(null),
  });

  return yup.object({
    dt_sale: v.date(),
    dt_shipping: v.date(),
    due_date: yup.string().nullable().default(null),
    payment_method: v.option<string>().required(saleMessages.paymentMethodRequired),
    transporter: yup.object().nullable().default(null),
    proprietary: yup.object().nullable().default(null),
    driver: yup.string().nullable().max(250, saleMessages.driverMax).default(null),
    note: yup.string().nullable().max(200, saleMessages.noteMax).default(null),

    // Bloco de totais — `icms`/`freight`/`other_values` editáveis;
    // `subtotal`/`discount`/`total` são preview local, sempre recalculados
    // no servidor (mirror `sale-schema.ts`).
    icms: numberOrNull().min(0, saleMessages.numberType).default(0),
    freight: numberOrNull().min(0, saleMessages.numberType).default(0),
    other_values: numberOrNull().min(0, saleMessages.numberType).default(0),

    // `.min(1)` — tela FECHADA, sem UI de "adicionar item"; se o Pedido não
    // tiver nenhum item com `remaining_quantity > 0`, o array nasce vazio e
    // o submit é bloqueado por esta mensagem (mirror do estado vazio da
    // tela, que já impede o usuário de tentar).
    items: yup.array().of(itemRowSchema).min(1, orderMessages.itemsMin).default([]),
  });
};

export const saleFromOrderSchemaResolver = (languageGB: LanguageDate) =>
  yupResolver(saleFromOrderSchema(languageGB)) as any;

export default saleFromOrderSchemaResolver;
