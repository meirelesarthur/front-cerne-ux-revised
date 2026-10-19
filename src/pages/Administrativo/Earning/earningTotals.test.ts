// src/pages/Administrativo/Earning/earningTotals.test.ts
// -----------------------------------------------------------------------------
// UT-000756 — prova de que `buildDefaultEarningFilter()` RECALCULA mês/ano a
// cada chamada (mirror legado, `EarningController.php:35-39`: sem
// persistência, sempre `today()->subMonth()`). A regressão corrigida nesta
// UT era justamente o oposto: `index.tsx` calculava o período UMA VEZ no
// load do módulo (`DEFAULT_EARNING_PERIOD = previousMonthPeriod()` no top
// level), então uma visita em outro mês continuava vendo o período
// "congelado" da primeira carga da aba/bundle.
// -----------------------------------------------------------------------------
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { buildDefaultEarningFilter, previousMonthPeriod } from './earningTotals';

describe('buildDefaultEarningFilter — UT-000756', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('retorna mês anterior + ano + Folha Normal, sem funcionário/função (mirror legado)', () => {
    vi.setSystemTime(new Date(2026, 2, 15)); // 15/mar/2026 → anterior = fev/2026

    const filter = buildDefaultEarningFilter();

    expect(filter.employee_uuid).toBeNull();
    expect(filter.function_uuid).toBeNull();
    expect(filter.month).toEqual({ label: '02', value: 2 });
    expect(filter.year).toBe('2026');
    expect(filter.type).toEqual({ label: 'Folha Normal', value: 'N' });
  });

  it('vira o ano corretamente em janeiro (mirror Carbon subMonth)', () => {
    vi.setSystemTime(new Date(2026, 0, 10)); // 10/jan/2026 → anterior = dez/2025

    const filter = buildDefaultEarningFilter();

    expect(filter.month).toEqual({ label: '12', value: 12 });
    expect(filter.year).toBe('2025');
  });

  it('RECALCULA a cada chamada — não fica congelado numa referência do momento do import', () => {
    vi.setSystemTime(new Date(2026, 2, 15)); // anterior = fev/2026
    const first = buildDefaultEarningFilter();
    expect(first.month?.value).toBe(2);
    expect(first.year).toBe('2026');

    // Simula a passagem de tempo entre duas VISITAS à tela (sem reload de
    // módulo) — o valor DEVE mudar, provando que não há memoização indevida
    // no module scope (a regressão original: `const DEFAULT_EARNING_PERIOD =
    // previousMonthPeriod()` calculado uma única vez no load do arquivo).
    vi.setSystemTime(new Date(2026, 5, 20)); // anterior = mai/2026
    const second = buildDefaultEarningFilter();
    expect(second.month?.value).toBe(5);
    expect(second.year).toBe('2026');

    expect(second).not.toEqual(first);
  });

  it('usa exatamente o mesmo período de previousMonthPeriod (sem duplicar a regra)', () => {
    vi.setSystemTime(new Date(2026, 7, 1));
    const period = previousMonthPeriod();
    const filter = buildDefaultEarningFilter();

    expect(filter.month?.value).toBe(period.month);
    expect(filter.year).toBe(String(period.year));
  });
});
