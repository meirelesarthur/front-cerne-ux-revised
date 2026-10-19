// src/pages/Operacional/Planejamentos/planningStatus.ts
// -----------------------------------------------------------------------------
// Dicionário ÚNICO de status→cor de Planejamento (Planning) — TASK-FE-PLAN-01.
// Fonte única de verdade consumida pela Listagem (badge de linha) e pela
// legenda estática de cores de status (Leitura do dev do Roteiro).
//
// `PlanningStatusEnum` no backend expõe hex cru (`status_color`,
// `#ffcc00`/`#009900`/`#8b0000`) — o front NÃO consome esse hex direto
// (proibição "hex fixo fora dos tokens" do Passo UX). Mapeamento por
// `Record<PlanningStatusValue, ...>` para tokens Chakra, mirror
// `SERVICE_ORDER_STATUS_META`. `status_label` do Resource é usado direto
// (mesma convenção de `ServiceOrderListItem.status.label` — o backend já
// resolve o rótulo, sem tradução própria no front).
// -----------------------------------------------------------------------------

import type { PlanningStatusValue } from '@/@types/v2/Operacional/planning';

export interface PlanningStatusMeta {
  /** Token de cor Chakra para o dot do `Status.tsx` — NUNCA hex cru. */
  badgeColor: string;
}

export const PLANNING_STATUS_META: Record<PlanningStatusValue, PlanningStatusMeta> = {
  1: { badgeColor: 'yellow.500' }, // Pendente
  2: { badgeColor: 'green.500' }, // Liberado
  3: { badgeColor: 'red.500' }, // Encerrado
};

/**
 * Fallback defensivo — `status` fora do dicionário (nunca deveria ocorrer,
 * mas evita `undefined.badgeColor` se o backend evoluir o Enum sem o front
 * acompanhar).
 * @param {PlanningStatusValue} value - Valor do status (`PlanningStatusEnum` backend).
 * @return {string} Token de cor Chakra para o dot do `Status.tsx`.
 */
export function getPlanningStatusBadgeColor(value: PlanningStatusValue): string {
  return PLANNING_STATUS_META[value]?.badgeColor ?? 'gray.500';
}
