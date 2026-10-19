// src/validations/schemas/MovementPurchases/movement-purchase-financial-schema.ts
// -----------------------------------------------------------------------------
// 088 D3-FE-T2 — campos Yup do financeiro da Compra de Animais: cabeçalho
// (S2a-S5b), entrada (S3), gerador (S4) e parcelas (S6). A D3-FE-T4 compõe
// estes campos em `movement-purchase-schema.ts` (`...movementPurchaseFinancialFields`).
//
// Regras (PLANO-088-D3-D4-FRONT §3.1/§3.2, contrato legado §3.1/§4.1):
//  - obrigatórios SÓ com `has_financial=true` e SEM baixa (`financial_write_off`
//    = passivo, D2);
//  - entrada (`has_input=true`): data obrigatória, 0 < valor < total;
//  - cada parcela > 0 (P-5) — mensagem `installmentPositive` com a posição;
//  - Σ parcelas (em centavos, sem tolerância) = total da compra.
// O `total` é lido do objeto raiz do formulário (`parent.total`).
// -----------------------------------------------------------------------------

import * as yup from 'yup';

import {
  fromCents,
  sumCents,
  toCents,
} from '@/pages/Operacional/CompraAnimais/movementPurchaseFinancialMath';

import type { LanguageDate } from '@/@types/language';

