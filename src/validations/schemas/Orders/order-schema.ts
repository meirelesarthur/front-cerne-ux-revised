// src/validations/schemas/Orders/order-schema.ts
// -----------------------------------------------------------------------------
// Schema de validação Yup do formulário de CRIAÇÃO/EDIÇÃO de Pedido
// (Order — Operacional / Vendas, F-051, 97-Esteiras/043, PED-FE-03 — casca +
// cabeçalho + totais + submit). Mirror `budget-schema.ts` (módulo análogo
// direto), cruzado com `CONTRATO-TELA-PEDIDOS-F051.md §4/§6` e
// `contrato-api-pedidos.md §3.3` (campos NUNCA input: `code`/`status`(create)/
// `subtotal`/`total` — sempre gerados/recalculados no servidor, CV-001/
// CV-009/010/011).
//
// Localização: `src/validations/schemas/Orders/`, NUNCA em `pages/`.
//
// -- Itens (`items[]`) e cronograma (`installment_details.installments[]`) --
// PED-FE-03 construiu a FORMA MÍNIMA dos arrays (produto/quantidade/preço;
// has_input/qtt/datas) para o payload atômico existir estruturalmente antes
// das seções dedicadas nascerem. PED-FE-04 apertou ITENS — IG-001..009:
// cascata produto→um (UI, `OrderItemRow`), recompute de total (IG-002/003) e
// os limites cruzados de desconto valor↔percentual (IG-004/005, `.test()`
// cruzado na própria linha) — e ligou `items.min(1)` (mirror
// `budgetSchema.items.min(1, messages.itemsMin)`), seguro porque
// `OrderItemsEditor` já existe e nasce com 1 linha (create) ou hidratada
// (edit). PED-FE-05 (esta edição) aperta PAGAMENTO/PARCELAS — IG-010..014/017
// completo: `payment_method`/`installments`/`due_date` obrigatórios (F-020/
// F-024/F-025), bounds de data 1900-12-31..2100-12-31 (IG-017) em todo
// date-picker do bloco (`withDateBounds`), `.when('has_input')` condicional
// de `input_date`/`input_value` (IG-010) — o ajuste de centavos da última
// parcela (IG-013, `adjustInstallmentsDifference`) e o recompute
// (`calcInstallments`, IG-011/012) são client-side puros em
// `OrderPaymentsEditor.tsx`, fora do escopo deste schema (mirror
// `budget-schema.ts`/`BudgetPaymentRow.tsx`).
// -----------------------------------------------------------------------------

import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

import fieldValidationSchema from '@/validations/field-validation-schema';

import type { LanguageDate } from '@/@types/language';
import type {
  OrderInstallmentDetailsForm,
  OrderInstallmentEntryForm,
  OrderItemForm,
} from '@/@types/v2/Orders';
import type Shape from '@/@types/validations/shape';

const numberOrNull = () =>
  yup
    .number()
    .transform((value, original) => (original === '' || original === null ? null : value))
    .nullable()
    .default(null);

// IG-017 — bounds 1900-12-31..2100-12-31 em TODO date-picker do bloco de
// pagamento (due_date/input_date/first_installment/linhas do cronograma),
// mirror `parameterWeights-schema.ts` (`.test()` string ISO comparada
// lexicograficamente — equivalente à comparação de `Date` no formato
// zero-padded 'yyyy-MM-dd', sem depender de `yup.date()`).
function withDateBounds<T extends yup.StringSchema<any, any, any>>(schema: T, message: string): T {
  return schema
    .test('date-min', message, (value) => !value || value >= '1900-01-01')
    .test('date-max', message, (value) => !value || value <= '2100-12-31') as T;
}

