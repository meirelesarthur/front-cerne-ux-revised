// Execução 086, item 3 — exibição de datas das telas de OS (nunca ISO cru).
import { describe, expect, it } from 'vitest';

import { formatServiceOrderDate } from './ServiceOrderDetailBody';

describe('formatServiceOrderDate', () => {
  it('data ISO vira dd/MM/yyyy', () => {
    expect(formatServiceOrderDate('2026-09-28')).toBe('28/09/2026');
  });

  it('data-hora vira dd/MM/yyyy HH:mm', () => {
    expect(formatServiceOrderDate('2026-09-28T14:30:00', 'dd/MM/yyyy HH:mm')).toBe(
      '28/09/2026 14:30'
    );
  });

  it('ausente ou inválida vira travessão', () => {
    expect(formatServiceOrderDate(null)).toBe('—');
    expect(formatServiceOrderDate(undefined)).toBe('—');
    expect(formatServiceOrderDate('')).toBe('—');
  });
});
