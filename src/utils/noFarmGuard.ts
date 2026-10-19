// src/utils/noFarmGuard.ts
// -----------------------------------------------------------------------------
// TASK-072-FE-11 — regra PURA do guard "contratante sem fazenda" (DEC-362).
//
//   shouldRedirect = isContractor && !hasFarms && !isAllowedPath(pathname)
//
// Sinal: `GET /auth/me` → `farm_context: {is_contractor, has_farms}` (API-01).
// `useMyFarms`/`farms[]` NÃO servem (ficam vazios também para o Gestor_Plataf).
//
// Sem flash / fail-open:
//   - `loading` ou `profile` ausente → não decide (false);
//   - perfil SEM `farm_context` (back antigo) → false (o back segue protegendo
//     com 403 `FARM_CONTEXT_REQUIRED`, ver TASK-072-FE-10);
//   - papel isento (`Gestor_Plataf`) → false.
// -----------------------------------------------------------------------------

import { matchPath } from 'react-router-dom';

import {
  NO_FARM_ALLOWED_ROUTE_PATTERNS,
  NO_FARM_GUARD_EXEMPT_ROLES,
} from '@/constants/routes/no-farm-allowed-routes';

import type { FarmContextSignal, UserProfileV2 } from '@/@types/v2/permissions';

export function isAllowedPath(pathname: string): boolean {
  return NO_FARM_ALLOWED_ROUTE_PATTERNS.some(
    (pattern) => matchPath({ path: pattern, end: true }, pathname) !== null
  );
}

export interface ShouldRedirectNoFarmInput {
  loading: boolean;
  profile: Pick<UserProfileV2, 'farm_context'> | null | undefined;
  roles: readonly string[];
  pathname: string;
}

export function shouldRedirectNoFarm({
  loading,
  profile,
  roles,
  pathname,
}: ShouldRedirectNoFarmInput): boolean {
  if (loading || !profile) return false;

  const farmContext = profile.farm_context;
  if (!farmContext) return false;

  if ((roles ?? []).some((role) => NO_FARM_GUARD_EXEMPT_ROLES.includes(role))) return false;

  if (!farmContext.is_contractor || farmContext.has_farms) return false;

  return !isAllowedPath(pathname);
}

/**
 * Setter otimista (liberação imediata após criar a 1ª fazenda, integração
 * FE-09): só SOBE `has_farms` para `true`, nunca para `false`. Devolve a MESMA
 * referência quando não há nada a mudar (evita re-render). O próximo
 * `refreshProfile()` substitui pelo valor real do servidor.
 *
 * @param {TProfile | null} profile Perfil atual do AuthContext.
 * @return {TProfile | null} Perfil com `has_farms=true` (ou o mesmo objeto).
 */
export function withHasFarmsRaised<TProfile extends { farm_context?: FarmContextSignal }>(
  profile: TProfile | null
): TProfile | null {
  if (!profile?.farm_context || profile.farm_context.has_farms) return profile;
  return { ...profile, farm_context: { ...profile.farm_context, has_farms: true } };
}
