// UT-000752 (T-752-FE-01) — CV-01: prazo de manifestação de 90 dias com
// `diffInDays` (24h truncadas) e "encerrado" só com decorridos > 90.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { getDfeManifestDeadline } from './dfeManifestDeadline';

describe('getDfeManifestDeadline (CV-01)', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('emissão 2026-01-01, hoje 2026-01-31 → 60 restantes (warning)', () => {
    vi.setSystemTime(new Date('2026-01-31T12:00:00'));
    expect(getDfeManifestDeadline('2026-01-01T12:00:00', 0)).toEqual({
      status: 'warning',
      daysRemaining: 60,
    });
  });

  it('90 dias decorridos → ainda warning com 0 restante', () => {
    vi.setSystemTime(new Date('2026-04-01T12:00:00')); // 2026-01-01 + 90 dias
    expect(getDfeManifestDeadline('2026-01-01T12:00:00', 0)).toEqual({
      status: 'warning',
      daysRemaining: 0,
    });
  });

  it('91 dias decorridos → expired', () => {
    vi.setSystemTime(new Date('2026-04-02T12:00:00'));
    expect(getDfeManifestDeadline('2026-01-01T12:00:00', 0).status).toBe('expired');
  });

  it('conta janelas de 24h truncadas, não dias de calendário', () => {
    // 23h depois da emissão (virou o dia de calendário) = 0 dias decorridos.
    vi.setSystemTime(new Date('2026-01-02T10:00:00'));
    expect(getDfeManifestDeadline('2026-01-01T11:00:00', 0)).toEqual({
      status: 'warning',
      daysRemaining: 90,
    });
  });

  it('tipo_evento diferente de 0 → manifested', () => {
    vi.setSystemTime(new Date('2027-01-01T12:00:00'));
    expect(getDfeManifestDeadline('2026-01-01T12:00:00', 2)).toEqual({
      status: 'manifested',
      daysRemaining: null,
    });
  });

  it('data inválida → unknown', () => {
    expect(getDfeManifestDeadline('', 0).status).toBe('unknown');
    expect(getDfeManifestDeadline('nao-e-data', 0).status).toBe('unknown');
  });
});
