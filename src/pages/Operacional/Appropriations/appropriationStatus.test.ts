import { describe, expect, it } from 'vitest';

import { isAppropriationEditable } from './appropriationStatus';

describe('isAppropriationEditable', () => {
  it('permite editar somente Aberto (O)', () => {
    expect(isAppropriationEditable('O')).toBe(true);
  });

  it('bloqueia Finalizado (F) e Apropriado (A)', () => {
    expect(isAppropriationEditable('F')).toBe(false);
    expect(isAppropriationEditable('A')).toBe(false);
  });

  it('bloqueia status ausente', () => {
    expect(isAppropriationEditable(null)).toBe(false);
    expect(isAppropriationEditable(undefined)).toBe(false);
  });
});
