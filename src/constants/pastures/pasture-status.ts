// src/constants/pastures/pasture-status.ts
// Dicionário ÚNICO de status→cor/transição de Pastagem (Pasture) —
// TASK-PAST-FE-02. Fonte única de verdade consumida por Listagem
// (legenda + badge de linha) e Visualização — mirror
// `appropriationStatus.ts` (feature irmã Appropriations).
//
// A API NÃO expõe hex cru para Pastagem (`PastureResource.status` é só o
// `value` do enum) — cor é decisão 100% do front, via tokens semânticos
// (nunca hex fixo, Passo UX).

import type { PastureStatusValue } from '@/@types/v2/Pastures';

export interface PastureStatusMeta {
  /** Token de cor Chakra para o dot do `Status.tsx` — NUNCA hex cru. */
  badgeColor: string;
}

export const PASTURE_STATUS_META: Record<PastureStatusValue, PastureStatusMeta> = {
  O: { badgeColor: 'red.500' },
  F: { badgeColor: 'green.500' },
  A: { badgeColor: 'blue.500' },
};

/**
 * Legenda de status ordenada O→F→A — mirror `getAppropriationStatusLegend`.
 * @param {object} languageGB - Pacote de idioma ativo (só a fração usada aqui).
 * @return {Array<{status: PastureStatusValue, label: string}>} Legenda ordenada.
 */
export function getPastureStatusLegend(languageGB: {
  pastures: {
    pasture: { list: { statusLegend: Record<'opened' | 'finished' | 'appropriated', string> } };
  };
}) {
  const legend = languageGB.pastures.pasture.list.statusLegend;
  return [
    { status: 'O' as PastureStatusValue, label: legend.opened },
    { status: 'F' as PastureStatusValue, label: legend.finished },
    { status: 'A' as PastureStatusValue, label: legend.appropriated },
  ];
}
