// src/pages/Administrativo/Sla/useSupplyStatusSla.tsx
// -----------------------------------------------------------------------------
// Hook de query do módulo "Parâmetros SLA" (SupplyStatusSla — Administrativo
// / Suprimentos, TASK-FE-SLA-01).
//
// `useSupplyStatusSlaList` NÃO usa `useCustomGridQuery` (família Grid do
// projeto assume paginação real — `page`/`per_page`/`meta` — ver
// `get_pwa_grid_query_pattern`): a API de `SupplyStatusSla` devolve os 11
// parâmetros da fazenda ativa em uma única chamada, SEM `meta` de paginação
// (DA-SLA-03 do contrato de API). Mirror EXATO de
// `useAccountingGroupersList` — `useQuery` DIRETO (TanStack Query), SEM
// parâmetro de filtro (não existe filtro nesta entidade, diferente de
// `AccountingGrouper`).
//
// `enabled: hasFarm` — guard de `farm.context` estrito (mirror
// `TenantParameters`): evita disparar o GET sem fazenda ativa (403 cru).
// -----------------------------------------------------------------------------

import { useQuery } from '@tanstack/react-query';

import { queryKey } from '@/constants/query-key';

import { listSupplyStatusSlas } from '@/services/v2/SupplyStatusSlas/supply-status-sla-service';

export function useSupplyStatusSlaList(hasFarm: boolean) {
  return useQuery({
    queryKey: [queryKey.supplyStatusSlas.supplyStatusSlaList],
    queryFn: listSupplyStatusSlas,
    enabled: hasFarm,
    networkMode: 'online',
    staleTime: 0,
    gcTime: 5 * 60 * 1000,
    refetchOnWindowFocus: true,
  });
}
