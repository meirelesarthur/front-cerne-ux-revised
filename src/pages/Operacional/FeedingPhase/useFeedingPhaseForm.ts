// src/pages/Operacional/FeedingPhase/useFeedingPhaseForm.ts
// -----------------------------------------------------------------------------
// Hook de query do FORMULÁRIO completo de Fase de Alimentação (FeedingPhase
// — Operacional/Pecuária/Confinamento, F-034, TASK-FP-FE-03). Arquivo
// distinto de `index.tsx` (listagem, TASK-FP-FE-02) — mirror
// `Diet/useDietForm.ts`.
// -----------------------------------------------------------------------------

import { useCustomFormQueryByGuid } from '@/hooks/useCustomFormQueryByGuid';

import { queryKey } from '@/constants/query-key';

import { getFeedingPhase } from '@/services/v2/FeedingPhases/feeding-phase-service';

import type { FeedingPhaseDetail } from '@/@types/v2/FeedingPhases';

interface UseFeedingPhaseFormProps {
  registrationId?: string;
  fillForm: (data: FeedingPhaseDetail, resetForce?: boolean) => void;
}

// Query de detalhe para preencher o formulário de edição (match por GUID) —
// mirror `useDietForm`.
export function useFeedingPhaseForm({ registrationId, fillForm }: UseFeedingPhaseFormProps) {
  return useCustomFormQueryByGuid<FeedingPhaseDetail>({
    registrationId,
    queryKey: queryKey.feedingPhases.feedingPhase,
    asyncFunction: getFeedingPhase,
    fillForm,
  });
}
