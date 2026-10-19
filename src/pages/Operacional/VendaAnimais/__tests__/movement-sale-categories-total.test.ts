import { describe, expect, it } from 'vitest';

import { computeItemValueUnit, resolveCategoryValueTotal } from '../MovementSaleCategoriesTab';

const base = {
  pricingType: 1 as const,
  valueReal: 0,
  valueArroba: 0,
  valueHead: 0,
  weights: [] as number[],
  factor: 15,
  priceTimesWeight: true,
  lastEdited: 'real' as const,
  touched: true,
  hydratedTotal: 0,
};

describe('computeItemValueUnit', () => {
  it('mantém a fórmula atual com a flag desligada', () => {
    expect(computeItemValueUnit(1, 20, 0, 250, 30)).toBeCloseTo(20 * (250 / 30), 10);
  });

  it('multiplica preço por peso com a flag ligada', () => {
    expect(computeItemValueUnit(1, 20, 0, 250, 15, true)).toBe(5000);
  });
});

describe('resolveCategoryValueTotal', () => {
  it('flag desligada reproduz o comportamento de Criar/Editar', () => {
    const total = resolveCategoryValueTotal({
      ...base,
      priceTimesWeight: false,
      factor: 30,
      valueReal: 20,
      weights: [250],
    });
    expect(total).toBe(166.67);
  });

  it('250 + 270 kg a R$ 20/kg resulta em R$ 10.400,00', () => {
    expect(resolveCategoryValueTotal({ ...base, valueReal: 20, weights: [250, 270] })).toBe(10400);
  });

  it('preço editado em @ parte do valor em @', () => {
    expect(
      resolveCategoryValueTotal({
        ...base,
        valueReal: 6.67,
        valueArroba: 100,
        lastEdited: 'arroba',
        weights: [520],
      })
    ).toBe(3466.67);
  });

  it('mantém o total hidratado sem peso e sem edição', () => {
    const input = { ...base, touched: false, hydratedTotal: 8000, valueReal: 20 };
    expect(resolveCategoryValueTotal({ ...input, weights: [0] })).toBe(8000);
    expect(resolveCategoryValueTotal({ ...input, weights: [250, 270], touched: true })).toBe(10400);
  });

  it('Cabeça soma value_head por item sem guarda', () => {
    expect(
      resolveCategoryValueTotal({
        ...base,
        pricingType: 2,
        touched: false,
        valueHead: 1500,
        hydratedTotal: 8000,
        weights: [0, 0],
      })
    ).toBe(3000);
  });
});