function formatBRL(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

// Posição 1-based da parcela a partir do path Yup (`financial_installments[2].amount`).
function positionFromPath(path: string | undefined): number {
  const match = /\[(\d+)\]/.exec(path ?? '');
  return match ? Number(match[1]) + 1 : 1;
}

export const movementPurchaseFinancialFields = (languageGB: LanguageDate) => {
  const text = languageGB.movementPurchases.movementPurchase.form.financial;
  const messages = text.messages;
  const required = languageGB.defaltStrings.validations.requiredField;
  const invalid = languageGB.defaltStrings.validations.invalidValue;

  const isActive = (hasFinancial: unknown, writeOff: unknown) => hasFinancial === true && !writeOff;

  const optionOrNull = () =>
    yup.object({ label: yup.string(), value: yup.mixed() }).nullable().default(null);

  const rowActive = yup.object({
    due_date: yup.string().nullable().required(required),
    amount: yup
      .number()
      .nullable()
      .typeError(invalid)
      .test('installment-positive', (value, ctx) => {
        if (Number(value) > 0) return true;
        return ctx.createError({
          message: messages.installmentPositive.replace(
            '{{position}}',
            String(positionFromPath(ctx.path))
          ),
        });
      }),
    origin: yup.string().nullable(),
  });

  const rowPassive = yup.object({
    due_date: yup.string().nullable().default(null),
    amount: yup.number().nullable().default(null),
    origin: yup.string().nullable(),
  });

  return {
    financial_number: yup
      .string()
      .nullable()
      .default('')
      .when(['has_financial', 'financial_write_off'], {
        is: isActive,
        then: (schema) => schema.trim().max(15, invalid).required(required),
      }),

    financial_type_title: optionOrNull().when(['has_financial', 'financial_write_off'], {
      is: isActive,
      then: (schema) => schema.required(required),
    }),

    // Opcional (`.ignore` no legado).
    financial_proprietary: optionOrNull(),

    // Sem `max`: o `infCpl` do XML pode passar de 200 (o limite é só de digitação).
    financial_note: yup
      .string()
      .nullable()
      .default('')
      .when(['has_financial', 'financial_write_off'], {
        is: isActive,
        then: (schema) => schema.trim().required(required),
      }),

    financial_has_input: yup
      .boolean()
      .nullable()
      .default(null)
      .when(['has_financial', 'financial_write_off'], {
        is: isActive,
        then: (schema) =>
          schema.test('has-input-chosen', required, (value) => value === true || value === false),
      }),

    financial_input_date: yup
      .string()
      .nullable()
      .default(null)
      .when(['has_financial', 'financial_write_off', 'financial_has_input'], {
        is: (hasFinancial: unknown, writeOff: unknown, hasInput: unknown) =>
          isActive(hasFinancial, writeOff) && hasInput === true,
        then: (schema) => schema.required(required),
      }),

    financial_input_value: yup
      .number()
      .nullable()
      .typeError(invalid)
      .default(null)
      .when(['has_financial', 'financial_write_off', 'financial_has_input'], {
        is: (hasFinancial: unknown, writeOff: unknown, hasInput: unknown) =>
          isActive(hasFinancial, writeOff) && hasInput === true,
        then: (schema) =>
          schema
            .test('input-required', required, (value) => value !== null && value !== undefined)
            .test(
              'input-positive',
              invalid,
              (value) => value === null || value === undefined || value > 0
            )
            .test('input-less-than-total', messages.inputLessThanTotal, (value, ctx) => {
              if (value === null || value === undefined) return true;
              const total = toCents(Number(ctx.parent.total) || 0);
              // Total 0 já é erro próprio de `financial_installments`.
              return total <= 0 || toCents(value) < total;
            }),
      }),

    financial_fiscal_document: yup
      .boolean()
      .nullable()
      .default(true)
      .when(['has_financial', 'financial_write_off'], {
        is: isActive,
        then: (schema) =>
          schema.test('fiscal-chosen', required, (value) => value === true || value === false),
      }),

    financial_classification: yup
      .string()
      .nullable()
      .default('N')
      .when(['has_financial', 'financial_write_off'], {
        is: isActive,
        then: (schema) =>
          schema.test('classification-chosen', required, (value) =>
            ['N', 'C', 'O'].includes(String(value))
          ),
      }),

    // Gerador (S4) — estado de tela; obrigatório com financeiro, nunca vai ao fio.
    generator: yup
      .object({
        count: yup.number().nullable().default(null),
        first_due_date: yup.string().nullable().default(null),
        interval_days: yup.number().nullable().default(null),
      })
      .nullable()
      .default(undefined)
      .when(['has_financial', 'financial_write_off'], {
        is: isActive,
        then: (schema) =>
          schema.shape({
            count: yup
              .number()
              .nullable()
              .typeError(invalid)
              .required(required)
              .integer(invalid)
              .min(1, invalid),
            first_due_date: yup.string().nullable().required(required),
            interval_days: yup
              .number()
              .nullable()
              .typeError(invalid)
              .required(required)
              .integer(invalid)
              .min(0, invalid),
          }),
      }),

    financial_installments: yup
      .array()
      .of(rowPassive)
      .default([])
      .when(['has_financial', 'financial_write_off'], {
        is: isActive,
        then: (schema: any) =>
          schema
            .of(rowActive)
            .min(1, languageGB.movementPurchases.movementPurchase.form.validation.installmentsMin)
            .test('financial-installments-first-is-input', (rows: any, ctx: yup.TestContext) => {
              if (ctx.parent.financial_has_input !== true || (rows ?? []).length === 0) return true;
              if (rows[0]?.origin === 'input') return true;
              return ctx.createError({ message: messages.firstInstallmentMustBeInput });
            })
            .test(
              'financial-installments-total-positive',
              messages.totalMustBePositive,
              (_value: any, ctx: yup.TestContext) => {
                return toCents(Number(ctx.parent.total) || 0) > 0;
              }
            )
            .test('financial-installments-sum-matches-total', (rows: any, ctx: yup.TestContext) => {
              const totalCents = toCents(Number(ctx.parent.total) || 0);
              const sum = sumCents(
                (rows ?? []).map((row: any) => toCents(Number(row?.amount) || 0))
              );
              if (totalCents <= 0 || (rows ?? []).length === 0 || sum === totalCents) return true;
              return ctx.createError({
                message: messages.installmentsSumMismatch
                  .replace('{{sum}}', formatBRL(fromCents(sum)))
                  .replace('{{total}}', formatBRL(fromCents(totalCents))),
              });
            }),
      }),
  };
};

export default movementPurchaseFinancialFields;
