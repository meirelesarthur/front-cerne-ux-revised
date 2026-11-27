import { describe, expect, it } from 'vitest';

import {
  allItemsPriced,
  countPricedItems,
  formatCurrency,
  canSubmitQuotation,
  countUnavailableItems,
  isItemAnswered,
  isItemPriced,
  isItemUnavailable,
  isPartialOffer,
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

  it('com quantidade ofertada, ela também precisa ser maior que zero', () => {
    expect(isItemPriced({ unitary_value: 10, quantity: 45 })).toBe(true);
    expect(isItemPriced({ unitary_value: 10, quantity: 0 })).toBe(false);
    expect(isItemPriced({ unitary_value: 10, quantity: null })).toBe(true);
    expect(allItemsPriced([{ unitary_value: 1, quantity: 5 }, { unitary_value: 2, quantity: 0 }])).toBe(false);
  });

  it('oferta parcial: ofertou menos que o pedido', () => {
    expect(isPartialOffer(30, 45)).toBe(true);
    expect(isPartialOffer(45, 45)).toBe(false);
    expect(isPartialOffer(0, 45)).toBe(false);
    expect(isPartialOffer(null, 45)).toBe(false);
  });

  it('formata em reais', () => {
    expect(formatCurrency(1234.5).replace(/\s/g, ' ')).toBe('R$ 1.234,50');
    expect(formatCurrency(Number.NaN).replace(/\s/g, ' ')).toBe('R$ 0,00');
  });
});

describe('sem estoque', () => {
  const priced = { unitary_value: 5, available: true };
  const none = { unitary_value: null, available: false };
  const blank = { unitary_value: null, available: true };

  it('item sem estoque conta como respondido, mas não como cotado', () => {
    expect(isItemPriced(none)).toBe(false);
    expect(isItemUnavailable(none)).toBe(true);
    expect(isItemAnswered(none)).toBe(true);
    expect(isItemAnswered(blank)).toBe(false);
    expect(countUnavailableItems([priced, none, blank])).toBe(1);
  });

  it('só envia com todos os itens respondidos e ao menos um cotado', () => {
    expect(canSubmitQuotation([priced, none])).toBe(true);
    expect(canSubmitQuotation([priced, blank])).toBe(false);
    expect(canSubmitQuotation([none, none])).toBe(false);
    expect(canSubmitQuotation([])).toBe(false);
  });
});
