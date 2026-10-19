// src/validations/schemas/Budgets/budget-schema.ts
// -----------------------------------------------------------------------------
// Schema de validação Yup do formulário de CRIAÇÃO/EDIÇÃO de Orçamento
// (Budget — Operacional / Vendas, F-018, 97-Esteiras/054, TASK-BG-FE-01 —
// fundação, consumido pelas Tarefas 03/04). Mirror `movement-purchase-schema.ts`
// (`.when()` condicional do bloco financeiro) + `request-quotation-schema.ts`
// (`fieldValidationSchema`), espelhando `BudgetRequest::rules()`
// (`budgets-api-contract.md §4.3`) + `budgets-frontend-contract.md §4`
// (FID-G3F, cascatas/condicionais/cálculos).
//
// Localização: `src/validations/schemas/Budgets/`, NUNCA em `pages/` (regra
// inviolável da Tarefa).
//
// -- Itens (IG-03) --
// `discount` do item não pode exceder `quantity × amount` (o "total da linha"
// antes do desconto) — Yup `.test()` na linha, mirror
// `handleQuantityBlur`/`handleStockChange` de `RequisitionItemRow` (a UI
// trata com `toaster.error` + reset, o schema só formaliza a regra para o
// submit).
//
// -- `discount_percent` (IG-04) --
// NAO_APLICAVEL (D12, `budgets-frontend-contract.md §4.4`) — nunca lido pelo
// servidor; se mantido como apoio visual client-only em Tarefa futura, é
// OPCIONAL e fora do contrato de validação deste schema (decisão de
// fidelidade já registrada no contrato de tela).
//
// -- Pagamentos / bloco financeiro (IG-05/07/08/09, CV-06) --
// `installment_details` só é validado quando `installments > 1` (mirror
// `financial_installments.when('has_financial', ...)` de
// `movement-purchase-schema.ts`); dentro dele, `input_date`/`input_value`
// só são obrigatórios quando `has_input === true` (IG-07, `.when()`
// aninhado). A tabela `installments[]` (gerada por
// `@/utils/budgetInstallments`, TASK-BG-FE-04) é validada apenas quanto ao
// formato — a geração/reconciliação de arredondamento é responsabilidade das
// funções puras, não deste schema.
// -----------------------------------------------------------------------------

import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

import fieldValidationSchema from '@/validations/field-validation-schema';

import type { LanguageDate } from '@/@types/language';
import type {
  BudgetItemForm,
  BudgetPaymentForm,
  BudgetPaymentInstallmentDetailForm,
} from '@/@types/v2/Budgets';
import type Shape from '@/@types/validations/shape';

const numberOrNull = () =>
  yup
    .number()
    .transform((value, original) => (original === '' || original === null ? null : value))
    .nullable()
    .default(null);

export const budgetSchema = (languageGB: LanguageDate) => {
  const v = fieldValidationSchema(languageGB);
  const messages = languageGB.budgets.budget.form.validation;

  const installmentDetailsSchema = yup.object().shape<Shape<BudgetPaymentInstallmentDetailForm>>({
    has_input: yup.boolean().default(false),
    input_date: yup
      .string()
      .nullable()
      .default(null)
      .when('has_input', {
        is: true,
        then: (schema) => schema.required(messages.installmentInputDateRequired),
        otherwise: (schema) => schema.nullable(),
      }),
    input_value: numberOrNull().when('has_input', {
      is: true,
      then: (schema) =>
        schema
          .typeError(messages.numberType)
          .moreThan(0, messages.installmentInputValueRequired)
          .required(messages.installmentInputValueRequired),
      otherwise: (schema) => schema.nullable(),
    }),
    qtd_installments: numberOrNull()
      .typeError(messages.numberType)
      .moreThan(0, messages.installmentQtdRequired)
      .required(messages.installmentQtdRequired),
    first_installment: yup.string().nullable().required(messages.installmentFirstRequired),
    int_installments: numberOrNull().min(0, messages.numberType).default(0),
    fiscal_document: yup.boolean().default(false),
    installments: yup
      .array()
      .of(
        yup.object({
          date: yup.string().required(),
          value: yup.number().required(),
        })
      )
      .default([]),
  });

  const paymentRowSchema = yup.object().shape<Shape<BudgetPaymentForm>>({
    uuid: yup.string().nullable().notRequired(),
    payment_method: v.option<string>().required(messages.paymentMethodRequired),
    installments: numberOrNull()
      .typeError(messages.numberType)
      .moreThan(0, messages.paymentInstallmentsRequired)
      .required(messages.paymentInstallmentsRequired),
    interval: numberOrNull()
      .typeError(messages.numberType)
      .min(0, messages.numberType)
      .required(messages.paymentIntervalRequired),
    due_date: yup.string().required(messages.paymentDueDateRequired),
    amount: numberOrNull(),
    total: numberOrNull()
      .typeError(messages.numberType)
      .moreThan(0, messages.paymentTotalRequired)
      .required(messages.paymentTotalRequired),
    // Bloco financeiro só é obrigatório/validado quando `installments > 1`
    // (IG-05) — mirror `financial_installments.when('has_financial', ...)`.
    installment_details: yup
      .mixed<BudgetPaymentInstallmentDetailForm | null>()
      .nullable()
      .when('installments', {
        is: (value: number) => Number(value) > 1,
        then: () => installmentDetailsSchema.required(),
        otherwise: (schema) => schema.nullable(),
      }),
  });

  const itemRowSchema = yup
    .object()
    .shape<Shape<BudgetItemForm>>({
      uuid: yup.string().nullable().notRequired(),
      product: v.option<string>().required(messages.itemProductRequired),
      unit: yup.string().nullable().default(''),
      quantity: numberOrNull()
        .typeError(messages.numberType)
        .moreThan(0, messages.itemQuantityRequired)
        .required(messages.itemQuantityRequired),
      amount: numberOrNull()
        .typeError(messages.numberType)
        .min(0, messages.itemAmountRequired)
        .required(messages.itemAmountRequired),
      discount: numberOrNull().min(0, messages.numberType),
      total: numberOrNull(),
    })
    // IG-03 — desconto do item não pode exceder o total da linha
    // (`quantity × amount`, antes do desconto).
    .test('item-discount-not-greater-than-total', messages.itemDiscountExceedsTotal, (item) => {
      if (!item) return true;
      const quantity = Number(item.quantity) || 0;
      const amount = Number(item.amount) || 0;
      const discount = Number(item.discount) || 0;
      return discount <= quantity * amount;
    });

  return yup.object({
    code: yup.string().default(''),
    date: v.date(),
    client: v.option<string>().required(messages.clientRequired),
    freight: numberOrNull().min(0, messages.freightMin).default(0),
    note: yup.string().nullable().default(null),

    items: yup.array().of(itemRowSchema).min(1, messages.itemsMin).default([]),

    payments: yup.array().of(paymentRowSchema).min(1, messages.paymentsMin).default([]),
  });
};

export const budgetSchemaResolver = (languageGB: LanguageDate) =>
  yupResolver(budgetSchema(languageGB)) as any;

export default budgetSchemaResolver;
