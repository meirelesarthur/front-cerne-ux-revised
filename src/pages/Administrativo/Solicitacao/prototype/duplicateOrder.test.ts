import { describe, expect, it } from 'vitest';

import { buildDuplicateState, isDuplicateOrderState } from './duplicateOrder';

const order = {
  uuid: 'o1',
  code: '0012',
  type: 'P',
  type_label: 'Produto',
  status: 7,
  priority: 0,
  priority_label: 'Alta',
  request_date: '2026-11-03',
  justification: 'Plantio',
  description: 'Adubação',
  observation: 'Duas cargas',
  nfe: '123',
  items: [
    { uuid: 'i1', product: { uuid: 'p1', description: 'NPK' }, description: 'NPK (t)', quantity: 40, amount: 138000, delivery_date: '2026-11-20' },
    { uuid: 'i2', product: null, description: 'Ureia (t)', quantity: 12, amount: 46680 },
  ],
  attachments: [{ uuid: 'a1', name: 'nota.pdf', file_url: null }],
  movements: [{ uuid: 'm1' }],
} as never;

describe('buildDuplicateState', () => {
  const state = buildDuplicateState(order, ['i2'], '2026-11-25');

  it('copia os dados gerais e põe a data de hoje', () => {
    expect(state.duplicateOf.code).toBe('0012');
    expect(state.values).toMatchObject({
      type: { value: 'P' },
      request_date: '2026-11-25',
      justification: 'Plantio',
      description: 'Adubação',
      priority: { value: 0 },
      observation: 'Duas cargas',
    });
  });

  it('leva só os itens marcados, como itens novos e sem data de entrega', () => {
    expect(state.values.items).toHaveLength(1);
    expect(state.values.items?.at(0)).toMatchObject({ item_uuid: null, description: 'Ureia (t)', quantity: 12, delivery_date: null });
  });

  it('não copia anexos', () => {
    expect(state.values.attachments).toEqual([]);
  });

  it('reconhece o estado de navegação', () => {
    expect(isDuplicateOrderState(state)).toBe(true);
    expect(isDuplicateOrderState(null)).toBe(false);
    expect(isDuplicateOrderState({ foo: 1 })).toBe(false);
  });
});
