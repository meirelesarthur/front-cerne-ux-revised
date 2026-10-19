// src/hooks/useCurrentFarm.ts
// -----------------------------------------------------------------------------
// GAP-EMP-01/TASK-EMP-FE-07 — GET /me/farms/current. Único consumidor hoje:
// bloqueio preventivo do "Criar Usuário" em Funcionários
// (CreateOrUpdateFuncionario.tsx). `users_quota` ausente/nulo (backend
// antigo, falha de rede) NUNCA deve ser tratado como bloqueio pelo
// consumidor — ver leitura com `?? false` no ponto de uso.
// -----------------------------------------------------------------------------

import { useQuery } from '@tanstack/react-query';

import { queryKey } from '@/constants/query-key';

import { getCurrentFarm } from '@/services/v2/Farms/farm-service';

import type { FarmCurrent } from '@/@types/v2/Farms';

interface UseCurrentFarmOptions {
  enabled?: boolean;
}

export function useCurrentFarm({ enabled = true }: UseCurrentFarmOptions = {}) {
  return useQuery<FarmCurrent>({
    queryKey: [queryKey.farms.current],
    queryFn: getCurrentFarm,
    enabled,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: false,
  });
}
