// UT-000690 / D-092-13 — mapeamento da coluna Status (cor, label i18n, auditoria, null).

import { describe, expect, it } from 'vitest';

import { languageEnUs } from '@/constants/languages/languageEnUs';
import { languageEsEs } from '@/constants/languages/languageEsEs';
import { languagePtBr } from '@/constants/languages/languagePtBr';

import type { RecentActivityStatus } from '@/@types/v2/RecentActivities';

import {
  getAuditStatusText,
  getRecentActivityStatusView,
  resolveStatusColor,
} from './recent-activity-status';

const pt: any = languagePtBr.BR;
const en: any = languageEnUs.US;
const es: any = languageEsEs.ES;

const domain = (code: string, label: string, color: string | null): RecentActivityStatus => ({
  source: 'domain',
  code,
  label,
  color,
  at: null,
});

describe('resolveStatusColor', () => {
  it('hex → usado direto; nome → paleta; null/desconhecido → neutro', () => {
    expect(resolveStatusColor('#038F59')).toEqual({ kind: 'hex', value: '#038F59' });
    expect(resolveStatusColor('blue')).toEqual({ kind: 'palette', value: 'blue' });
    expect(resolveStatusColor('Yellow')).toEqual({ kind: 'palette', value: 'yellow' });
    expect(resolveStatusColor(null)).toEqual({ kind: 'palette', value: 'gray' });
    expect(resolveStatusColor('magenta-xyz')).toEqual({ kind: 'palette', value: 'gray' });
  });
});

describe('getRecentActivityStatusView', () => {
  it('domain: label traduzido por type+code em en/es; pt usa o dicionário', () => {
    const item = { type: 'service_order', status: domain('3', 'Concluída', '#038F59') } as any;
    expect(getRecentActivityStatusView(item, en)).toEqual({
      kind: 'badge',
      label: 'Completed',
      color: { kind: 'hex', value: '#038F59' },
    });
    expect((getRecentActivityStatusView(item, es) as any).label).toBe('Concluida');
    expect((getRecentActivityStatusView(item, pt) as any).label).toBe('Concluída');
  });

  it('domain: Apontamento e Manutenção compartilham o enum; cor null → neutro', () => {
    const item = { type: 'maintenance', status: domain('O', 'Aberto', null) } as any;
    expect(getRecentActivityStatusView(item, en)).toEqual({
      kind: 'badge',
      label: 'Open',
      color: { kind: 'palette', value: 'gray' },
    });
  });

  it('domain: type/code sem tradução → fallback para o label da API', () => {
    const item = { type: 'tipo_futuro', status: domain('X', 'Rótulo API', 'green') } as any;
    expect((getRecentActivityStatusView(item, en) as any).label).toBe('Rótulo API');
  });

  it('audit: "Criado em"/"Editado em" no formato de data do idioma', () => {
    const at = '2026-10-05T15:30:00';
    const created = {
      type: 'x',
      status: { source: 'audit', code: 'created', label: 'Criado', color: null, at },
    } as any;
    const updated = {
      type: 'x',
      status: { source: 'audit', code: 'updated', label: 'Editado', color: null, at },
    } as any;
    expect(getRecentActivityStatusView(created, pt)).toEqual({
      kind: 'text',
      text: 'Criado em 05/10/2026 15:30',
    });
    expect(getRecentActivityStatusView(updated, en)).toEqual({
      kind: 'text',
      text: 'Edited on 10/05/2026 15:30',
    });
    expect(getRecentActivityStatusView(created, es)).toEqual({
      kind: 'text',
      text: 'Creado el 05/10/2026 15:30',
    });
  });

  it('audit sem data ou código desconhecido → vazio', () => {
    expect(
      getAuditStatusText({ source: 'audit', code: 'created', label: '', color: null, at: null }, pt)
    ).toBeNull();
    expect(
      getAuditStatusText(
        { source: 'audit', code: 'deleted', label: '', color: null, at: '2026-10-05T15:30:00' },
        pt
      )
    ).toBeNull();
  });

  it('status null/ausente → vazio', () => {
    expect(getRecentActivityStatusView({ type: 'x', status: null } as any, pt)).toEqual({
      kind: 'empty',
    });
    expect(getRecentActivityStatusView({ type: 'x' } as any, pt)).toEqual({ kind: 'empty' });
  });
});
