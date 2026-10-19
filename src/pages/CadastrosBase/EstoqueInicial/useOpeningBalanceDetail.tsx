// src/pages/CadastrosBase/EstoqueInicial/useOpeningBalanceDetail.tsx
// ---- Hook de Query — Detalhe de Estoque Inicial ----
// TASK-FE-1045, execução 026. Mirror do padrão em `useProducts.tsx`/`useWarehouses.tsx`.

import { useQuery } from '@tanstack/react-query';

import { queryKey } from '@/constants/query-key';

import { getOpeningBalance } from '@/services/v2/OpeningBalances/opening-balance-service';

import type { OpeningBalanceDetail } from '@/@types/v2/OpeningBalances';

export function useOpeningBalanceDetail(openingBalanceUuid: string | undefined, enabled = true) {
  return useQuery<OpeningBalanceDetail>({
    queryKey: [queryKey.openingBalances.openingBalance, openingBalanceUuid],
    queryFn: async () => {
      if (!openingBalanceUuid) {
        throw new Error('openingBalanceUuid is required');
      }
      const response = await getOpeningBalance(openingBalanceUuid);
      return response.data;
    },
    enabled: enabled && !!openingBalanceUuid,
  });
}
