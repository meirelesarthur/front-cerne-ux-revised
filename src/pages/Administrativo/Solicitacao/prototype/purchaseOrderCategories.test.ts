import { describe, expect, it } from 'vitest';

import { categoryOfType, PURCHASE_ORDER_CATEGORIES } from './purchaseOrderCategories';

describe('categorias da ordem de compra', () => {
  it('cobre os 11 tipos atuais, cada um em uma categoria só', () => {
    const types = PURCHASE_ORDER_CATEGORIES.flatMap((c) => c.types);
    expect(types).toHaveLength(11);
    expect(new Set(types).size).toBe(11);
  });

  it('agrupa os tipos na categoria proposta', () => {
    expect(categoryOfType('P')).toBe('insumos');
    expect(categoryOfType('U')).toBe('insumos');
    expect(categoryOfType('M')).toBe('manutencao');
    expect(categoryOfType('C')).toBe('servicos');
    expect(categoryOfType('R')).toBe('adiantamento');
    expect(categoryOfType('B')).toBe('despesasFixas');
    expect(categoryOfType('E')).toBe('frete');
  });

  it('tipo vazio ou desconhecido não tem categoria', () => {
    expect(categoryOfType(null)).toBeNull();
    expect(categoryOfType('Z')).toBeNull();
  });
});
