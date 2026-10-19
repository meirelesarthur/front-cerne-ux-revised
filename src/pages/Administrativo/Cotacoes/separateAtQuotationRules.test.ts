// src/pages/Administrativo/Cotacoes/separateAtQuotationRules.test.ts
// Regras do diálogo "Criar Sub Solicitação" na cotação (081, T-081-FE-08, P73).

import { describe, expect, it } from 'vitest';

import type { RequestItemRow } from '@/@types/v2/RequestPurchases';

import { buildSeparateItemLabel, canSubmitSeparation } from './separateAtQuotationRules';

const item = (overrides: Partial<RequestItemRow>): RequestItemRow =>
  ({
    uuid: 'i-1',
    description: 'Parafuso',
    product: null,
    quantity: 4,
    ...overrides,
  }) as RequestItemRow;

describe('canSubmitSeparation', () => {
  it('exige ao menos um item ("Selecione ao menos um item")', () => {
    expect(canSubmitSeparation([])).toBe(false);
    expect(canSubmitSeparation(['i-1'])).toBe(true);
  });
});

describe('buildSeparateItemLabel', () => {
  it('usa a descrição com a quantidade', () => {
    expect(buildSeparateItemLabel(item({}))).toBe('Parafuso (4)');
  });

  it('sem descrição usa o produto, e sem produto o uuid', () => {
    expect(
      buildSeparateItemLabel(
        item({ description: null, product: { uuid: 'p', description: 'Parafuso M8' } })
      )
    ).toBe('Parafuso M8 (4)');
    expect(buildSeparateItemLabel(item({ description: null, quantity: null }))).toBe('i-1');
  });
});
