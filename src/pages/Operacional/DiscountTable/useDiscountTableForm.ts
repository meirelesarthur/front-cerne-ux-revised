// src/pages/Operacional/DiscountTable/useDiscountTableForm.ts
// -----------------------------------------------------------------------------
// Hook de query do FORMULÁRIO completo de Tabela de Desconto (DiscountTable
// — Operacional/Agricultura, F-032, TASK-DT-FE-03). Arquivo distinto de
// `index.tsx` (listagem, TASK-DT-FE-02) — mirror `Diet/useDietForm.ts`/
// `FeedingPhase/useFeedingPhaseForm.ts`.
// -----------------------------------------------------------------------------

import { useCustomFormQueryByGuid } from '@/hooks/useCustomFormQueryByGuid';

import { queryKey } from '@/constants/query-key';

import { getDiscountTable } from '@/services/v2/DiscountTables/discount-table-service';

import type { DiscountTableDetail } from '@/@types/v2/DiscountTables';

interface UseDiscountTableFormProps {
  registrationId?: string;
  fillForm: (data: DiscountTableDetail, resetForce?: boolean) => void;
}

// Query de detalhe para preencher o formulário de edição/visualização (match
// por GUID) — mirror `useFeedingPhaseForm`.
export function useDiscountTableForm({ registrationId, fillForm }: UseDiscountTableFormProps) {
  return useCustomFormQueryByGuid<DiscountTableDetail>({
    registrationId,
    queryKey: queryKey.discountTables.discountTable,
    asyncFunction: getDiscountTable,
    fillForm,
  });
}
