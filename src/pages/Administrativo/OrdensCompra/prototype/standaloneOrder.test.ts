import { describe, expect, it } from 'vitest';

import {
  buildInstallments,
  buildStandaloneOrderPayload,
  emptyStandaloneOrder,
  newStandaloneItem,
  type StandaloneOrderForm,
  standaloneOrderTotal,
  validateStandaloneOrder,
} from './standaloneOrder';

const valid = (): StandaloneOrderForm => ({
  ...emptyStandaloneOrder(),
  provider_uuid: 'p1',
  farm_uuid: 'f1',
  category: 'produto',
  delivery_forecast: '2026-12-01',
  items: [
    { ...newStandaloneItem(), description: 'Diesel S10 (L)', quantity: 1000, unit_price: 6.2 },
    newStandaloneItem(),
  ],
});

describe('ordem de compra avulsa', () => {
  it('pede fornecedor, fazenda, categoria e ao menos um item, nessa ordem', () => {
    expect(validateStandaloneOrder(emptyStandaloneOrder())).toBe('provider');
    expect(validateStandaloneOrder({ ...valid(), farm_uuid: null })).toBe('farm');
    expect(validateStandaloneOrder({ ...valid(), category: null })).toBe('category');
    expect(validateStandaloneOrder({ ...valid(), items: [newStandaloneItem()] })).toBe('items');
  });

  it('item começado e incompleto bloqueia; linha em branco é ignorada', () => {
    const form = valid();
    expect(validateStandaloneOrder(form)).toBeNull();
    form.items[1] = { ...form.items[1], description: 'Óleo 15W40' };
    expect(validateStandaloneOrder(form)).toBe('itemIncomplete');
  });

  it('total e envio só com as linhas completas; marcação e previsão opcionais', () => {
    const form = { ...valid(), mark: 'urgencia' as const };
    expect(standaloneOrderTotal(form)).toBeCloseTo(6200);
    expect(buildStandaloneOrderPayload(form)).toEqual({
      provider_uuid: 'p1',
      farm_uuid: 'f1',
      category: 'produto',
      mark: 'urgencia',
      delivery_forecast: '2026-12-01',
      items: [{ description: 'Diesel S10 (L)', quantity: 1000, unit_price: 6.2 }],
      delivery: null,
      payment: null,
    });
    expect(buildStandaloneOrderPayload({ ...valid(), delivery_forecast: '' }).delivery_forecast).toBeNull();
  });

  it('sem local de entrega e sem condição, entrega e pagamento vão vazios', () => {
    const payload = buildStandaloneOrderPayload(valid());
    expect(payload.delivery).toBeNull();
    expect(payload.payment).toBeNull();
  });

  it('entrega vai quando tem o local', () => {
    const form = valid();
    form.delivery = { freight_type: 'FOB', place: ' Retirada no balcão ', carrier: '', needs_unloading: true, note: '' };
    expect(buildStandaloneOrderPayload(form).delivery).toEqual({
      freight_type: 'FOB',
      place: 'Retirada no balcão',
      carrier: null,
      needs_unloading: true,
      note: null,
    });
  });

  it('condição de pagamento pede nº de parcelas e 1º vencimento', () => {
    const form = valid();
    form.payment = { ...form.payment, condition: '30/60', installments: 2, first_due: '' };
    expect(validateStandaloneOrder(form)).toBe('paymentIncomplete');
  });

  it('parcelas iguais sobre itens + despesas; a última absorve o arredondamento', () => {
    const form = valid();
    form.payment = { condition: '30/60/90', installments: 3, first_due: '2026-12-26', interval_days: 30, freight: 100, insurance: null, other: null };
    const payment = buildStandaloneOrderPayload(form).payment!;
    expect(payment.expenses).toEqual({ freight: 100, insurance: 0, other: 0 });
    expect(payment.installments.map((p) => p.due_date)).toEqual(['2026-12-26', '2027-01-25', '2027-02-24']);
    expect(payment.installments.map((p) => p.value)).toEqual([2100, 2100, 2100]);
    expect(buildInstallments(100, 3, '2026-12-01', 30).map((p) => p.value)).toEqual([33.33, 33.33, 33.34]);
  });

  it('não monta envio de formulário inválido', () => {
    expect(() => buildStandaloneOrderPayload(emptyStandaloneOrder())).toThrow();
  });
});
