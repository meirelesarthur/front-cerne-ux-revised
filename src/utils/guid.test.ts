// src/utils/guid.test.ts
import { afterEach, describe, expect, it } from 'vitest';

import { generateClientId, isValidGuid } from './guid';

// `globalThis.crypto` é somente-leitura em runtime real, mas configurável no
// jsdom/node de teste — redefinimos via `Object.defineProperty` e restauramos
// o descritor original depois de cada caso (mesma técnica de
// `useGridSettings.test.ts` para `createGridPresetId`).
const originalCrypto = globalThis.crypto;

function setGlobalCrypto(value: unknown) {
  Object.defineProperty(globalThis, 'crypto', { value, configurable: true });
}

afterEach(() => {
  Object.defineProperty(globalThis, 'crypto', { value: originalCrypto, configurable: true });
});

describe('generateClientId', () => {
  it('usa crypto.randomUUID quando disponível (contexto seguro)', () => {
    const fixedUuid = '11111111-1111-4111-8111-111111111111';
    setGlobalCrypto({ randomUUID: () => fixedUuid });

    expect(generateClientId()).toBe(fixedUuid);
  });

  it('cai no fallback uuid v4 quando crypto.randomUUID é ausente (homolog HTTP/contexto inseguro)', () => {
    setGlobalCrypto(undefined);

    const id = generateClientId();

    expect(typeof id).toBe('string');
    expect(isValidGuid(id)).toBe(true);
  });

  it('cai no fallback uuid v4 quando crypto existe mas randomUUID não é função', () => {
    setGlobalCrypto({});

    const id = generateClientId();

    expect(isValidGuid(id)).toBe(true);
  });
});

describe('isValidGuid', () => {
  it('aceita UUID v4 (gerado por randomUUID)', () => {
    expect(isValidGuid('11111111-1111-4111-8111-111111111111')).toBe(true);
  });

  it('rejeita valores vazios/indefinidos', () => {
    expect(isValidGuid(undefined)).toBe(false);
    expect(isValidGuid(null)).toBe(false);
    expect(isValidGuid('')).toBe(false);
  });

  it('rejeita string que não é UUID', () => {
    expect(isValidGuid('nao-e-um-uuid')).toBe(false);
  });
});
