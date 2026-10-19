import { describe, expect, it } from 'vitest';

import {
  canAddPaymentRow,
  installmentAmount,
  lineAmount,
  totalAmount,
} from './publicQuotationTotals';

describe('publicQuotationTotals — cálculo igual ao legado', () => {
  it('linha: 12,3456 x 10,00 = 123,46', () => {
    expect(lineAmount(12.3456, 10)).toBe(123.46);
  });

  it('linha sem preço vale 0', () => {
    expect(lineAmount(null, 10)).toBe(0);
    expect(lineAmount(undefined, 10)).toBe(0);
  });

  it('total geral soma as linhas já arredondadas', () => {
    expect(
      totalAmount([
        { unitary_value: 12.3456, quantity: 10 },
        { unitary_value: 0.0001, quantity: 3 },
        { unitary_value: 5, quantity: 2 },
      ])
    ).toBe(133.46);
  });

  it('parcela = total / parcelas em 2 casas', () => {
    expect(installmentAmount(100, 3)).toBe(33.33);
    expect(installmentAmount(123.46, 2)).toBe(61.73);
  });

  it('parcela sem parcelas válidas vale 0', () => {
    expect(installmentAmount(100, null)).toBe(0);
    expect(installmentAmount(100, 0)).toBe(0);
  });

  it('adicionar condição exige a linha anterior completa', () => {
    const complete = {
      payment_method: { label: 'Boleto', value: 1 },
      installments: 2,
      interval: 30,
    };
    expect(canAddPaymentRow([complete])).toBe(true);
    expect(canAddPaymentRow([{ ...complete, payment_method: null }])).toBe(false);
    expect(canAddPaymentRow([{ ...complete, installments: null }])).toBe(false);
    expect(canAddPaymentRow([{ ...complete, interval: null }])).toBe(false);
    expect(canAddPaymentRow([complete, { ...complete, interval: undefined }])).toBe(false);
  });

  it('intervalo 0 conta como preenchido', () => {
    expect(
      canAddPaymentRow([
        { payment_method: { label: 'À vista', value: 0 }, installments: 1, interval: 0 },
      ])
    ).toBe(true);
  });
});
