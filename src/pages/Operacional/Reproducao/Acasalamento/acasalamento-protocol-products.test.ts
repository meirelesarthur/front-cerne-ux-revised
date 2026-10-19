import { describe, expect, it } from 'vitest';

import type {
  BreedingProtocolStockItem,
  BreedingSeedStockProduct,
} from '@/@types/v2/BreedingMating';

import {
  buildProtocolProductOptions,
  buildProtocolProductTotals,
  buildSeedProductTotals,
  selectProtocolItemsForIdentification,
  type ProtocolTotalizerRowInput,
} from './acasalamento-protocol-products';

const productP = { uuid: 'product-p', description: 'Produto P', code: 'P' };

function buildItem(overrides: Partial<BreedingProtocolStockItem> = {}): BreedingProtocolStockItem {
  return {
    identification: 'DZERO',
    product: productP,
    product_description: 'Produto P',
    dose: 2,
    warehouse: { uuid: 'warehouse-a', name: 'Armazém A' },
    stock_balance: 10,
    conversion_factor: null,
    factor_type: null,
    measurement: 'UN',
    product_measurement: 'UN',
    dose_in_stock_unit: 2,
    has_valid_stock: true,
    ...overrides,
  };
}

const selectedP = [{ label: 'Produto P', value: 'product-p' }];

function row(index: number, eligible = true): ProtocolTotalizerRowInput {
  return {
    eligible,
    animal: { label: `A${index}`, value: `animal-${index}` },
    products: selectedP,
    semen_or_embryo: null,
  };
}

describe('buildProtocolProductTotals', () => {
  it('soma a dose das linhas aptas com animal e usa o saldo do armazém do item', () => {
    const rows = [row(1), row(2), row(3), row(4, false)];

    const totals = buildProtocolProductTotals(rows, [buildItem()]);

    expect(totals).toHaveLength(1);
    expect(totals[0]).toMatchObject({
      label: 'Produto P',
      measurementLabel: 'UN',
      stock: 10,
      quantity: 6,
      hasStock: true,
      exceedsStock: false,
    });
  });

  it('recalcula ao remover uma linha apta', () => {
    const rows = [row(1), row(2), row(4, false)];

    expect(buildProtocolProductTotals(rows, [buildItem()])[0].quantity).toBe(4);
  });

  it('ignora linha apta sem animal', () => {
    const rows = [row(1), { ...row(2), animal: null }];

    expect(buildProtocolProductTotals(rows, [buildItem()])[0].quantity).toBe(2);
  });

  it('sinaliza Sem Estoque quando o item não tem armazém e excesso quando Quantidade > Estoque', () => {
    const withoutWarehouse = buildProtocolProductTotals(
      [row(1)],
      [buildItem({ warehouse: null, stock_balance: null, has_valid_stock: false })]
    );
    expect(withoutWarehouse[0].hasStock).toBe(false);

    const exceeded = buildProtocolProductTotals(
      [row(1), row(2), row(3)],
      [buildItem({ stock_balance: 5 })]
    );
    expect(exceeded[0]).toMatchObject({ quantity: 6, stock: 5, exceedsStock: true });
  });

  it('converte o saldo para a UM do item pelo mesmo fator da dose', () => {
    const totals = buildProtocolProductTotals(
      [row(1)],
      [buildItem({ dose: 2, dose_in_stock_unit: 1, measurement: 'ML', product_measurement: 'FR' })]
    );
    expect(totals[0]).toMatchObject({ measurementLabel: 'ML', stock: 20, quantity: 2 });
  });
});

describe('opções de produtos do protocolo', () => {
  it('usa somente os itens da identificação corrente, sem duplicar produto', () => {
    const items = [
      buildItem(),
      buildItem({ warehouse: { uuid: 'warehouse-b', name: 'B' } }),
      buildItem({
        identification: 'D8',
        product: { uuid: 'product-q', description: 'Q', code: null },
      }),
    ];

    const options = buildProtocolProductOptions(
      selectProtocolItemsForIdentification(items, 'DZERO')
    );

    expect(options).toEqual([{ label: 'Produto P', value: 'product-p' }]);
  });
});

describe('buildSeedProductTotals', () => {
  it('soma a dose do sêmen das linhas aptas com animal', () => {
    const seed: BreedingSeedStockProduct = {
      uuid: 'seed-1',
      description: 'Sêmen 1',
      measurement_name: 'DS',
      has_valid_stock: true,
      dose: 1,
      warehouse: { uuid: 'warehouse-a', name: 'A' },
      stock_balance: 3,
    };
    const semen = { label: 'Sêmen 1', value: 'seed-1' };
    const rows = [
      { ...row(1), semen_or_embryo: semen },
      { ...row(2), semen_or_embryo: semen },
      { ...row(3, false), semen_or_embryo: semen },
    ];

    expect(buildSeedProductTotals(rows, [seed])[0]).toMatchObject({ stock: 3, quantity: 2 });
  });
});
