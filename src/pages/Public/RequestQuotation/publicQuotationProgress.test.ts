import { describe, expect, it } from 'vitest';

import {
  allItemsPriced,
  countPricedItems,
  formatCurrency,
  isItemPriced,
} from './publicQuotationProgress';

describe('publicQuotationProgress', () => {
  it('item sem preço, com 0 ou nulo não conta como preenchido', () => {
    expect(isItemPriced({ unitary_value: null })).toBe(false);
    expect(isItemPriced({ unitary_value: 0 })).toBe(false);
    expect(isItemPriced(undefined)).toBe(false);
    expect(isItemPriced({ unitary_value: 17.5 })).toBe(true);
  });

  it('conta só os itens com preço', () => {
    const items = [{ unitary_value: 880 }, { unitary_value: null }, { unitary_value: 0 }];
    expect(countPricedItems(items)).toBe(1);
  });

  it('libera o envio só quando todos os itens têm preço', () => {
    expect(allItemsPriced([])).toBe(false);
    expect(allItemsPriced([{ unitary_value: 1 }, { unitary_value: null }])).toBe(false);
    expect(allItemsPriced([{ unitary_value: 1 }, { unitary_value: 2 }])).toBe(true);
  });

  it('formata em reais', () => {
    expect(formatCurrency(1234.5).replace(/\s/g, ' ')).toBe('R$ 1.234,50');
    expect(formatCurrency(Number.NaN).replace(/\s/g, ' ')).toBe('R$ 0,00');
  });
});
