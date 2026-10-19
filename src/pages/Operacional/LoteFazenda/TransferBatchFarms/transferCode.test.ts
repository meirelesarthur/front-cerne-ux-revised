import { describe, expect, it } from 'vitest';

import { computeNextTransferCode } from './transferCode';

describe('computeNextTransferCode', () => {
  it('retorna 0001 quando vazio/nulo', () => {
    expect(computeNextTransferCode('')).toBe('0001');
    expect(computeNextTransferCode(null)).toBe('0001');
    expect(computeNextTransferCode(undefined)).toBe('0001');
  });

  it('incrementa preservando zeros à esquerda', () => {
    expect(computeNextTransferCode('0007')).toBe('0008');
    expect(computeNextTransferCode('0099')).toBe('0100');
  });

  it('retorna 0001 para uniqid hexadecimal (nunca NaN)', () => {
    expect(computeNextTransferCode('6ac7a6d041c2d')).toBe('0001');
  });

  it('cresce além do tamanho original em 9999', () => {
    expect(computeNextTransferCode('9999')).toBe('10000');
  });
});
