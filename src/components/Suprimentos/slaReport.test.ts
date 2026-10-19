// Execução 081, T-081-FE-01 — Relatório SLA: gate, URL e nova aba.
import { afterEach, describe, expect, it, vi } from 'vitest';

import { buildSlaReportUrl, canSlaReport, openSlaReport, SLA_REPORT_PERMISSION } from './slaReport';

describe('slaReport', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('gate é status-sla_report_view', () => {
    expect(SLA_REPORT_PERMISSION).toBe('status-sla_report_view');
    expect(canSlaReport((p) => p === 'status-sla_report_view')).toBe(true);
    expect(canSlaReport(() => false)).toBe(false);
  });

  it('URL /relatorios/suprimentos?uuid=', () => {
    expect(buildSlaReportUrl('abc-123')).toBe('/relatorios/suprimentos?uuid=abc-123');
  });

  it('abre em nova aba, sem vazar opener', () => {
    const open = vi.fn();
    vi.stubGlobal('window', { open });
    openSlaReport('abc-123');
    expect(open).toHaveBeenCalledWith(
      '/relatorios/suprimentos?uuid=abc-123',
      '_blank',
      'noopener,noreferrer'
    );
  });
});
