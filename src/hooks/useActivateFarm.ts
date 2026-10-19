// src/hooks/useActivateFarm.ts
// -----------------------------------------------------------------------------
// TASK-072-FE-09 (E2) — ativa uma fazenda no SERVIDOR e propaga o contexto,
// na MESMA sequência do `FarmSwitcher` (DEC-020.1/2):
//   1. `selectFarm(uuid)` → `POST /me/farms/{uuid}/select` (efeito real no banco);
//   2. `setActiveFarm(uuid)` (AuthContext → `localStorage['app-active-farm']`,
//      lido pelo interceptor para o header `X-Farm-Id`);
//   3. `queryClient.invalidateQueries()` SEM filtro — toda tela recarrega o
//      contexto da nova fazenda (inclui `queryKey.farms.mine`, que faz o
//      `FarmSwitcher` aparecer sem F5).
// Falha no passo 1 NÃO executa 2/3 (a ativa local continua coerente com o back).
//
// Ponto de integração da onda 3 (TASK-072-FE-11): a liberação do guard
// "contratante sem fazenda" (`markHasFarms()` + `refreshProfile()`) é
// acrescentada pelo consumidor (`CreateOrUpdateFarm.actionSuccess`), não aqui.
// -----------------------------------------------------------------------------

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useContextSelector } from 'use-context-selector';

import { AuthContext } from '@/contexts/AuthContext';

import { selectFarm } from '@/services/v2/Farms/farm-service';

import type { FarmRef } from '@/@types/v2/Farms';

export function useActivateFarm() {
  const queryClient = useQueryClient();
  const setActiveFarm = useContextSelector(AuthContext, (ctx) => ctx.setActiveFarm);

  return useMutation<FarmRef, unknown, string>({
    mutationFn: (farmUuid: string) => selectFarm(farmUuid),
    onSuccess: async (selectedFarm, farmUuid) => {
      setActiveFarm(selectedFarm?.uuid ?? farmUuid);
      await queryClient.invalidateQueries();
    },
  });
}
