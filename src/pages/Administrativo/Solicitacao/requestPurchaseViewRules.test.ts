import { describe, expect, it } from 'vitest';

import { classificationLabel, showReceiptSection } from './requestPurchaseViewRules';

const labels = { N: 'Não Classificado', C: 'CAPEX', O: 'OPEX' };

describe('requestPurchaseViewRules (execução 081, FE-05)', () => {
  it('classificação ausente ou N mostra "Não Classificado"', () => {
    expect(classificationLabel(null, labels)).toBe('Não Classificado');
    expect(classificationLabel(undefined, labels)).toBe('Não Classificado');
    expect(classificationLabel('N', labels)).toBe('Não Classificado');
  });

  it('classificação C e O mostram CAPEX e OPEX', () => {
    expect(classificationLabel('C', labels)).toBe('CAPEX');
    expect(classificationLabel('O', labels)).toBe('OPEX');
  });

  it('Recebimento só no status 8', () => {
    expect(showReceiptSection(8)).toBe(true);
    expect(showReceiptSection(7)).toBe(false);
    expect(showReceiptSection(9)).toBe(false);
    expect(showReceiptSection(undefined)).toBe(false);
  });
});
