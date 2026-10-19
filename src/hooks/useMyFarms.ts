// src/hooks/useMyFarms.ts
// -----------------------------------------------------------------------------
// TASK-FE-920 (AJUSTE 3 — seletor de fazenda ativa do header). Fonte de dados
// do `FarmSwitcher` (TASK-FE-921): `GET /me/farms` — fazendas ATIVAS do
// usuário autenticado, universo pequeno e quase-estático (mirror
// `useCostCenterTree`, `CentroCusto/useCostCenters.tsx`): `useQuery` direto,
// staleTime moderado, sem paginação/filtro (o backend não pagina este
// endpoint — `FarmController::mine()`/`ListActiveFarmsAction`).
//
// Array vazio é um resultado VÁLIDO (usuário sem fazenda vinculada — ex.:
// `Gestor_Plataf`/contratante novo) — NÃO é erro, ver
// `tenancy-farm-ausente-estado-valido` (fato de domínio já documentado). O
// consumidor (`FarmSwitcher`) decide o que fazer com a lista vazia.
// -----------------------------------------------------------------------------

import { useQuery } from '@tanstack/react-query';

import { queryKey } from '@/constants/query-key';
import { getMyFarms } from '@/services/v2/Farms/farm-service';

import type { FarmRef } from '@/@types/v2/Farms';

export function useMyFarms() {
  return useQuery<FarmRef[]>({
    queryKey: [queryKey.farms.mine],
    queryFn: getMyFarms,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: false,
  });
}
