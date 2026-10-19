// src/pages/Administrativo/Fabrica/FoodBeat/useFoodBeatForm.ts
// -----------------------------------------------------------------------------
// Hook de query do FORMULÁRIO completo de Batida (FoodBeat — Fábrica,
// TASK-FB-FE-06). Mirror EXATO de `Fabrica/useFoodForm.ts` (Food, mesmo
// racional de arquivo distinto do `index.tsx`/listagem, TASK-FB-FE-05).
// -----------------------------------------------------------------------------

import { useCustomFormQueryByGuid } from '@/hooks/useCustomFormQueryByGuid';

import { queryKey } from '@/constants/query-key';

import { getFoodBeat } from '@/services/v2/FoodBeats/food-beat-service';

import type { FoodBeatDetail } from '@/@types/v2/FoodBeats';

interface UseFoodBeatFormProps {
  registrationId?: string;
  fillForm: (data: FoodBeatDetail, resetForce?: boolean) => void;
}

// Query de detalhe para preencher o formulário de edição (match por GUID) —
// mirror `useFoodForm`/`useOpeningBalanceForm`.
export function useFoodBeatForm({ registrationId, fillForm }: UseFoodBeatFormProps) {
  return useCustomFormQueryByGuid<FoodBeatDetail>({
    registrationId,
    queryKey: queryKey.foodBeats.foodBeat,
    asyncFunction: getFoodBeat,
    fillForm,
  });
}
