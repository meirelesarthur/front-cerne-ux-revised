// src/constants/breedingMating/breeding-mating-status.ts
// -----------------------------------------------------------------------------
// Dicionário ÚNICO de status→token de Acasalamento (BreedingMating — F-016,
// TASK-BM-FE-02, GAP-FE-BM-01). O envelope de `EP-BM-01` traz um campo extra
// de cor bruta em hexadecimal (`App\BreedingMating::iatfStatus()`) — o front
// NÃO tipa nem consome esse campo, mirror `SERVICE_ORDER_STATUS_META`/
// `APPROPRIATION_STATUS_META`. Cobre os 3 valores de `BreedingMatingStatusValue`
// (0=legado/tolerado, 1=Em Andamento, 2=Finalizado — OQD-006).
// -----------------------------------------------------------------------------

import type { BreedingMatingStatusValue } from '@/@types/v2/BreedingMating';

export interface BreedingMatingStatusMeta {
  /** Token de cor Chakra para o dot/badge — NUNCA hex cru. */
  badgeToken: string;
}

export const BREEDING_MATING_STATUS_META: Record<
  BreedingMatingStatusValue,
  BreedingMatingStatusMeta
> = {
  0: { badgeToken: 'gray.500' }, // legado — sem label semântico ("—")
  1: { badgeToken: 'yellow.500' }, // Em Andamento
  2: { badgeToken: 'green.500' }, // Finalizado
};

/**
 * Fallback defensivo — `status.value` fora do dicionário (não deveria
 * ocorrer; o backend tolera só 0/1/2, OQD-006).
 * @param {BreedingMatingStatusValue} value - Valor do status (`BreedingMatingStatus` backend).
 * @return {string} Token de cor Chakra para o dot/badge.
 */
export function getBreedingMatingStatusBadgeToken(value: BreedingMatingStatusValue): string {
  return BREEDING_MATING_STATUS_META[value]?.badgeToken ?? 'gray.500';
}
