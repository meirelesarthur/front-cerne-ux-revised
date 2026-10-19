// src/validations/schemas/MovementPurchases/movement-purchase-allocation-schema.ts
// -----------------------------------------------------------------------------
// 088 D3-FE-T3 — schema Yup do RATEIO (despesa) da Compra de Animais. Módulo
// SEPARADO de `movement-purchase-schema.ts` (a T4 compõe os dois):
//  - mínimo 1 linha (legado IG-12: "Você deve ter ao menos um item na lista");
//  - categoria, centro, % e valor obrigatórios por linha; valor > 0; a Conta
//    Contábil é OPCIONAL (cascata pode não achar conta — payload `plan_account_uuid` null);
//  - tripla (categoria + conta + centro) única — decisão P-2; mesma categoria +
//    centro com contas diferentes é aceito;
//  - Σ valores = total da compra, comparado em CENTAVOS inteiros
//    (legado EF:255-261 "O total do rateio difere do valor total.").
// O total vem de `parent.total` (campo `total` do form de Compra).
// -----------------------------------------------------------------------------

import * as yup from 'yup';

import { sumCents, toCents } from '@/pages/Operacional/CompraAnimais/movementPurchaseFinancialMath';

import type { LanguageDate } from '@/@types/language';
import type { MovementPurchaseFinAllocationRow } from '@/@types/v2/MovementPurchases';

type RowLike = Partial<MovementPurchaseFinAllocationRow> | undefined | null;

// Chave estável da tripla; conta vazia conta como '' (duas linhas sem conta, mesma categoria+centro, repetem).
export function allocationTripleKey(row: RowLike): string | null {
  const category = row?.category?.value;
  const center = row?.center?.value;
  if (!category || !center) return null;
  return `${category}|${row?.plan_account?.value ?? ''}|${center}`;
}

export function hasDuplicateAllocationTriple(rows: RowLike[] | undefined | null): boolean {
  const seen = new Set<string>();
  for (const row of rows ?? []) {
    const key = allocationTripleKey(row);
    if (!key) continue;
    if (seen.has(key)) return true;
    seen.add(key);
  }
  return false;
}

export function sumAllocationValueCents(rows: RowLike[] | undefined | null): number {
  return sumCents((rows ?? []).map((row) => toCents(row?.value)));
}

export const movementPurchaseAllocationsSchema = (languageGB: LanguageDate) => {
  const messages = languageGB.movementPurchases.movementPurchase.form.financial.messages;
  const validation = languageGB.movementPurchases.movementPurchase.form.validation;

  const optionRequired = (message: string) =>
    yup
      .object({ label: yup.string(), value: yup.mixed() })
      .nullable()
      .test('option-required', message, (option) => !!option?.value);

  const row = yup.object({
    category: optionRequired(validation.allocationCategoryRequired),
    plan_account: yup.object({ label: yup.string(), value: yup.mixed() }).nullable().default(null),
    center: optionRequired(validation.allocationCenterRequired),
    percent: yup
      .number()
      .nullable()
      .typeError(validation.numberType)
      .required(messages.requiredFields),
    value: yup
      .number()
      .nullable()
      .typeError(validation.numberType)
      .required(messages.requiredFields)
      .moreThan(0, messages.requiredFields),
  });

  return yup
    .array()
    .of(row)
    .min(1, messages.minOneRow)
    .test('allocation-triple-unique', messages.duplicateTriple, (rows) => {
      return !hasDuplicateAllocationTriple(rows as RowLike[]);
    })
    .test('allocation-sum-matches-total', messages.allocationTotalMismatch, (rows, ctx) => {
      const totalCents = toCents(Number((ctx.parent as { total?: number })?.total) || 0);
      return sumAllocationValueCents(rows as RowLike[]) === totalCents;
    });
};

export default movementPurchaseAllocationsSchema;
