import { describe, expect, it } from 'vitest';

import {
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
    });
    expect(buildStandaloneOrderPayload({ ...valid(), delivery_forecast: '' }).delivery_forecast).toBeNull();
  });

  it('não monta envio de formulário inválido', () => {
    expect(() => buildStandaloneOrderPayload(emptyStandaloneOrder())).toThrow();
  });
});
