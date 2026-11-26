import { describe, expect, it } from 'vitest';

import { approvalWindowStart, canAutoApprove } from './autoApprovalWindow';

// 26/11/2026 é uma quinta-feira.
const TODAY = '2026-11-26';

describe('aprovação automática por valor, prazo e contagem', () => {
  it('dias corridos contam para trás a partir de hoje (incluindo hoje)', () => {
    expect(approvalWindowStart(TODAY, 'diario', 'corridos')).toBe('2026-11-26');
    expect(approvalWindowStart(TODAY, 'semanal', 'corridos')).toBe('2026-11-20');
    expect(approvalWindowStart(TODAY, 'mensal', 'corridos')).toBe('2026-10-28');
    expect(approvalWindowStart(TODAY, 'anual', 'corridos')).toBe('2025-11-27');
  });

  it('período fechado corta no início do período', () => {
    expect(approvalWindowStart(TODAY, 'diario', 'fechado')).toBe('2026-11-26');
    expect(approvalWindowStart(TODAY, 'semanal', 'fechado')).toBe('2026-11-23');
    expect(approvalWindowStart(TODAY, 'mensal', 'fechado')).toBe('2026-11-01');
    expect(approvalWindowStart(TODAY, 'anual', 'fechado')).toBe('2026-01-01');
  });

  it('semana fechada começa na segunda, inclusive quando hoje é domingo', () => {
    expect(approvalWindowStart('2026-11-29', 'semanal', 'fechado')).toBe('2026-11-23');
    expect(approvalWindowStart('2026-11-23', 'semanal', 'fechado')).toBe('2026-11-23');
  });

  it('segue sem aprovador enquanto a soma no prazo não passa do valor', () => {
    const rule = { value: 10000, period: 'mensal' as const, counting: 'fechado' as const };
    expect(canAutoApprove(2000, 8000, rule)).toBe(true);
    expect(canAutoApprove(2001, 8000, rule)).toBe(false);
    expect(canAutoApprove(100, 0, { ...rule, value: null })).toBe(false);
  });
});
