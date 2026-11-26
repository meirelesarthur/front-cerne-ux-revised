import { describe, expect, it, vi } from 'vitest';

vi.mock('@/services/api', () => ({ default: { V2: { get: vi.fn(), post: vi.fn() } } }));

import {
  countPurchaseOrderViews,
  filterPurchaseOrders,
  purchaseOrderEntityPath,
  purchaseOrderHasBalance,
  purchaseOrderItemBalance,
  type PurchaseOrderSummary,
  purchaseOrderStatusColor,
} from './purchaseOrderEntity';

const base: PurchaseOrderSummary = {
  uuid: 'oc1',
  code: 'OC-0013-1',
  provider: { uuid: 'p1', name: 'AgroNutri Insumos Ltda' },
  status: 6,
  status_label: 'Aguardando a Compra',
  date: '2026-11-26',
  farm: { uuid: 'f1', description: 'Fazenda Santa Rita' },
  delivery_forecast: null,
  request: { uuid: 's1', code: '0013', description: 'Semente de soja' },
  items_count: 1,
  total: 1000,
};

const orders: PurchaseOrderSummary[] = [
  base,
  { ...base, uuid: 'oc2', code: 'OC-0031', provider: { uuid: 'p2', name: 'Posto Estrada Real' }, request: null },
  { ...base, uuid: 'oc3', code: 'OC-0029', status: 8, request: null, farm: { uuid: 'f2', description: 'Fazenda Boa Vista' } },
];

describe('ordem de compra (entidade própria)', () => {
  it('filtra por visão', () => {
    expect(filterPurchaseOrders(orders, { view: 'abertas', origin: 'todas', search: '' }).map((o) => o.uuid)).toEqual(['oc1', 'oc2']);
    expect(filterPurchaseOrders(orders, { view: 'recebidas', origin: 'todas', search: '' }).map((o) => o.uuid)).toEqual(['oc3']);
  });

  it('filtra pela origem: da solicitação ou avulsa', () => {
    expect(filterPurchaseOrders(orders, { view: 'todas', origin: 'solicitacao', search: '' }).map((o) => o.uuid)).toEqual(['oc1']);
    expect(filterPurchaseOrders(orders, { view: 'todas', origin: 'avulsa', search: '' }).map((o) => o.uuid)).toEqual(['oc2', 'oc3']);
  });

  it('busca por código, fornecedor, solicitação ou fazenda', () => {
    const find = (search: string) => filterPurchaseOrders(orders, { view: 'todas', origin: 'todas', search }).map((o) => o.uuid);
    expect(find('posto')).toEqual(['oc2']);
    expect(find('0013')).toEqual(['oc1']);
    expect(find('boa vista')).toEqual(['oc3']);
  });

  it('conta as visões', () => {
    expect(countPurchaseOrderViews(orders)).toEqual({ abertas: 2, recebidas: 1, todas: 3 });
  });

  it('saldo do item e se a ordem ainda tem o que receber', () => {
    const item = { uuid: 'i', description: 'x', product: null, quantity: 10, unit_price: 1, total: 10, received_quantity: 4, cancelled: false, request_item_uuid: null };
    expect(purchaseOrderItemBalance(item)).toBe(6);
    expect(purchaseOrderItemBalance({ ...item, cancelled: true })).toBe(0);
    expect(purchaseOrderHasBalance({ status: 7, items: [item] })).toBe(true);
    expect(purchaseOrderHasBalance({ status: 8, items: [item] })).toBe(false);
    expect(purchaseOrderHasBalance({ status: 7, items: [{ ...item, received_quantity: 10 }] })).toBe(false);
  });

  it('caminho e cor da situação', () => {
    expect(purchaseOrderEntityPath('oc1')).toBe('/administrativo/ordens-de-compra/ordens/oc1');
    expect(purchaseOrderStatusColor(8)).toBe('green.700');
    expect(purchaseOrderStatusColor(6)).toBe('orange.600');
  });
});
