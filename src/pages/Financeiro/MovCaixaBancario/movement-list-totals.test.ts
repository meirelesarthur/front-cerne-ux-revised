import { describe, expect, it } from 'vitest';

import {
  computeMovementPageTotals,
  generatedObligationsCount,
  isOpeningBalanceRow,
  signedMovementValue,
} from './movement-list-totals';

describe('signedMovementValue', () => {
  it('E positivo, S negativo (valor em string decimal)', () => {
    expect(signedMovementValue({ type: 'E', value: '10.50' })).toBe(10.5);
    expect(signedMovementValue({ type: 'S', value: '10.50' })).toBe(-10.5);
  });
  it('prefere signed_value da API quando presente', () => {
    expect(signedMovementValue({ type: 'S', value: '10.50', signed_value: '-10.50' })).toBe(-10.5);
    expect(signedMovementValue({ type: 'E', value: '5', signed_value: '7.00' })).toBe(7);
  });
});

describe('computeMovementPageTotals', () => {
  it('soma em centavos sem erro de float (0,1 + 0,2)', () => {
    const r = computeMovementPageTotals([
      { type: 'E', value: '0.1', interest: '0.1' },
      { type: 'E', value: '0.2', interest: '0.2' },
    ]);
    expect(r.netTotal).toBe(0.3);
    expect(r.interestTotal).toBe(0.3);
  });
  it('líquido: E soma, S subtrai; juros sem sinal', () => {
    const r = computeMovementPageTotals([
      { type: 'E', value: '100.00', interest: '1.00' },
      { type: 'S', value: '30.25', interest: '2.50' },
    ]);
    expect(r.netTotal).toBe(69.75);
    expect(r.interestTotal).toBe(3.5);
  });
  it('lista vazia = zero', () => {
    expect(computeMovementPageTotals([])).toEqual({ interestTotal: 0, netTotal: 0 });
  });
  it('page_totals da API tem precedência', () => {
    const r = computeMovementPageTotals([{ type: 'E', value: '1', interest: '1' }], {
      interest: '9.90',
      net_value: '-123.45',
    });
    expect(r).toEqual({ interestTotal: 9.9, netTotal: -123.45 });
  });
  it('page_totals incompleto cai na derivação', () => {
    const r = computeMovementPageTotals([{ type: 'E', value: '2', interest: '1' }], {
      interest: '',
      net_value: '',
    } as any);
    expect(r).toEqual({ interestTotal: 1, netTotal: 2 });
  });
});

describe('isOpeningBalanceRow / generatedObligationsCount', () => {
  it('usa is_opening_balance quando existe, senão deriva de type_category === I', () => {
    expect(isOpeningBalanceRow({ is_opening_balance: true, type_category: 'E' })).toBe(true);
    expect(isOpeningBalanceRow({ is_opening_balance: false, type_category: 'I' })).toBe(false);
    expect(isOpeningBalanceRow({ type_category: 'I' })).toBe(true);
    expect(isOpeningBalanceRow({ type_category: 'F' })).toBe(false);
  });
  it('contagem de títulos: ausente = 0', () => {
    expect(generatedObligationsCount({})).toBe(0);
    expect(generatedObligationsCount({ generated_obligations_count: 3 })).toBe(3);
  });
});
