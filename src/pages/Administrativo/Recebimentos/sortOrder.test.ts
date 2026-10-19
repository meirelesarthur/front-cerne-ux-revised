// Execução 081, T-081-FE-10 — alternância de ordenação das colunas da lista.
import { describe, expect, it } from 'vitest';

import { nextOrderBy } from './sortOrder';

describe('nextOrderBy', () => {
  it('coluna nova começa ascendente', () => {
    expect(nextOrderBy(undefined, 'code')).toEqual({ name: 'code', ascOrDesc: 'asc' });
    expect(nextOrderBy({ name: 'code', ascOrDesc: 'desc' }, 'updated_on')).toEqual({
      name: 'updated_on',
      ascOrDesc: 'asc',
    });
  });

  it('mesma coluna alterna asc e desc', () => {
    expect(nextOrderBy({ name: 'code', ascOrDesc: 'asc' }, 'code')).toEqual({
      name: 'code',
      ascOrDesc: 'desc',
    });
    expect(nextOrderBy({ name: 'code', ascOrDesc: 'desc' }, 'code')).toEqual({
      name: 'code',
      ascOrDesc: 'asc',
    });
  });
});
