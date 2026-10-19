// src/pages/Operacional/GrouperBatches/useGroupBatches.ts
// -----------------------------------------------------------------------------
// Hook de mutação "Agrupar" (POST /grouper-batches, execução 042,
// TASK-FE-042-302) — hook de MÓDULO (não em `src/hooks/` genérico), mirror
// `Administrativo/SaldoEstoque/useConsolidateStocks.ts`.
//
// Via `useRequest({ typesRequest: 'apply' })` — invalida `queryKey.batches.list`
// (D-front-7, a MESMA chave de `Batches/`), então a grid desta tela E a de
// `Batches/` recarregam sozinhas após o agrupamento.
// -----------------------------------------------------------------------------

import { useLanguage } from '@/hooks/useLanguage';
import { useRequest } from '@/hooks/useRequest';

import { queryKey } from '@/constants/query-key';

import { groupBatches } from '@/services/v2/GrouperBatches/grouper-batch-service';

import type { BatchData } from '@/@types/v2/Batches';
import type { GroupBatchesPayload } from '@/@types/v2/GrouperBatches';

interface UseGroupBatchesProps {
  onSuccess: () => void;
}

export function useGroupBatches({ onSuccess }: UseGroupBatchesProps) {
  const { languageGB } = useLanguage();

  return useRequest<BatchData>({
    asyncFunction: (payload: GroupBatchesPayload) => groupBatches(payload),
    typesRequest: 'apply',
    entityName: languageGB.grouperBatches.grouperBatch.singularLabel,
    personalizedMessage: languageGB.grouperBatches.grouperBatch.group.successToast,
    queryKey: queryKey.batches.list,
    actionSuccess: onSuccess,
  });
}
