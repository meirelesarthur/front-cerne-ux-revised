import { describe, expect, it } from 'vitest';

import { isDeliveryLate, itemTotals, paymentCheck } from './prototypeFields';

const item = (partial: Record<string, unknown>) =>
  ({ uuid: 'i', description: 'x', amount: 0, quantity: null, ...partial }) as never;

describe('isDeliveryLate', () => {
  it('previsão vencida com entrega esperada é atrasada', () => {
    expect(isDeliveryLate('2026-11-22', 6, '2026-11-25')).toBe(true);
  });

  it('previsão de hoje ou futura não atrasa', () => {
    expect(isDeliveryLate('2026-11-25', 7, '2026-11-25')).toBe(false);
    expect(isDeliveryLate('2026-12-01', 2, '2026-11-25')).toBe(false);
  });

  it('recebida, finalizada, recusada ou cancelada nunca atrasa', () => {
    [5, 8, 9, 10].forEach((status) => expect(isDeliveryLate('2026-10-01', status, '2026-11-25')).toBe(false));
  });

  it('sem previsão não atrasa', () => {
    expect(isDeliveryLate(null, 6, '2026-11-25')).toBe(false);
  });
});

describe('paymentCheck', () => {
  const payment = (values: number[], freight = 0) => ({
    condition: '30/60',
    installments: values.map((value, i) => ({ seq: i + 1, due_date: '2026-12-01', value, status: 'open' as const })),
    expenses: { freight, insurance: 0, other: 0 },
  });

  it('parcelas que somam itens + despesas conferem', () => {
    expect(paymentCheck(1000, payment([600, 450], 50))).toEqual({ expenses: 50, expected: 1050, scheduled: 1050, diff: 0 });
  });

  it('aponta quanto falta parcelar', () => {
    expect(paymentCheck(1000, payment([500])).diff).toBe(500);
  });
});

describe('itemTotals', () => {
  it('usa o unitário do protótipo e calcula o saldo', () => {
    expect(itemTotals(item({ quantity: 40, amount: 138000, unit_price: 3450, received_quantity: 20 }))).toEqual({
      quantity: 40,
      unit: 3450,
      total: 138000,
      received: 20,
      balance: 20,
      cancelled: false,
    });
  });

  it('item cancelado não tem saldo a receber', () => {
    expect(itemTotals(item({ quantity: 40, amount: 100, received_quantity: 10, cancelled: true })).balance).toBe(0);
  });

  it('sem unitário, divide o valor pela quantidade', () => {
    expect(itemTotals(item({ quantity: 12, amount: 46680 })).unit).toBe(3890);
  });

  it('item sem quantidade (adiantamento) não tem saldo', () => {
    expect(itemTotals(item({ quantity: null, amount: 9600 }))).toMatchObject({ unit: 9600, balance: null });
  });

  it('saldo nunca fica negativo', () => {
    expect(itemTotals(item({ quantity: 10, amount: 100, received_quantity: 12 })).balance).toBe(0);
  });
});
