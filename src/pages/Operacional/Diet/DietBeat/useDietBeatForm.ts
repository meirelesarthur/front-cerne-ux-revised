// src/pages/Operacional/Diet/DietBeat/useDietBeatForm.ts
// -----------------------------------------------------------------------------
// Hook de query do FORMULÁRIO completo de Batida (DietBeat —
// Operacional/Pecuária, TASK-FE-DIET-06). Mirror EXATO de
// `FoodBeat/useFoodBeatForm.ts` (mesmo racional de arquivo distinto do
// `index.tsx`/listagem, TASK-FE-DIET-05).
// -----------------------------------------------------------------------------

import { useCustomFormQueryByGuid } from '@/hooks/useCustomFormQueryByGuid';

import { queryKey } from '@/constants/query-key';

import { getDietBeat } from '@/services/v2/DietBeats/diet-beat-service';

import type { DietBeatDetail } from '@/@types/v2/DietBeats';

interface UseDietBeatFormProps {
  registrationId?: string;
  fillForm: (data: DietBeatDetail, resetForce?: boolean) => void;
}

// Query de detalhe para preencher o formulário de edição (match por GUID) —
// mirror `useFoodBeatForm`/`useDietForm`.
export function useDietBeatForm({ registrationId, fillForm }: UseDietBeatFormProps) {
  return useCustomFormQueryByGuid<DietBeatDetail>({
    registrationId,
    queryKey: queryKey.dietBeats.dietBeat,
    asyncFunction: getDietBeat,
    fillForm,
  });
}
