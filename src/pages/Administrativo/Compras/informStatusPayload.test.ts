// Execução 081, T-081-FE-09 — payload e linhas do "Informar Status" da Compra
// (contrato 08 §4.2/§5.4 e EXEC-API-04).
import { describe, expect, it } from 'vitest';

import type { InformRequestPurchaseStatusForm, RequestItemRow } from '@/@types/v2/RequestPurchases';

import { buildDeliveryDateRows, buildInformStatusPayload, toDateOnly } from './informStatusPayload';

function item(overrides: Partial<RequestItemRow> = {}): RequestItemRow {
  return {
    uuid: 'item-1',
    product: null,
    description: 'Parafuso',
    brand: null,
    observation: null,
    status: 'P',
    status_label: null,
    quantity: 3,
    amount: null,
    authorized_quantity: 3,
    name: null,
    nif: null,
    phone: null,
    service_description: null,
    daily_quantity: null,
    delivery_date: null,
    forecast_delivery_date: null,
    is_authorized: true,
    ...overrides,
  };
}

function form(
  overrides: Partial<InformRequestPurchaseStatusForm> = {}
): InformRequestPurchaseStatusForm {
  return {
    status: { value: 7, label: 'Compra Efetuada' },
    financial_due_date: '2026-10-20',
    justify: '  Compra feita  ',
    item_delivery_dates: [],
    ...overrides,
  };
}

describe('buildDeliveryDateRows', () => {
  it('lista só os itens com cotação autorizada', () => {
    const rows = buildDeliveryDateRows([
      item({ uuid: 'a', is_authorized: true }),
      item({ uuid: 'b', is_authorized: false }),
      item({ uuid: 'c', is_authorized: undefined }),
    ]);
    expect(rows.map((row) => row.item_uuid)).toEqual(['a']);
  });

  it('abre com forecast_delivery_date e cai em delivery_date', () => {
    const rows = buildDeliveryDateRows([
      item({ uuid: 'a', forecast_delivery_date: '2026-11-01', delivery_date: '2026-10-05' }),
      item({ uuid: 'b', forecast_delivery_date: null, delivery_date: '2026-10-05' }),
      item({ uuid: 'c', forecast_delivery_date: null, delivery_date: null }),
    ]);
    expect(rows.map((row) => row.delivery_date)).toEqual(['2026-11-01', '2026-10-05', null]);
  });

  it('usa produto, descrição e quantidade para as colunas', () => {
    const [row] = buildDeliveryDateRows([
      item({ product: { uuid: 'p', description: 'Cimento' }, description: 'CP-II', quantity: 7 }),
    ]);
    expect(row).toMatchObject({ item_label: 'Cimento', item_description: 'CP-II', quantity: 7 });
  });
});

describe('toDateOnly', () => {
  it('corta data e hora e ignora formato inválido', () => {
    expect(toDateOnly('2026-10-20T00:00:00+00:00')).toBe('2026-10-20');
    expect(toDateOnly('20/10/2026')).toBeNull();
    expect(toDateOnly(null)).toBeNull();
  });
});

describe('buildInformStatusPayload', () => {
  it('envia todas as linhas autorizadas; linha em branco vai null (zera a previsão)', () => {
    const payload = buildInformStatusPayload(
      form({
        item_delivery_dates: [
          { item_uuid: 'a', item_label: 'A', delivery_date: '2026-11-01' },
          { item_uuid: 'b', item_label: 'B', delivery_date: null },
          { item_uuid: 'c', item_label: 'C', delivery_date: '' },
        ],
      })
    );
    expect(payload.item_delivery_dates).toEqual({ a: '2026-11-01', b: null, c: null });
  });

  it('sem linhas autorizadas o campo não vai (a API não mexe nos itens)', () => {
    expect(buildInformStatusPayload(form()).item_delivery_dates).toBeUndefined();
  });

  it('limpar o vencimento grava null explícito', () => {
    expect(
      buildInformStatusPayload(form({ financial_due_date: null })).financial_due_date
    ).toBeNull();
    expect(
      buildInformStatusPayload(form({ financial_due_date: '' })).financial_due_date
    ).toBeNull();
  });

  it('mantém a data de vencimento e apara a justificativa', () => {
    const payload = buildInformStatusPayload(form());
    expect(payload).toMatchObject({
      status: 7,
      justify: 'Compra feita',
      financial_due_date: '2026-10-20',
    });
  });

  it('aceita o destino 10 (Pedido Cancelado)', () => {
    expect(
      buildInformStatusPayload(form({ status: { value: 10, label: 'Pedido Cancelado' } })).status
    ).toBe(10);
  });
});
