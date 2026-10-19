// src/pages/Operacional/Inventariado/useInventoriedDetail.tsx
// ---- Hook de Query — Detalhe de Inventariado ----
// TASK-INV-FE-04. Mirror do padrão em `useOpeningBalanceDetail.tsx`.

import { useQuery } from '@tanstack/react-query';

import { queryKey } from '@/constants/query-key';

import { getInventoried } from '@/services/v2/Inventoried/inventoried-service';

import type { InventoriedDetail } from '@/@types/v2/Inventoried';

export function useInventoriedDetail(inventoriedUuid: string | undefined, enabled = true) {
  return useQuery<InventoriedDetail>({
    queryKey: [queryKey.inventoried.inventoried, inventoriedUuid],
    queryFn: async () => {
      if (!inventoriedUuid) {
        throw new Error('inventoriedUuid is required');
      }
      const response = await getInventoried(inventoriedUuid);
      return response.data;
    },
    enabled: enabled && !!inventoriedUuid,
  });
}
