// 088 D3-FE-T3 — schema do rateio: mínimo 1 linha, obrigatórios, valor > 0, tripla única (P-2),
// Σ = total em centavos.
import { describe, expect, it } from 'vitest';
import * as yup from 'yup';

import { languagePtBr } from '@/constants/languages/languagePtBr';

import {
  hasDuplicateAllocationTriple,
  movementPurchaseAllocationsSchema,
} from './movement-purchase-allocation-schema';

const lang = languagePtBr.BR;
const messages = lang.movementPurchases.movementPurchase.form.financial.messages;
const schema = yup.object({ total: yup.number(), rows: movementPurchaseAllocationsSchema(lang) });

const opt = (value: string) => ({ label: value, value });
const r = (over: any = {}) => ({
  category: opt('cat-1'),
  plan_account: opt('acc-1'),
  center: opt('cc-1'),
  percent: 100,
  value: 100,
  ...over,
});
const errorsOf = async (total: number, rows: any[]) => {
  try {
    await schema.validate({ total, rows }, { abortEarly: false });
    return [] as string[];
  } catch (e: any) {
    return e.errors as string[];
  }
};

describe('movementPurchaseAllocationsSchema', () => {
  it('aceita 1 linha completa cuja soma fecha o total', async () => {
    expect(await errorsOf(100, [r()])).toEqual([]);
  });

  it('mínimo 1 linha', async () => {
    expect(await errorsOf(100, [])).toContain(messages.minOneRow);
  });

  it('tripla categoria+conta+centro repetida é sinalizada (P-2)', async () => {
    const errs = await errorsOf(200, [r(), r()]);
    expect(errs).toContain(messages.duplicateTriple);
  });

  it('mesma categoria+centro com contas diferentes é aceito', async () => {
    expect(await errorsOf(200, [r(), r({ plan_account: opt('acc-2') })])).toEqual([]);
  });

  it('duas linhas sem conta com mesma categoria+centro repetem a tripla', () => {
    expect(
      hasDuplicateAllocationTriple([r({ plan_account: null }), r({ plan_account: null })])
    ).toBe(true);
  });

  it('conta vazia é permitida', async () => {
    expect(await errorsOf(100, [r({ plan_account: null })])).toEqual([]);
  });

  it('categoria, centro, % e valor obrigatórios; valor > 0', async () => {
    const errs = await errorsOf(100, [
      r({ category: null, center: null, percent: null, value: 0 }),
    ]);
    expect(errs).toEqual(
      expect.arrayContaining([
        lang.movementPurchases.movementPurchase.form.validation.allocationCategoryRequired,
        lang.movementPurchases.movementPurchase.form.validation.allocationCenterRequired,
        messages.requiredFields,
      ])
    );
  });

  it('soma diferente do total → allocationTotalMismatch; centavos fecham (33,33+33,33+33,34)', async () => {
    expect(await errorsOf(100, [r({ value: 99.99 })])).toContain(messages.allocationTotalMismatch);
    const rows = [
      r({ value: 33.33, center: opt('a') }),
      r({ value: 33.33, center: opt('b') }),
      r({ value: 33.34, center: opt('c') }),
    ];
    expect(await errorsOf(100, rows)).toEqual([]);
  });

  it('total 0 não gera NaN: linha com valor > 0 diverge do total', async () => {
    expect(await errorsOf(0, [r()])).toContain(messages.allocationTotalMismatch);
  });
});
