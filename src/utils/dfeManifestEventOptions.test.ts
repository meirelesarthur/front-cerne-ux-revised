// UT-000752 — CV-02/CV-03: janelas de manifestação (Ciência até emissão+10,
// demais eventos até +180, fim do dia) e modo `lote` nunca desabilita.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { isDfeManifestEventDisabled } from './dfeManifestEventOptions';

describe('isDfeManifestEventDisabled', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('CV-02: Ciência habilitada até emissão+10 23:59:59 e desabilitada 1 s depois', () => {
    vi.setSystemTime(new Date('2026-01-11T23:59:59'));
    expect(isDfeManifestEventDisabled(1, '2026-01-01T08:00:00', 'individual')).toBe(false);

    vi.setSystemTime(new Date('2026-01-12T00:00:00'));
    expect(isDfeManifestEventDisabled(1, '2026-01-01T08:00:00', 'individual')).toBe(true);
  });

  it('CV-03: eventos 2/3/4 até emissão+180', () => {
    vi.setSystemTime(new Date('2026-06-30T23:59:59')); // 2026-01-01 + 180 dias
    ([2, 3, 4] as const).forEach((evento) => {
      expect(isDfeManifestEventDisabled(evento, '2026-01-01T08:00:00', 'individual')).toBe(false);
    });

    vi.setSystemTime(new Date('2026-07-01T00:00:00'));
    ([2, 3, 4] as const).forEach((evento) => {
      expect(isDfeManifestEventDisabled(evento, '2026-01-01T08:00:00', 'individual')).toBe(true);
    });
  });

  it('modo lote nunca desabilita (DIV-03)', () => {
    vi.setSystemTime(new Date('2030-01-01T00:00:00'));
    ([1, 2, 3, 4] as const).forEach((evento) => {
      expect(isDfeManifestEventDisabled(evento, '2026-01-01T08:00:00', 'lote')).toBe(false);
    });
  });
});
