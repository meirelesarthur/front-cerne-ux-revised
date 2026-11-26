import { describe, expect, it } from 'vitest';

import {
  buildGenerateOrdersPayload,
  type GeneratedOrder,
  isFullyOrdered,
  itemCoverage,
  validateGenerateOrders,
} from './generateOrders';

const items = [
  { uuid: 'i1', quantity: 100 },
  { uuid: 'i2', quantity: 10 },
  { uuid: 'i3', quantity: null },
];

const orders: GeneratedOrder[] = [
  {
    uuid: 'o1',
    code: 'OC-1',
    provider: { uuid: 'p1', name: 'Fornecedor 1' },
    status_label: 'Aguardando a Compra',
    delivery_forecast: null,
    items: [{ request_item_uuid: 'i1', quantity: 60 }],
  },
];

describe('solicitação gera N ordens de compra', () => {
  it('cobertura: soma o que já está em ordem e mostra o pendente', () => {
    const coverage = itemCoverage(items, orders);
    expect(coverage.i1).toEqual({ requested: 100, ordered: 60, pending: 40 });
    expect(coverage.i2).toEqual({ requested: 10, ordered: 0, pending: 10 });
    expect(coverage.i3.pending).toBe(0);
    expect(isFullyOrdered(coverage)).toBe(false);
  });

  it('item cancelado não fica pendente', () => {
    const coverage = itemCoverage([{ uuid: 'i1', quantity: 5, cancelled: true }], []);
    expect(coverage.i1.pending).toBe(0);
  });

  it('fica toda em ordem quando nada está pendente', () => {
    const all: GeneratedOrder[] = [
      ...orders,
      { ...orders[0], uuid: 'o2', provider: { uuid: 'p2', name: 'F2' }, items: [{ request_item_uuid: 'i1', quantity: 40 }, { request_item_uuid: 'i2', quantity: 10 }] },
    ];
    expect(isFullyOrdered(itemCoverage(items, all))).toBe(true);
  });

  it('valida: vazio, sem fornecedor e acima do pendente', () => {
    const coverage = itemCoverage(items, orders);
    expect(validateGenerateOrders([{ item_uuid: 'i1', quantity: 0, provider_uuid: 'p1' }], coverage)).toBe('empty');
    expect(validateGenerateOrders([{ item_uuid: 'i1', quantity: 10, provider_uuid: null }], coverage)).toBe('missingProvider');
    expect(
      validateGenerateOrders(
        [
          { item_uuid: 'i1', quantity: 30, provider_uuid: 'p1' },
          { item_uuid: 'i1', quantity: 20, provider_uuid: 'p2' },
        ],
        coverage
      )
    ).toBe('overPending');
    expect(validateGenerateOrders([{ item_uuid: 'i1', quantity: 40, provider_uuid: 'p2' }], coverage)).toBeNull();
  });

  it('agrupa por fornecedor: uma ordem para cada um', () => {
    const payload = buildGenerateOrdersPayload([
      { item_uuid: 'i1', quantity: 20, provider_uuid: 'p1' },
      { item_uuid: 'i2', quantity: 10, provider_uuid: 'p2' },
      { item_uuid: 'i1', quantity: 20, provider_uuid: 'p2' },
      { item_uuid: 'i3', quantity: 0, provider_uuid: 'p1' },
    ]);
    expect(payload.orders).toEqual([
      { provider_uuid: 'p1', items: [{ item_uuid: 'i1', quantity: 20 }] },
      {
        provider_uuid: 'p2',
        items: [
          { item_uuid: 'i2', quantity: 10 },
          { item_uuid: 'i1', quantity: 20 },
        ],
      },
    ]);
  });
});
