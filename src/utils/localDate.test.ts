import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { localTimeZone, todayLocalDate, todayLocalIso } from './localDate';

// 2026-09-29 22:00 em America/Sao_Paulo (UTC-3) == 2026-09-30T01:00:00Z.
// `toISOString().slice(0, 10)` devolveria '2026-09-30' (defeito ERR-078-C).
describe('localDate — "hoje" no fuso local', () => {
  const originalTz = process.env.TZ;

  beforeEach(() => {
    process.env.TZ = 'America/Sao_Paulo';
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-09-29T22:00:00-03:00'));
  });

  afterEach(() => {
    vi.useRealTimers();
    if (originalTz === undefined) delete process.env.TZ;
    else process.env.TZ = originalTz;
  });

  it('usa o fuso do runtime (America/Sao_Paulo)', () => {
    expect(localTimeZone()).toBe('America/Sao_Paulo');
  });

  it('às 22:00 locais (UTC-3), o instante já é o dia seguinte em UTC', () => {
    expect(new Date().toISOString().slice(0, 10)).toBe('2026-09-30');
  });

  it('todayLocalIso devolve o dia local, não o dia UTC', () => {
    expect(todayLocalIso()).toBe('2026-09-29');
  });

  it('todayLocalDate devolve meia-noite local do dia local', () => {
    const d = todayLocalDate();
    expect([d.getFullYear(), d.getMonth() + 1, d.getDate()]).toEqual([2026, 9, 29]);
    expect([d.getHours(), d.getMinutes()]).toEqual([0, 0]);
  });

  it('às 10:00 locais continua no mesmo dia (sem regressão diurna)', () => {
    vi.setSystemTime(new Date('2026-09-29T10:00:00-03:00'));
    expect(todayLocalIso()).toBe('2026-09-29');
  });
});
