// src/validations/schemas/Operacional/AnimalFazenda/transferAnimalFarmFinancial-schema.ts
// -----------------------------------------------------------------------------
// Schema de validação Yup da tela FINANCEIRA (standalone, TASK-FE-042-105) da
// Transferência de Animal entre Fazendas — mirror LITERAL de
// `transferBatchFarmFinancial-schema.ts` (97-Esteiras/041): `vl_total`
// (`gt:0`), `fiscal_document` (boolean), `proprietary_uuid` (opcional),
// `installments[]` (min 1), `income_categories[]` (min 1) +
// `expense_categories[]` (min 1) — DOIS rateios separados, mesmos 3 testes de
// soma == `vl_total` (tolerância 0.01).
//
// `qtd_installments`/`first_installment_date`/`int_installments` —
// front-only (gerador de parcelas), nunca vão ao payload.
//
// `has_input`/`input_date`/`input_value` (DIV-08, 063-est03-9-reprovacoes) —
// bloco "Possui entrada?" restaurado, mirror `transferBatchFarmFinancial-
// schema.ts` (irmã Lote/Fazenda). DIFERENÇA vs. a irmã: aqui os 3 campos SÃO
// enviados ao payload (a API paralela, TASK-API-063-03, valida e persiste).
// -----------------------------------------------------------------------------

import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

import type { LanguageDate } from '@/@types/language';
import type { Option } from '@/@types/option';
import type {
  TransferAnimalFarmCategoryRowForm,
  TransferAnimalFarmInstallmentRowForm,
} from '@/@types/v2/Operacional/AnimalFazenda/transferAnimalFarm';
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
 * Schema da tela financeira (parcelas + rateio entrada/saída).
 * @param {LanguageDate} languageGB - Pacote de idioma ativo (mensagens de validação i18n).
 * @return {yup.ObjectSchema<any>} Schema Yup do financeiro.
 */
export const transferAnimalFarmFinancialSchema = (languageGB: LanguageDate) => {
  const messages = languageGB.animalFazenda.transferAnimalFarm.form.fields.financial.validation;

  return yup.object({
    vl_total: yup
      .number()
      .transform((value, original) => (original === '' || original === null ? null : value))
      .typeError(messages.vlTotalRequired)
      .moreThan(0, messages.vlTotalRequired)
      .required(messages.vlTotalRequired),

    fiscal_document: optionSchema.required(messages.fiscalDocumentRequired),
    proprietary_uuid: optionSchema,

    // DIV-08 (063-est03-9-reprovacoes) — "Possui entrada?" restaurado, mirror
    // `CreateOrUpdateTransferBatchFarm.tsx`/`transfer_form.blade.php`, 3
    // estados (null=Selecione/false=Não/true=Sim); `input_date`/`input_value`
    // condicionalmente obrigatórios só quando `has_input.value === true`.
    has_input: optionSchema,
    input_date: yup
      .string()
      .nullable()
      .when('has_input', {
        is: (option: Option<boolean> | null | undefined) => option?.value === true,
        then: (schema) => schema.required(messages.inputDateRequired),
      }),
    input_value: yup
      .number()
      .transform((value, original) => (original === '' || original === null ? null : value))
      .nullable()
      .typeError(messages.numberType)
      .when('has_input', {
        is: (option: Option<boolean> | null | undefined) => option?.value === true,
        then: (schema) =>
          schema.required(messages.inputValueRequired).min(0.01, messages.inputValueRequired),
      }),

    qtd_installments: yup
      .number()
      .transform((value, original) => (original === '' || original === null ? null : value))
      .nullable()
      .typeError(messages.numberType)
      .integer(messages.numberType)
      .min(1, messages.installmentsCountRequired)
      .required(messages.installmentsCountRequired),
    first_installment_date: yup.string().nullable().required(messages.firstInstallmentDateRequired),
    int_installments: yup
      .number()
      .transform((value, original) => (original === '' || original === null ? null : value))
      .nullable()
      .typeError(messages.numberType)
      .integer(messages.numberType)
      .min(0, messages.installmentsIntervalRequired)
      .required(messages.installmentsIntervalRequired),

    installments: yup
      .array()
      .of(
        yup.object().shape<Shape<TransferAnimalFarmInstallmentRowForm>>({
          due_date: yup.string().nullable().required(messages.installmentDateRequired),
          value: yup
            .number()
            .nullable()
            .typeError(messages.numberType)
            .moreThan(0, messages.installmentValueRequired)
            .required(messages.installmentValueRequired),
        })
      )
      .min(1, messages.installmentsMin)
      .test('installments-sum-matches-total', messages.installmentsSumMismatch, (rows, ctx) => {
        const vlTotal = Number(ctx.parent.vl_total) || 0;
        // DIV-08 — saldo a financiar = `vl_total - entrada` quando
        // `has_input=Sim` (mirror `calcInstallments()` legado); `has_input=
        // Não`/`Selecione` preserva o comportamento anterior (net = vlTotal).
        const hasInput =
          (ctx.parent.has_input as Option<boolean> | null | undefined)?.value === true;
        const inputValue = hasInput ? Number(ctx.parent.input_value) || 0 : 0;
        const netTotal = vlTotal - inputValue;
        return Math.abs(sumValues(rows) - netTotal) <= SUM_TOLERANCE;
      }),

    income_categories: yup
      .array()
      .of(
        yup.object().shape<Shape<TransferAnimalFarmCategoryRowForm>>({
          category_uuid: optionSchema.required(messages.categoryRequired),
          center_uuid: optionSchema.required(messages.centerRequired),
          value: yup
            .number()
            .nullable()
            .typeError(messages.numberType)
            .min(0.01, messages.categoryValueRequired)
            .required(messages.categoryValueRequired),
        })
      )
      .min(1, messages.categoriesMin)
      .test('income-sum-matches-total', messages.categoriesSumMismatch, (rows, ctx) => {
        const vlTotal = Number(ctx.parent.vl_total) || 0;
        return Math.abs(sumValues(rows) - vlTotal) <= SUM_TOLERANCE;
      }),

    expense_categories: yup
      .array()
      .of(
        yup.object().shape<Shape<TransferAnimalFarmCategoryRowForm>>({
          category_uuid: optionSchema.required(messages.categoryRequired),
          center_uuid: optionSchema.required(messages.centerRequired),
          value: yup
            .number()
            .nullable()
            .typeError(messages.numberType)
            .min(0.01, messages.categoryValueRequired)
            .required(messages.categoryValueRequired),
        })
      )
      .min(1, messages.categoriesMin)
      .test('expense-sum-matches-total', messages.categoriesSumMismatch, (rows, ctx) => {
        const vlTotal = Number(ctx.parent.vl_total) || 0;
        return Math.abs(sumValues(rows) - vlTotal) <= SUM_TOLERANCE;
      }),
  });
};

/**
 * Resolver pronto para o `useForm({ resolver })`.
 * @param {LanguageDate} languageGB - Pacote de idioma ativo (mensagens de validação i18n).
 * @return {Function} Resolver ligado ao schema financeiro do módulo.
 */
export const transferAnimalFarmFinancialSchemaResolver = (languageGB: LanguageDate) =>
  yupResolver(transferAnimalFarmFinancialSchema(languageGB)) as any;
