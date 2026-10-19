import { describe, expect, it } from 'vitest';

import { BRAZIL_COUNTRY_CODE, isBrazilCountry } from '@/constants/countries';

describe('TASK-072-FE-01 — isBrazilCountry', () => {
  it('BRAZIL_COUNTRY_CODE é o código IBGE 1058', () => {
    expect(BRAZIL_COUNTRY_CODE).toBe(1058);
  });

  it('codigo numérico 1058 → true', () => {
    expect(isBrazilCountry({ codigo: 1058 })).toBe(true);
  });

  it("codigo string '1058' → true (comparação tolerante)", () => {
    expect(isBrazilCountry({ codigo: '1058' })).toBe(true);
  });

  it('codigo 30 (id do Brasil, não o codigo) → false', () => {
    expect(isBrazilCountry({ codigo: 30 })).toBe(false);
  });

  it('null/undefined/sem codigo → false', () => {
    expect(isBrazilCountry(null)).toBe(false);
    expect(isBrazilCountry(undefined)).toBe(false);
    expect(isBrazilCountry({})).toBe(false);
    expect(isBrazilCountry({ codigo: null })).toBe(false);
    expect(isBrazilCountry({ codigo: '' })).toBe(false);
  });
});
