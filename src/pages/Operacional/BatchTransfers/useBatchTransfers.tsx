// src/pages/Operacional/BatchTransfers/useBatchTransfers.tsx
// -----------------------------------------------------------------------------
// Hooks de query da feature TRANSFERÊNCIA ANIMAIS/LOTE (BatchTransfer,
// `426be835`, TASK-LOTE-FE-01/02), mirror `CadastrosBase/Batches/useBatches.tsx`:
//   - useBatchTransfersList        → useCustomGridQuery (listagem global, Tarefa 26)
//   - useBatchTransferCreateOptions → useQuery direto (lookups do form, Tarefas 26/27)
//   - useEligibleCandidateAnimals  → useQuery direto (picker de animais, Tarefa 27)
//
// `useEligibleCandidateAnimals` NÃO reaproveita o hook `useBatchCandidateAnimals`
// de `Batches/useBatches.tsx` — aquele hook foi desenhado para o form de LOTE
// (criação: `without_batch:true`; edição: `batch_uuid` + `without_batch` unidos),
// semântica INCOMPATÍVEL com esta tela, que transfere animais que JÁ ESTÃO em
// lotes (nunca `without_batch`, contrato §6.3). O que É reaproveitado é o
// SERVIÇO `listBatchCandidateAnimals` (contrato §7 — "reaproveitar, não duplicar").
// -----------------------------------------------------------------------------

import type { Dispatch, SetStateAction } from 'react';

import { useQuery } from '@tanstack/react-query';

import { useCustomGridQuery } from '@/hooks/useCustomGridQuery';

import { queryKey } from '@/constants/query-key';

import { listBatchCandidateAnimals } from '@/services/v2/Batches/batch-service';
import {
  getBatchTransferCreateOptions,
  listEligibleAnimals,
} from '@/services/v2/BatchTransfers/batch-transfer-service';

import type { PaginatedQueryProps } from '@/@types/pagination';
import type { BatchCandidateAnimal } from '@/@types/v2/Batches';
import type {
  BatchTransferCreateOptions,
  BatchTransferFilterForm,
  EligibleAnimal,
} from '@/@types/v2/BatchTransfers';

interface UseBatchTransfersListProps {
  paginatedQuery: PaginatedQueryProps;
  setPaginatedQuery: Dispatch<SetStateAction<PaginatedQueryProps<any>>>;
  filter?: BatchTransferFilterForm;
}

// Listagem paginada de animais elegíveis (contrato §5) — `useCustomGridQuery`
// (sem id de contexto pai), mirror `useBatchesList`.
export function useBatchTransfersList({
  paginatedQuery,
  setPaginatedQuery,
  filter,
}: UseBatchTransfersListProps) {
  return useCustomGridQuery<EligibleAnimal, BatchTransferFilterForm>({
    asyncFunction: listEligibleAnimals,
    queryKey: queryKey.batchTransfers.eligibleAnimals,
    paginatedQuery,
    setPaginatedQuery,
    filterQuery: [],
    filter: filter ?? ({} as BatchTransferFilterForm),
  });
}

// Lookups do filtro (Tarefa 26) e do cabeçalho do formulário (Tarefa 27) —
// `GET /batch-transfers/create-options`. Sem paginação real (1 objeto), por
// isso `useQuery` direto, não um dos hooks Grid/Form genéricos.
export function useBatchTransferCreateOptions() {
  return useQuery<BatchTransferCreateOptions>({
    queryKey: [queryKey.batchTransfers.createOptions],
    queryFn: async () => {
      const { data } = await getBatchTransferCreateOptions();
      return data;
    },
  });
}

interface UseEligibleCandidateAnimalsProps {
  /** Lote de ORIGEM selecionado no filtro do form (§6.3) — mutuamente exclusivo com `categoryUuids`. */
  batchUuid?: string;
  /** Categorias selecionadas no filtro do form — mutuamente exclusivo com `batchUuid`. */
  categoryUuids: string[];
}

// Picker de animais candidatos à transferência (contrato §6.3) — reaproveita
// o SERVIÇO `listBatchCandidateAnimals` (não o hook `useBatchCandidateAnimals`
// de Batches, ver nota de cabeçalho). 🔴 NUNCA `without_batch` — esta tela só
// transfere animais que JÁ estão em algum lote. Ativa só quando o usuário
// escolheu um Lote OU ao menos uma Categoria (mirror do gate
// `categoryUuids.length > 0` do form de Lote, adaptado à cascata desta tela).
export function useEligibleCandidateAnimals({
  batchUuid,
  categoryUuids,
}: UseEligibleCandidateAnimalsProps) {
  const sortedCategoryUuids = [...categoryUuids].sort();

  return useQuery<BatchCandidateAnimal[]>({
    queryKey: [
      queryKey.batchTransfers.eligibleAnimals,
      'candidates',
      batchUuid ?? null,
      sortedCategoryUuids,
    ],
    queryFn: () =>
      listBatchCandidateAnimals({
        category_uuids: sortedCategoryUuids,
        batch_uuid: batchUuid,
      }),
    enabled: !!batchUuid || sortedCategoryUuids.length > 0,
  });
}
