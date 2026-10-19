// Execução 086, FE-02 — horário `HH:MM:SS` do GET → `HH:MM` do form/PUT.
import { describe, expect, it } from 'vitest';

import { normalizeTimeToHm } from './service-order-time';

describe('normalizeTimeToHm', () => {
  it('aceita HH:MM:SS, HH:MM e H:MM', () => {
    expect(normalizeTimeToHm('06:00:00')).toBe('06:00');
    expect(normalizeTimeToHm('07:30:00')).toBe('07:30');
    expect(normalizeTimeToHm('18:45')).toBe('18:45');
    expect(normalizeTimeToHm('6:05:00')).toBe('06:05');
  });

  it('null, vazio e inválido viram null (sem inventar horário)', () => {
    expect(normalizeTimeToHm(null)).toBeNull();
    expect(normalizeTimeToHm(undefined)).toBeNull();
    expect(normalizeTimeToHm('')).toBeNull();
    expect(normalizeTimeToHm('  ')).toBeNull();
    expect(normalizeTimeToHm('abc')).toBeNull();
  });
});
