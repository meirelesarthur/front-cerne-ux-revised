// src/constants/RecentActivities/recent-activity-status.ts
// -----------------------------------------------------------------------------
// Mapeamento da coluna "Status" de Atividades Recentes (UT-000690 / D-092-13,
// ARQ-API-UT690 v1.2 §8). Funções puras (testáveis) usadas pela tela:
//  - cor do status de domínio: hex da API direto; nome de cor → paleta Chakra;
//    `null`/desconhecida → neutro;
//  - label do status de domínio: i18n por `type` + `code`, fallback = label da API;
//  - texto do status de auditoria: "Criado em / Editado em {{date}}" por idioma.
// -----------------------------------------------------------------------------

import formatDate from '@/utils/formatDate';

import type { LanguageDate } from '@/@types/language';
import type { RecentActivityListItem, RecentActivityStatus } from '@/@types/v2/RecentActivities';

export const recentActivityStatusSource = {
  domain: 'domain',
  audit: 'audit',
} as const;

export const recentActivityAuditCode = {
  created: 'created',
  updated: 'updated',
} as const;

// Paletas Chakra aceitas quando a API devolve um NOME de cor (ex.: Pastagens/Marcação).
const chakraPalettes = new Set([
  'gray',
  'red',
  'orange',
  'yellow',
  'green',
  'teal',
  'blue',
  'cyan',
  'purple',
  'pink',
]);

const hexColor = /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i;

export type RecentActivityStatusColor =
  { kind: 'hex'; value: string } | { kind: 'palette'; value: string };

// `null`/desconhecida → paleta neutra `gray`.
export function resolveStatusColor(color: string | null | undefined): RecentActivityStatusColor {
  const normalized = color?.trim();
  if (normalized && hexColor.test(normalized)) return { kind: 'hex', value: normalized };
  const name = normalized?.toLowerCase();
  if (name && chakraPalettes.has(name)) return { kind: 'palette', value: name };
  return { kind: 'palette', value: 'gray' };
}

// Label i18n do status de domínio; sem tradução → label (pt) da API.
export function getDomainStatusLabel(
  type: string,
  status: RecentActivityStatus,
  languageGB: LanguageDate
): string {
  return (
    languageGB.recentActivities.recentActivity.domainStatus[type]?.[status.code] ?? status.label
  );
}

// "Criado em …"/"Editado em …"; `null` se o código for desconhecido ou sem data.
export function getAuditStatusText(
  status: RecentActivityStatus,
  languageGB: LanguageDate
): string | null {
  const text = languageGB.recentActivities.recentActivity.status;
  if (!status.at) return null;
  const template =
    status.code === recentActivityAuditCode.created
      ? text.created
      : status.code === recentActivityAuditCode.updated
        ? text.updated
        : null;
  if (!template) return null;
  const date = formatDate(status.at, text.dateFormat);
  return date ? template.replace('{{date}}', date) : null;
}

export type RecentActivityStatusView =
  | { kind: 'empty' }
  | { kind: 'badge'; label: string; color: RecentActivityStatusColor }
  | { kind: 'text'; text: string };

// Decide como a célula renderiza o status do item.
export function getRecentActivityStatusView(
  item: Pick<RecentActivityListItem, 'type' | 'status'>,
  languageGB: LanguageDate
): RecentActivityStatusView {
  const status = item.status;
  if (!status) return { kind: 'empty' };

  if (status.source === recentActivityStatusSource.domain) {
    return {
      kind: 'badge',
      label: getDomainStatusLabel(item.type, status, languageGB),
      color: resolveStatusColor(status.color),
    };
  }

  if (status.source === recentActivityStatusSource.audit) {
    const text = getAuditStatusText(status, languageGB);
    return text ? { kind: 'text', text } : { kind: 'empty' };
  }

  return { kind: 'empty' };
}
