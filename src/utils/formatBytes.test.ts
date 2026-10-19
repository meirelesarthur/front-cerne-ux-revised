import { describe, expect, it } from 'vitest';

import { formatBytes } from './formatBytes';

describe('formatBytes', () => {
  it('formata as fronteiras de byte', () => {
    expect(formatBytes(0)).toBe('0 B');
    expect(formatBytes(1023)).toBe('1023 B');
    expect(formatBytes(1024)).toBe('1 KB');
  });

  it('usa o separador decimal do idioma', () => {
    expect(formatBytes(1.5 * 1024 * 1024, 'pt-BR')).toBe('1,5 MB');
    expect(formatBytes(1.5 * 1024 * 1024, 'en-US')).toBe('1.5 MB');
  });

  it('chega a GB e TB', () => {
    expect(formatBytes(3 * 1024 ** 3, 'en-US')).toBe('3 GB');
    expect(formatBytes(2 * 1024 ** 4, 'en-US')).toBe('2 TB');
  });

  it('devolve travessão para valor ausente ou inválido', () => {
    expect(formatBytes(null)).toBe('—');
    expect(formatBytes(undefined)).toBe('—');
    expect(formatBytes(-1)).toBe('—');
    expect(formatBytes(Number.NaN)).toBe('—');
  });
});
