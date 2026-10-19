// Execução 081, T-081-FE-01 — linha do tipo U devolve o token de destaque.
import { describe, expect, it } from 'vitest';

import { emergencyRowHighlight, SUPPLY_EMERGENCY_ROW_TOKEN } from './emergencyRow';

describe('emergencyRowHighlight', () => {
  it('tipo U devolve o token supplyEmergencyRowBg (nunca hex)', () => {
    expect(emergencyRowHighlight({ type: 'U' })).toBe('supplyEmergencyRowBg');
    expect(SUPPLY_EMERGENCY_ROW_TOKEN.startsWith('#')).toBe(false);
  });
  it.each(['P', 'S', 'A', 'R', 'D', 'C', 'F', 'E', 'M', 'B'])('tipo %s não destaca', (type) => {
    expect(emergencyRowHighlight({ type })).toBeUndefined();
  });
  it('tipo ausente não destaca', () => {
    expect(emergencyRowHighlight({})).toBeUndefined();
    expect(emergencyRowHighlight({ type: null })).toBeUndefined();
  });
});
