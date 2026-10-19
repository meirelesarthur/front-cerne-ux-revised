import { describe, expect, it } from 'vitest';

import formatWeight from './formatWeight';

describe('formatWeight', () => {
  it('formata em pt-BR com milhar e 2 casas', () => {
    expect(formatWeight(45000)).toBe('45.000,00 kg');
    expect(formatWeight('30000.00')).toBe('30.000,00 kg');
  });

  it('usa a unidade informada', () => {
    expect(formatWeight(1.5, '@')).toBe('1,50 @');
  });

  it('devolve traço para ausente ou inválido', () => {
    expect(formatWeight(null)).toBe('-');
    expect(formatWeight(undefined)).toBe('-');
    expect(formatWeight('abc')).toBe('-');
  });
});