// `isCreating` (default `true`) governa só o default de `fiscal_document`
// dentro de `installment_details` — contrato-tela §6.2: "fiscal_document
// (Select) Dedutível Não/Sim; default create=1; só em `installment_details`".
// Em edição o valor real vem do servidor (`fillOrderForm`, PED-FE-03); o
// default do schema só importa na criação, antes de qualquer `reset()`.
export const orderSchema = (languageGB: LanguageDate, isCreating: boolean = true) => {
  const v = fieldValidationSchema(languageGB);
  const messages = languageGB.orders.order.form.validation;

  const installmentEntrySchema = yup.object().shape<Shape<OrderInstallmentEntryForm>>({
    // IG-017 — cada linha do cronograma (`date_installments[]`) também
    // respeita os bounds 1900-12-31..2100-12-31.
    date: withDateBounds(yup.string().required(), messages.installmentDateInvalid),
    value: yup.number().required(),
  });

  // PED-FE-05 — IG-010..014/017 completo: recompute `calcInstallments`,
  // ajuste de centavos na última parcela (`adjustInstallmentsDifference`,
  // toast em `OrderPaymentsEditor`) e bounds de data (IG-017).
  const installmentDetailsSchema = yup
    .object()
    .shape<Shape<OrderInstallmentDetailsForm>>({
      has_input: yup.boolean().default(false),
      input_date: withDateBounds(
        yup
          .string()
          .nullable()
          .default(null)
          .when('has_input', {
            is: true,
            then: (schema) => schema.required(messages.installmentInputDateRequired),
            otherwise: (schema) => schema.nullable(),
          }),
        messages.installmentDateInvalid
      ),
      input_value: numberOrNull().when('has_input', {
        is: true,
        then: (schema) =>
          schema
            .typeError(messages.numberType)
            .moreThan(0, messages.installmentInputValueRequired)
            .required(messages.installmentInputValueRequired),
        otherwise: (schema) => schema.nullable(),
      }),
      qtt_installments: numberOrNull(),
      // F-025 — `first_installment` é o MESMO valor de `due_date` (nível do
      // form), sincronizado por `OrderPaymentsEditor` — sem UI própria
      // distinta; bounds aqui são defesa em profundidade (IG-017).
      first_installment: withDateBounds(
        yup.string().nullable().default(null),
        messages.installmentDateInvalid
      ),
      installment_interval: numberOrNull().min(0, messages.numberType).default(0),
      fiscal_document: yup.boolean().default(isCreating),
      installments: yup.array().of(installmentEntrySchema).default([]),
    })
    .nullable()
    .default(null);

  // PED-FE-04 — IG-001..009 completo: cascata produto→um (UI, `OrderItemRow`),
  // recompute de total (IG-002/003) e os limites cruzados de desconto
  // valor↔percentual (IG-004/005, `.test()` referenciando `this.parent` —
  // mesma linha, sem 2º objeto). Guarda CLM-030 (div-by-zero quando
  // price×quantity=0) fica no cálculo client-side de `OrderItemRow`, não
  // aqui — o Yup só valida o teto, nunca deriva o percentual.
  const itemRowSchema = yup.object().shape<Shape<OrderItemForm>>({
    olds: yup.string().nullable().notRequired(),
    product: v.option<string>().required(messages.itemProductRequired),
    um: yup.string().nullable().default(''),
    quantity: numberOrNull()
      .typeError(messages.numberType)
      .moreThan(0, messages.itemQuantityRequired)
      .required(messages.itemQuantityRequired),
    price: numberOrNull()
      .typeError(messages.numberType)
      .min(0, messages.itemPriceRequired)
      .required(messages.itemPriceRequired),
    // IG-004 — desconto (valor) nunca pode exceder `quantity×price` da
    // PRÓPRIA linha. Arrow function + `ctx.parent` (não `function(){...}`/
    // `this.parent`) — evita `no-invalid-this` do ESLint do projeto (mesma
    // convenção de `advance-schema.ts`/`request-authorization-approve-schema.ts`).
    discount: numberOrNull()
      .min(0, messages.numberType)
      .test('order-item-discount-max', messages.itemDiscountExceedsTotal, (value, ctx) => {
        const { quantity, price } = ctx.parent as OrderItemForm;
        const base = (Number(quantity) || 0) * (Number(price) || 0);
        return (Number(value) || 0) <= base;
      }),
    // IG-005 — percentual nunca pode exceder 100 (não persistido, F-012).
    discount_percent: numberOrNull().max(100, messages.itemDiscountPercentMax),
    total_amount: numberOrNull(),
  });

  return yup.object({
    code: yup.string().default(''),
    date: v.date(),
    client: v.option<string>().required(messages.clientRequired),
    freight: numberOrNull().min(0, messages.freightMin).default(0),
    discount: numberOrNull().min(0, messages.numberType).default(0),
    note: yup.string().nullable().max(200, messages.noteMax).default(null),

    // Bloco de pagamento (PED-FE-05, `OrderPaymentsEditor`/
    // `OrderInstallmentRow`, F-020/F-024/F-025 — `payment_method`/
    // `installments`/`due_date` no NÍVEL do form, obrigatórios; `interval`
    // opcional/default 0; sincronizados 1:1 com `installment_details.
    // qtt_installments/first_installment/installment_interval` pelos
    // handlers do editor, não confundir com o cronograma editável).
    payment_method: v.option<string>().required(messages.paymentMethodRequired),
    installments: numberOrNull()
      .typeError(messages.numberType)
      .min(1, messages.installmentsRequired)
      .required(messages.installmentsRequired),
    interval: numberOrNull().min(0, messages.numberType).default(0),
    due_date: withDateBounds(
      yup.string().nullable().default(null).required(messages.dueDateRequired),
      messages.installmentDateInvalid
    ),

    // PED-FE-04 aperta o mínimo (`.min(1)`) — a seção de itens
    // (`OrderItemsEditor`) já existe e sempre nasce com 1 linha (create) ou
    // hidratada (edit), então exigir o mínimo aqui não bloqueia mais nenhum
    // submit sem UI capaz de satisfazê-lo (PED-FE-03 deixava sem gate por
    // essa razão).
    items: yup.array().of(itemRowSchema).min(1, messages.itemsMin).default([]),
    installment_details: installmentDetailsSchema,
  });
};

export const orderSchemaResolver = (languageGB: LanguageDate, isCreating: boolean = true) =>
  yupResolver(orderSchema(languageGB, isCreating)) as any;

export default orderSchemaResolver;
