// src/pages/Administrativo/Solicitacao/quotationStageItems.test.ts
// Conversões do quadro de itens da aba Cotações (081, T-081-FE-08, P21).

import { describe, expect, it } from 'vitest';

import type { RequestItemRow } from '@/@types/v2/RequestPurchases';

import {
  buildStageItemRows,
  buildStageItemsPayload,
  STAGE_ITEM_DESCRIPTION_MAX,
} from './quotationStageItems';

const item = (overrides: Partial<RequestItemRow>): RequestItemRow =>
  ({
    uuid: 'i-1',
    product: null,
    description: 'Parafuso',
    quantity: 3,
    ...overrides,
  }) as RequestItemRow;

describe('buildStageItemRows', () => {
  it('converte o produto em Option e preserva uuid, quantidade e descrição', () => {
    const rows = buildStageItemRows([
      item({ product: { uuid: 'p-1', description: 'Parafuso M8' } }),
      item({ uuid: 'i-2', description: null, quantity: null }),
    ]);

    expect(rows[0]).toEqual({
      uuid: 'i-1',
      product: { value: 'p-1', label: 'Parafuso M8' },
      quantity: 3,
      description: 'Parafuso',
    });
    expect(rows[1]).toEqual({ uuid: 'i-2', product: null, quantity: null, description: '' });
  });

  it('lista ausente vira lista vazia', () => {
    expect(buildStageItemRows(undefined)).toEqual([]);
  });
});

describe('buildStageItemsPayload', () => {
  it('envia uuid, product_uuid, quantidade numérica e descrição aparada', () => {
    const payload = buildStageItemsPayload({
      items: [
        {
          uuid: 'i-1',
          product: { value: 'p-1', label: 'Parafuso M8' },
          quantity: 2.5,
          description: '  Parafuso  ',
        },
        { uuid: null, product: null, quantity: 1, description: '' },
      ],
    });

    expect(payload.items[0]).toEqual({
      uuid: 'i-1',
      product_uuid: 'p-1',
      quantity: 2.5,
      description: 'Parafuso',
    });
    expect(payload.items[1]).toEqual({
      uuid: null,
      product_uuid: null,
      quantity: 1,
      description: null,
    });
  });

  it('a descrição do legado tem no máximo 60 caracteres', () => {
    expect(STAGE_ITEM_DESCRIPTION_MAX).toBe(60);
  });
});
