// src/pages/Configuracoes/Help/usePermissionScreens.tsx
// -----------------------------------------------------------------------------
// Lookup COMPARTILHADO de telas (`GET /permissions/screens`, Help-contrato
// §10) — endpoint NÃO-paginado, ~200 entradas, SEM gate administrativo.
// Mirror de `useEligibleIssuersForSync` (`CreateOrUpdateIssueDfeSyncTimes.tsx`)
// e de `useCostCenterTree` (`CentroCusto/useCostCenters.tsx`): 1 fetch
// cacheado, mapeado para `Option<string>[]`, consumido pelo `SelectCombobox`
// (busca CLIENT-SIDE) — tanto em `CreateOrUpdateHelp.tsx` (campo `permission`)
// quanto em `FilterSideHelp.tsx` (filtro por tela). NUNCA `SelectAsyncPaginate`
// aqui — o endpoint não pagina (regra consolidada em
// `[[98-chat/memory/patterns/component-selectcombobox-reutilizavel]]`).
// -----------------------------------------------------------------------------

import { useQuery } from '@tanstack/react-query';

import { queryKey } from '@/constants/query-key';

import { getPermissionScreens } from '@/services/v2/Configuracoes/Permission/permission-screens-service';

import type { Option } from '@/@types/option';

export function usePermissionScreens() {
  const query = useQuery({
    queryKey: [queryKey.configuracoes.permissionScreens],
    queryFn: async () => {
      const response = await getPermissionScreens();
      return response.data;
    },
    staleTime: 30 * 1000,
    refetchOnWindowFocus: false,
  });

  const options: Option<string>[] = (query.data ?? []).map((screen) => ({
    label: screen.title,
    value: screen.uuid,
  }));

  return { ...query, options };
}
