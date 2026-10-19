// T-078-FE-06 — hidratação de edição: label != uuid, Un. Medida com lista.

import { describe, expect, it } from 'vitest';

import type { InputEntryItemDetail } from '@/@types/v2/InputEntries';

import {
  buildItemUuidPayload,
  buildMeasurementOptions,
  costCenterOption,
  extractItemUuidErrors,
  cultivationOption,
  isLotLocked,
  measurementOption,
  NO_LABEL_PLACEHOLDER,
  refOption,
} from './entradaInsumosHydration';

const UUID_RE = /[0-9a-f]{8}-[0-9a-f]{4}-/;
const U1 = '01a0eff8-7927-7157-831a-000000000001';
const U2 = '01a0eff8-7927-7157-831a-000000000002';
const U3 = '01a0eff8-7927-7157-831a-000000000003';

const item: InputEntryItemDetail = {
  uuid: 'i1',
  product: {
    uuid: 'p1',
    description: 'PRODUTO',
    has_lot: false,
    measurement: { uuid: U1, description: 'KG' },
    measurement_second: { uuid: U2, description: 'SC' },
  },
  measurement: { uuid: U1, description: 'KG' },
  quantity: 1,
  unit_value: 1,
  total_value: 1,
  generate_stock: true,
  appropriation_type: null,
  provider_lot: null,
  lot: null,
  shelf_life: null,
  cultivation: { uuid: U3, name: 'Soja' },
  center: { uuid: U3, code: '01.02', description: 'Lavoura' },
};

describe('entradaInsumosHydration — labels nunca são uuid', () => {
  it('Safra/Un. Medida/Classificação/CC usam o nome da API', () => {
    expect(refOption(U1, 'Safra 2026/2027').label).toBe('Safra 2026/2027');
    expect(measurementOption(item.measurement)).toEqual({ label: 'KG', value: U1 });
    expect(cultivationOption(item.cultivation!)).toEqual({ label: 'Soja', value: U3 });
    expect(costCenterOption(item.center!)).toEqual({ label: '01.02 — Lavoura', value: U3 });
  });

  it('CC sintético salvo continua exibido com o label (DD-06)', () => {
    const synthetic = { uuid: U2, code: '01', description: 'Custos Diretos' };
    expect(costCenterOption(synthetic).label).toBe('01 — Custos Diretos');
  });

  it('sem nome no ref, o label cai no placeholder e nunca no uuid', () => {
    const labels = [
      refOption(U1, undefined).label,
      refOption(U1, '  ').label,
      costCenterOption({ uuid: U1 } as never).label,
      cultivationOption({ uuid: U1 } as never).label,
      measurementOption({ uuid: U1 } as never)!.label,
    ];
    labels.forEach((label) => {
      expect(label).toBe(NO_LABEL_PLACEHOLDER);
      expect(label).not.toMatch(UUID_RE);
    });
  });

  it('measurementOption devolve null sem ref', () => {
    expect(measurementOption(null)).toBeNull();
    expect(measurementOption(undefined)).toBeNull();
  });
});

describe('buildMeasurementOptions — Un. Medida na edição', () => {
  const kg = { label: 'KG', value: U1 };
  const sc = { label: 'SC', value: U2 };

  it('produto com 2 unidades lista as duas (select habilitável) sem duplicar a salva', () => {
    expect(buildMeasurementOptions([kg, sc], kg)).toEqual([kg, sc]);
  });

  it('produto com 1 unidade e nenhum valor: 1 opção', () => {
    expect(buildMeasurementOptions([kg, null], null)).toEqual([kg]);
  });

  it('inclui a unidade salva mesmo que não pertença mais ao produto', () => {
    const saved = { label: 'TON', value: U3 };
    expect(buildMeasurementOptions([kg, null], saved)).toEqual([kg, saved]);
  });

  it('sem produto (nulo) e com valor salvo, a lista tem o valor salvo', () => {
    expect(buildMeasurementOptions([undefined, undefined], kg)).toEqual([kg]);
  });
});

describe('DD-078-07 (b) — uuid do item no payload e lote travado', () => {
  it('update: item existente envia uuid; item novo não envia', () => {
    expect(buildItemUuidPayload('item-1', true)).toEqual({ uuid: 'item-1' });
    expect(buildItemUuidPayload(undefined, true)).toEqual({});
    expect(buildItemUuidPayload(null, true)).toEqual({});
  });

  it('create nunca envia uuid de item', () => {
    expect(buildItemUuidPayload('item-1', false)).toEqual({});
  });

  it('lote travado só para item com uuid', () => {
    expect(isLotLocked('item-1')).toBe(true);
    expect(isLotLocked(undefined)).toBe(false);
    expect(isLotLocked(null)).toBe(false);
  });
});

describe('extractItemUuidErrors — 422 items.N.uuid na linha do item', () => {
  it('mapeia apenas chaves items.N.uuid, com a 1ª mensagem', () => {
    expect(
      extractItemUuidErrors({
        'items.1.uuid': ['Não é permitido trocar o produto.', 'outra'],
        'items.0.quantity': ['inválida'],
        date: ['x'],
      })
    ).toEqual([{ index: 1, message: 'Não é permitido trocar o produto.' }]);
  });

  it('sem errors devolve lista vazia', () => {
    expect(extractItemUuidErrors(undefined)).toEqual([]);
  });
});
