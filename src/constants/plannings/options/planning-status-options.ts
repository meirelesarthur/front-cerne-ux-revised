// src/constants/plannings/options/planning-status-options.ts
// -----------------------------------------------------------------------------
// Fábrica de options de status de Planejamento (Planning) — TASK-FE-PLAN-01.
// Deriva label (i18n, `languageGB.plannings.planning.list.statusLabels`) +
// cor (token Chakra, `PLANNING_STATUS_META`) do Enum `PlanningStatusEnum`
// (backend, backed int 1/2/3) — mirror `getServiceOrderStatusOptions`.
// Consumida pela legenda estática de cores de status da Listagem
// ("legenda estática de cores de status", Leitura do dev do Roteiro).
// -----------------------------------------------------------------------------

import { PLANNING_STATUS_META } from '@/pages/Operacional/Planejamentos/planningStatus';

import type { LanguageDate } from '@/@types/language';
import type { PlanningStatusValue } from '@/@types/v2/Operacional/planning';

export interface PlanningStatusOption {
  status: PlanningStatusValue;
  label: string;
  badgeColor: string;
}

/**
 * Legenda ordenada de status (1→2→3), label traduzido + cor tokenizada.
 * @param {LanguageDate} languageGB - Pacote de idioma ativo.
 * @return {PlanningStatusOption[]} Legenda de status pronta para exibição.
 */
export function getPlanningStatusOptions(languageGB: LanguageDate): PlanningStatusOption[] {
  const legend = languageGB.plannings.planning.list.statusLabels;

  return [
    { status: 1, label: legend.pending, badgeColor: PLANNING_STATUS_META[1].badgeColor },
    { status: 2, label: legend.released, badgeColor: PLANNING_STATUS_META[2].badgeColor },
    { status: 3, label: legend.closed, badgeColor: PLANNING_STATUS_META[3].badgeColor },
  ];
}
