import { describe, expect, it } from 'vitest';

import { dedupeOptionsByValue } from './measurementOptions';

describe('dedupeOptionsByValue', () => {
  it('colapsa opções com o mesmo uuid', () => {
    expect(
      dedupeOptionsByValue([
        { value: 'u1', label: 'Pares' },
        { value: 'u1', label: 'Pares' },
      ])
    ).toEqual([{ value: 'u1', label: 'Pares' }]);
  });

  it('mantém unidades distintas mesmo com o mesmo nome', () => {
    expect(
      dedupeOptionsByValue([
        { value: 'u1', label: 'Pares' },
        { value: 'u2', label: 'Pares' },
      ])
    ).toHaveLength(2);
  });
});
