// src/validations/schemas/FarmTransfers/farm-transfer-create-schema.ts
// -----------------------------------------------------------------------------
// Schema de validação Yup do formulário de CRIAÇÃO de Trans. Fazendas
// (FarmTransfer — Estoque, escrita, Tarefas 02/03), espelhando
// `FarmTransferRequest::rules()` (lido no código real, `GB.Cerne.Api`) +
// fidelidade de UX ao molde `warehouse-transfer-create-schema.ts`. Vive em
// `src/validations/schemas/FarmTransfers/` (pasta pelo NOME DA ENTIDADE).
//
// Divergências vs. o irmão (`warehouse-transfer-create-schema.ts`):
//  - `destination_farm_id` — NOVO, obrigatório (cascata fazenda→armazém,
//    `GAP-FARMTRANSFER-FE-02`), client-only (nunca vai ao payload).
//  - `items.*.cost_center_id` — OPCIONAL (mirror
//    `FarmTransferRequest.items.*.cost_center_uuid: sometimes`, ao
//    contrário do irmão que o exige).
//  - Bloco financeiro condicional a `has_financial` (Tarefa 03): `vl_total`
//    + 2 rateios (Income origem/Expense destino) + parcelas. `.array().when()`
//    TROCA o schema do array inteiro (linhas obrigatórias + `.test()` de
//    fechamento, tolerância `0.01`, mirror `IG-06`/`CV-05`/
//    `GAP-FARMTRANSFER-FE-03`) só quando `has_financial=true` — evita
//    depender de `context`/`$ref` do Yup para alcançar o irmão de nível
//    raiz de dentro do item do array (o `.test()` de soma já tem acesso ao
//    irmão via `ctx.parent`, pois roda no nível do próprio campo array).
//    Sem `has_financial`, o array usa um schema PASSIVO (sem `.required()`
//    nas linhas) — payload idêntico ao da Tarefa 02 (regressão zero).
// -----------------------------------------------------------------------------

import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

import type { LanguageDate } from '@/@types/language';
import type {
  FarmTransferAllocationRowForm,
  FarmTransferInstallmentForm,
  FarmTransferItemForm,
} from '@/@types/v2/FarmTransfers';
import type Shape from '@/@types/validations/shape';

const SUM_TOLERANCE = 0.01;

const optionSchema = yup
  .object({ value: yup.mixed(), label: yup.string() })
  .nullable()
  .default(null);

function sumValues(rows: Array<{ value?: number | null } | undefined> | undefined): number {
  return (rows ?? []).reduce((sum, row) => sum + (Number(row?.value) || 0), 0);
}

/**
 * Schema de criação (lote) — cabeçalho + array `items[]` + subfluxo
 * financeiro opcional (`has_financial`).
 * @param {LanguageDate} languageGB - Pacote de idioma ativo (mensagens de validação i18n).
 * @return {yup.ObjectSchema<any>} Schema Yup de criação em lote.
 */
