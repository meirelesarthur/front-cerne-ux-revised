import { describe, expect, it } from 'vitest';

import { buildQuotationMap, type QuotationMapData } from './quotationMap';

const base = { date: null, total_reported: null, delivery_days: null, payment_condition: null };

const data: QuotationMapData = {
  items: [
    { uuid: 'i1', product: 'A', description: 'A', quantity: 10 },
    { uuid: 'i2', product: 'B', description: 'B', quantity: 2 },
  ],
  suppliers: [
    { ...base, uuid: 'parcial', name: 'Parcial', received: true, prices: [5, null], freight: 0, discount: 0 },
    { ...base, uuid: 'caro', name: 'Caro', received: true, prices: [9, 105], freight: 0, discount: 0 },
    { ...base, uuid: 'barato', name: 'Barato', received: true, prices: [8, 110], freight: 10, discount: 20 },
    { ...base, uuid: 'aguardando', name: 'Aguardando', received: false, prices: [null, null], freight: 0, discount: 0 },
  ],
};

describe('mapa de cotações', () => {
  it('total = itens cotados + frete − desconto', () => {
    const map = buildQuotationMap(data);
    const barato = map.suppliers.find((s) => s.uuid === 'barato')!;
    expect(barato.subtotal).toBe(300);
    expect(barato.total).toBe(290);
  });

  it('mais barato no geral primeiro; quem cotou parte depois; quem não respondeu por último', () => {
    expect(buildQuotationMap(data).suppliers.map((s) => s.uuid)).toEqual(['barato', 'caro', 'parcial', 'aguardando']);
  });

  it('menor preço de cada item entre as cotações recebidas', () => {
    const map = buildQuotationMap(data);
    expect(map.cheapest.i1).toEqual({ supplierUuid: 'parcial', price: 5 });
    expect(map.cheapest.i2).toEqual({ supplierUuid: 'caro', price: 105 });
  });

  it('melhor de cada item: total, quantos fornecedores e economia sobre o melhor total', () => {
    const map = buildQuotationMap(data);
    expect(map.bestComplete?.uuid).toBe('barato');
    expect(map.bestByItem).toEqual({ total: 260, suppliers: 2, saving: 30, complete: true });
  });

  it('sem estoque é resposta explícita: conta no fornecedor, mas ele segue parcial', () => {
    const map = buildQuotationMap({
      ...data,
      suppliers: [
        { ...base, uuid: 'sem', name: 'Sem estoque', received: true, prices: [5, null], unavailable: [false, true], freight: 0, discount: 0 },
        { ...base, uuid: 'completo', name: 'Completo', received: true, prices: [9, 105], freight: 0, discount: 0 },
      ],
    });
    const sem = map.suppliers.find((s) => s.uuid === 'sem')!;
    expect(sem.unavailableCount).toBe(1);
    expect(sem.complete).toBe(false);
    expect(map.suppliers.map((s) => s.uuid)).toEqual(['completo', 'sem']);
    expect(map.bestComplete?.uuid).toBe('completo');
    expect(map.suppliers.find((s) => s.uuid === 'completo')!.unavailableCount).toBe(0);
  });

  it('item que ninguém cotou deixa a combinação incompleta e sem economia', () => {
    const map = buildQuotationMap({
      ...data,
      suppliers: [{ ...base, uuid: 'p', name: 'P', received: true, prices: [5, null], freight: 0, discount: 0 }],
    });
    expect(map.cheapest.i2).toBeNull();
    expect(map.bestByItem.complete).toBe(false);
    expect(map.bestByItem.saving).toBeNull();
  });
});
