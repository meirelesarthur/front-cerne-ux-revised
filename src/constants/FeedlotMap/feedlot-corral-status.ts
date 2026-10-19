// src/constants/FeedlotMap/feedlot-corral-status.ts
// Status do Curral (FeedlotCorral) — Mapa de Confinamento, TASK-FE-042-201,
// `[[06-front-estrutura-espacial]]` §"Card do curral". Mirror EXATO de
// `agro365/resources/js/components/FeedlotMap/CardCurral.js`
// (`STATUS_ICONS`/`isEmpty`/`isSanitary`) — `status_color`/`status_label` já
// vêm PRONTOS do backend (`CorralCardData`), este módulo só resolve o ÍCONE
// por status (decisão puramente visual, sem análogo server-side) e as 2
// listas de status usadas nas condições de visibilidade do card (`LM07`).

import { Ban, Beef, Cross, Shield, Sparkles, Wrench, type LucideIcon } from 'lucide-react';

export const feedlotCorralStatus = {
  available: 'VA',
  reserved: 'VS',
  occupied: 'OC',
  maintenance: 'MA',
  cleaning: 'LI',
  sanitaryHold: 'EN',
  closed: 'FE',
} as const;

export type FeedlotCorralStatusValue =
  (typeof feedlotCorralStatus)[keyof typeof feedlotCorralStatus];

// Mirror `STATUS_ICONS` (legado) — `null` no legado (VA/OC) usa o ícone
// genérico de gado (`CATTLE_ICON`), aqui `Beef` (lucide).
export const feedlotCorralStatusIcon: Record<string, LucideIcon> = {
  [feedlotCorralStatus.available]: Beef,
  [feedlotCorralStatus.reserved]: Shield,
  [feedlotCorralStatus.occupied]: Beef,
  [feedlotCorralStatus.maintenance]: Wrench,
  [feedlotCorralStatus.cleaning]: Sparkles,
  [feedlotCorralStatus.sanitaryHold]: Cross,
  [feedlotCorralStatus.closed]: Ban,
};

// `isEmpty` (legado) — mirror `LM07`/bloco `batchCount === 0` do `CardCurral.js`.
export const FEEDLOT_CORRAL_EMPTY_STATUSES: readonly string[] = [
  feedlotCorralStatus.available,
  feedlotCorralStatus.reserved,
  feedlotCorralStatus.closed,
  feedlotCorralStatus.maintenance,
  feedlotCorralStatus.cleaning,
];

// `isSanitary` (legado) — mirror `LM07` (liberação só nestes status).
export const FEEDLOT_CORRAL_SANITARY_STATUSES: readonly string[] = [
  feedlotCorralStatus.reserved,
  feedlotCorralStatus.closed,
  feedlotCorralStatus.maintenance,
  feedlotCorralStatus.cleaning,
];

// Status elegíveis a "Gerenciar Lotes" (mirror `CardCurral.js`, `corral.status === "VA"`).
export const FEEDLOT_CORRAL_MANAGE_BATCHES_STATUSES: readonly string[] = [
  feedlotCorralStatus.available,
];

// Status elegíveis a "Transferir Lote"/"Atualizar Dados" (mirror `["OC", "EN"].includes`).
export const FEEDLOT_CORRAL_OCCUPIED_STATUSES: readonly string[] = [
  feedlotCorralStatus.occupied,
  feedlotCorralStatus.sanitaryHold,
];

// Tint mais forte do card (mirror `["LI", "EN"].includes(corral.status)` — `bgColor`, `CardCurral.js`).
export const FEEDLOT_CORRAL_HEAVY_TINT_STATUSES: readonly string[] = [
  feedlotCorralStatus.cleaning,
  feedlotCorralStatus.sanitaryHold,
];
