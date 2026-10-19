// src/pages/BaseRegistrations/DrinkingFountains/useDrinkingFountains.tsx
// -----------------------------------------------------------------------------
// Hook PRÓPRIO de Bebedouros — TASK-FE-2302. Encapsula a ÚNICA lógica
// realmente compartilhada do formulário: buscar `GET /drinking-fountains/
// options` (contrato de API §6, 1 chamada agregadora) e traduzir o resultado
// em `Option[]` prontos para os 3 `Select` de localização (Área/Módulo
// Pastejo/Curral) — mapeamento de contagem (`drinking_fountains_count`) e de
// rótulo composto (`identification — name`) do Curral. Wrapper justificado
// pelo protocolo v2 ("wrapper só existe quando encapsula lógica real") — o
// resto do formulário (XOR Área×Módulo, semântica de Curral, submit) fica
// INLINE em `CreateOrUpdateDrinkingFountain.tsx`, sem
// `useDrinkingFountainForm.tsx` (padrão proibido no `BaseRegistrations`).
//
// `currentDrinkingFountainUuid` — SÓ em edição (contrato de API §6): mantém
// visível na lista o Curral HOJE vinculado a ESTE Bebedouro, mesmo que
// "ocupado" (por ele mesmo).
// -----------------------------------------------------------------------------

import { useQuery } from '@tanstack/react-query';

import { queryKey } from '@/constants/query-key';

import { listDrinkingFountainOptions } from '@/services/v2/BaseRegistrations/drinking-fountains-service';

import type { Option } from '@/@types/option';
import type { DrinkingFountainOptions } from '@/@types/v2/BaseRegistrations/drinking-fountains';

interface UseDrinkingFountainOptionsResult {
  isLoading: boolean;
  areaOptions: Option<string>[];
  grazingOptions: Option<string>[];
  feedlotCorralOptions: Option<string>[];
}

export function useDrinkingFountainOptions(
  currentDrinkingFountainUuid?: string
): UseDrinkingFountainOptionsResult {
  const optionsQuery = useQuery({
    networkMode: 'offlineFirst',
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    queryKey: [queryKey.drinkingFountains.options, currentDrinkingFountainUuid],
    queryFn: async () => {
      const envelope = await listDrinkingFountainOptions({
        drinking_fountain_uuid: currentDrinkingFountainUuid,
      });
      return envelope.data;
    },
    retry: false,
  });

  const options = optionsQuery.data as DrinkingFountainOptions | undefined;

  return {
    isLoading: optionsQuery.isLoading,
    areaOptions: (options?.areas ?? []).map((area) => ({
      label: `${area.description} (${area.drinking_fountains_count})`,
      value: area.uuid,
    })),
    grazingOptions: (options?.grazings ?? []).map((grazing) => ({
      label: `${grazing.description} (${grazing.drinking_fountains_count})`,
      value: grazing.uuid,
    })),
    feedlotCorralOptions: (options?.feedlot_corrals ?? []).map((corral) => ({
      label: corral.name ? `${corral.identification} — ${corral.name}` : corral.identification,
      value: corral.uuid,
    })),
  };
}