export const farmTransferCreateSchema = (languageGB: LanguageDate) => {
  const messages = languageGB.farmTransfers.farmTransfer.form.validation;

  const allocationRowSchemaRequired = yup.object().shape<Shape<FarmTransferAllocationRowForm>>({
    category_uuid: yup.object().nullable().required(messages.incomeCategoryRequired),
    center_uuid: yup.object().nullable().required(messages.incomeCenterRequired),
    value: yup
      .number()
      .nullable()
      .typeError(messages.numberType)
      .moreThan(0, messages.incomeValueRequired)
      .required(messages.incomeValueRequired),
  });

  const expenseAllocationRowSchemaRequired = yup
    .object()
    .shape<Shape<FarmTransferAllocationRowForm>>({
      category_uuid: yup.object().nullable().required(messages.expenseCategoryRequired),
      center_uuid: yup.object().nullable().required(messages.expenseCenterRequired),
      value: yup
        .number()
        .nullable()
        .typeError(messages.numberType)
        .moreThan(0, messages.expenseValueRequired)
        .required(messages.expenseValueRequired),
    });

  const allocationRowSchemaPassive = yup.object().shape<Shape<FarmTransferAllocationRowForm>>({
    category_uuid: yup.object().nullable().default(null),
    center_uuid: yup.object().nullable().default(null),
    value: yup.number().nullable().default(null),
  });

  const installmentRowSchemaRequired = yup.object().shape<Shape<FarmTransferInstallmentForm>>({
    date: yup.string().nullable().required(messages.installmentDateRequired),
    value: yup
      .number()
      .nullable()
      .typeError(messages.numberType)
      .moreThan(0, messages.installmentValueRequired)
      .required(messages.installmentValueRequired),
  });

  const installmentRowSchemaPassive = yup.object().shape<Shape<FarmTransferInstallmentForm>>({
    date: yup.string().nullable().default(null),
    value: yup.number().nullable().default(null),
  });

  return yup.object({
    date: yup.string().trim().required(messages.dateRequired),

    // Filtro client-side ÚNICO e COMPARTILHADO por todas as linhas
    // (`DA-WT-12`) — NUNCA vai ao payload.
    origin_warehouse_id: optionSchema.required(messages.originWarehouseRequired),

    // Cascata NOVA (`GAP-FARMTRANSFER-FE-02`) — client-only, NUNCA vai ao
    // payload (a fazenda de destino é sempre derivada de
    // `destination_warehouse_uuid → farm_id` no servidor).
    destination_farm_id: optionSchema.required(messages.destinationFarmRequired),

    destination_warehouse_id: optionSchema.required(messages.destinationWarehouseRequired),

    items: yup
      .array()
      .of(
        yup.object().shape<Shape<FarmTransferItemForm>>({
          stock_id: yup.object().nullable().required(messages.itemStockRequired),
          quantity: yup
            .number()
            .typeError(messages.numberType)
            .moreThan(0, messages.quantityMin)
            .required(messages.itemQuantityRequired),
          amount: yup
            .number()
            .typeError(messages.numberType)
            .min(0, messages.quantityMin)
            .required(),
          // OPCIONAL — mirror `FarmTransferRequest.items.*.cost_center_uuid:
          // sometimes` (diverge do irmão, que o exige).
          cost_center_id: yup.object().nullable().default(null),
        })
      )
      .min(1, messages.itemsMin),

    // ---- Subfluxo financeiro opcional (Tarefa 03) -------------------------
    has_financial: yup.boolean().default(false),

    vl_total: yup
      .number()
      .transform((value, original) => (original === '' || original === null ? null : value))
      .nullable()
      .typeError(messages.numberType)
      .when('has_financial', {
        is: true,
        then: (schema) =>
          schema.required(messages.vlTotalRequired).moreThan(0, messages.vlTotalRequired),
      }),

    income_allocations: yup
      .array()
      .of(allocationRowSchemaPassive)
      .when('has_financial', {
        is: true,
        then: (schema) =>
          schema
            .of(allocationRowSchemaRequired)
            .min(1, messages.incomeCategoryRequired)
            .test('income-sum-matches-total', messages.incomeSumMismatch, (rows, ctx) => {
              const vlTotal = Number(ctx.parent.vl_total) || 0;
              return Math.abs(sumValues(rows) - vlTotal) <= SUM_TOLERANCE;
            }),
      }),

    expense_allocations: yup
      .array()
      .of(allocationRowSchemaPassive)
      .when('has_financial', {
        is: true,
        then: (schema) =>
          schema
            .of(expenseAllocationRowSchemaRequired)
            .min(1, messages.expenseCategoryRequired)
            .test('expense-sum-matches-total', messages.expenseSumMismatch, (rows, ctx) => {
              const vlTotal = Number(ctx.parent.vl_total) || 0;
              return Math.abs(sumValues(rows) - vlTotal) <= SUM_TOLERANCE;
            }),
      }),

    installments: yup
      .array()
      .of(installmentRowSchemaPassive)
      .when('has_financial', {
        is: true,
        then: (schema) =>
          schema
            .of(installmentRowSchemaRequired)
            .min(1, messages.installmentsMin)
            .test(
              'installments-sum-matches-total',
              messages.installmentsSumMismatch,
              (rows, ctx) => {
                const vlTotal = Number(ctx.parent.vl_total) || 0;
                return Math.abs(sumValues(rows) - vlTotal) <= SUM_TOLERANCE;
              }
            ),
      }),
  });
};

/**
 * Resolver pronto para o `useForm({ resolver })` — modo criação (lote).
 * @param {LanguageDate} languageGB - Pacote de idioma ativo (mensagens de validação i18n).
 * @return {Function} Resolver ligado ao schema de criação do módulo.
 */
export const farmTransferCreateSchemaResolver = (languageGB: LanguageDate) =>
  yupResolver(farmTransferCreateSchema(languageGB)) as any;
