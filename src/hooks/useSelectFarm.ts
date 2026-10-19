// src/hooks/useSelectFarm.ts
// -----------------------------------------------------------------------------
// TASK-FE-920 (AJUSTE 3 — seletor de fazenda ativa do header). Mutation SÓ
// da chamada de rede (`POST /me/farms/{uuid}/select`, `SelectActiveFarmAction`
// — TEM efeito colateral real no banco: `farm.last_activity`,
// `user.last_farm_id`, novo registro `UserActivity`, RN-07 do plano).
//
// Este hook NÃO orquestra `localStorage`/`AuthContext.setActiveFarm()`/
// `queryClient.invalidateQueries()` — isso é responsabilidade do consumidor
// (`FarmSwitcher`, TASK-FE-921/DEC-020), que decide a sequência exata pós
// `onSuccess`. Mantém o hook fino e testável isoladamente (mock simples de
// `selectFarm`), mirror do padrão de mutation "crua" do projeto (ex.:
// `deleteMutation` em `Addressing/index.tsx`, que também delega os efeitos
// colaterais ao componente).
// -----------------------------------------------------------------------------

import { useMutation } from '@tanstack/react-query';

import { selectFarm } from '@/services/v2/Farms/farm-service';

import type { FarmRef } from '@/@types/v2/Farms';

export function useSelectFarm() {
  return useMutation<FarmRef, unknown, string>({
    mutationFn: (farmUuid: string) => selectFarm(farmUuid),
  });
}
