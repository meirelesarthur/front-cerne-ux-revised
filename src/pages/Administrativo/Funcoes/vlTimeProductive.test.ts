import { describe, expect, it } from 'vitest';

import { formatVlTimeProductive } from './vlTimeProductive';

describe('formatVlTimeProductive', () => {
  it('divide salario pela carga com 2 casas em pt-BR', () => {
    expect(formatVlTimeProductive(3000, 220)).toBe('13,64');
  });

  it('recalcula ao mudar apenas a carga mantendo o salario carregado', () => {
    expect(formatVlTimeProductive(3000, 220)).toBe('13,64');
    expect(formatVlTimeProductive(3000, 200)).toBe('15,00');
  });

  it('aceita valores numericos em string', () => {
    expect(formatVlTimeProductive('3000.00', '220')).toBe('13,64');
  });

  it.each([
    [0, 220],
    [-10, 220],
    [3000, 0],
    [3000, null],
    [3000, undefined],
    [3000, ''],
    [Number.NaN, 220],
  ])('exibe 0,00 para salario=%s carga=%s', (salary, hours) => {
    expect(formatVlTimeProductive(salary, hours as number)).toBe('0,00');
  });
});
