// Execução 086, FE-01 — visibilidade do "Cancelar OS": permissão × status.
import { describe, expect, it } from 'vitest';

import { canCancelServiceOrder } from './serviceOrderStatus';

describe('canCancelServiceOrder', () => {
  it.each([
    [1, true],
    [2, true],
    [3, false],
    [4, false],
    [9, false],
  ])('com permissão e status %i → %s', (status, expected) => {
    expect(canCancelServiceOrder(true, status)).toBe(expected);
  });

  it.each([1, 2, 3, 4, 9])('sem permissão e status %i → nunca exibe', (status) => {
    expect(canCancelServiceOrder(false, status)).toBe(false);
  });

  it('status ausente nunca exibe', () => {
    expect(canCancelServiceOrder(true, undefined)).toBe(false);
    expect(canCancelServiceOrder(true, null)).toBe(false);
  });
});
