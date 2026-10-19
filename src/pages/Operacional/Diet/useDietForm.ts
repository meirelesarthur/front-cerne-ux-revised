// src/pages/Operacional/Diet/useDietForm.ts
// -----------------------------------------------------------------------------
// Hook de query do FORMULÁRIO completo de Dieta (Diet — Operacional/
// Pecuária, TASK-FE-DIET-03). Arquivo distinto de `index.tsx` (listagem,
// TASK-FE-DIET-02) — mirror `Fabrica/useFoodForm.ts`.
// -----------------------------------------------------------------------------

import { useCustomFormQueryByGuid } from '@/hooks/useCustomFormQueryByGuid';

import { queryKey } from '@/constants/query-key';

import { getDiet } from '@/services/v2/Diets/diet-service';

import type { DietDetail } from '@/@types/v2/Diets';

interface UseDietFormProps {
  registrationId?: string;
  fillForm: (data: DietDetail, resetForce?: boolean) => void;
}

// Query de detalhe para preencher o formulário de edição (match por GUID) —
// mirror `useFoodForm`.
export function useDietForm({ registrationId, fillForm }: UseDietFormProps) {
  return useCustomFormQueryByGuid<DietDetail>({
    registrationId,
    queryKey: queryKey.diets.diet,
    asyncFunction: getDiet,
    fillForm,
  });
}
