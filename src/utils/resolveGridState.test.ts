import { describe, expect, it } from 'vitest';

import { resolveGridState } from './resolveGridState';

describe('resolveGridState', () => {
  it('erro sem loading e sem vazio → error', () => {
    expect(resolveGridState({ isLoading: false, isError: true, isEmpty: false })).toBe('error');
  });

  it('erro coincidindo com isEmpty=true (query falhou, items undefined) → error sempre vence', () => {
    expect(resolveGridState({ isLoading: false, isError: true, isEmpty: true })).toBe('error');
  });

  it('sem erro, sem loading, vazio → empty', () => {
    expect(resolveGridState({ isLoading: false, isError: false, isEmpty: true })).toBe('empty');
  });

  it('loading ainda ativo com isEmpty=true (1ª carga) → data (guarda contra flash de EmptyState)', () => {
    expect(resolveGridState({ isLoading: true, isError: false, isEmpty: true })).toBe('data');
  });

  it('sem erro, sem loading, com dados → data', () => {
    expect(resolveGridState({ isLoading: false, isError: false, isEmpty: false })).toBe('data');
  });
});
