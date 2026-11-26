import { describe, expect, it } from 'vitest';

import {
  categoryOfType,
  markOfType,
  PURCHASE_ORDER_CATEGORIES,
  PURCHASE_ORDER_MARKS,
} from './purchaseOrderCategories';

describe('categorias da ordem de compra', () => {
  it('são 4 e cobrem os 11 tipos atuais, cada um em uma categoria só', () => {
    expect(PURCHASE_ORDER_CATEGORIES).toHaveLength(4);
    const types = PURCHASE_ORDER_CATEGORIES.flatMap((c) => c.types);
    expect(types).toHaveLength(11);
    expect(new Set(types).size).toBe(11);
  });

  it('agrupa os tipos na categoria decidida', () => {
    expect(categoryOfType('P')).toBe('produto');
    expect(categoryOfType('S')).toBe('servico');
    expect(categoryOfType('D')).toBe('servico');
    expect(categoryOfType('C')).toBe('servico');
    expect(categoryOfType('E')).toBe('servico');
    expect(categoryOfType('M')).toBe('servico');
    expect(categoryOfType('R')).toBe('reembolsoAdiantamento');
    expect(categoryOfType('A')).toBe('reembolsoAdiantamento');
    expect(categoryOfType('B')).toBe('despesaFixa');
  });

  it('Emergencial e Compra efetuada viram marcação, não categoria própria', () => {
    expect(PURCHASE_ORDER_MARKS).toHaveLength(2);
    expect(markOfType('U')).toBe('urgencia');
    expect(markOfType('F')).toBe('regularizacao');
    expect(categoryOfType('U')).toBe('produto');
    expect(categoryOfType('F')).toBe('produto');
    expect(markOfType('P')).toBeNull();
  });

  it('tipo vazio ou desconhecido não tem categoria nem marcação', () => {
    expect(categoryOfType(null)).toBeNull();
    expect(categoryOfType('Z')).toBeNull();
    expect(markOfType(undefined)).toBeNull();
  });
});
