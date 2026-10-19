// src/pages/Operacional/Pesagem/useWeighings.tsx
// -----------------------------------------------------------------------------
// Hook de dados do módulo PESAGEM (Operacional > Pecuária > Manejo, F-071,
// TASK-PES-FE-02) — listagem paginada real de servidor + filtro por
// `batch_uuid`/`category_uuid`/`user_uuid` (`pes-screen-list`, `EP-PES-01`),
// mirror `Sanitario/useSanitarios.tsx`/`Weaning/useWeanings.tsx`
// (`useCustomGridQuery`, sem Zustand — fazenda ativa já vem do AuthContext
// via interceptor).
//
// ⚠️ Arquivo destinado a ser COMPARTILHADO com as Tarefas seguintes (37-40,
// contexto de formulário/cascatas/detalhe) — esta Tarefa só acrescenta o hook
// de listagem, nenhum outro arquivo desta pasta é tocado além dos 4 listados
// em `07-Tarefas_Frontend/35-...md`.
// -----------------------------------------------------------------------------

import type { Dispatch, SetStateAction } from 'react';

import { useCustomGridQuery } from '@/hooks/useCustomGridQuery';

import { queryKey } from '@/constants/query-key';

import { listWeighings } from '@/services/v2/Weighing/weighing-service';

import type { PaginatedQueryProps } from '@/@types/pagination';
import type { WeighingFilterRequest, WeighingListItem } from '@/@types/v2/Weighing';

interface UseWeighingsListProps {
  paginatedQuery: PaginatedQueryProps;
  setPaginatedQuery: Dispatch<SetStateAction<PaginatedQueryProps<any>>>;
  filter?: WeighingFilterRequest;
}

export function useWeighingsList({
  paginatedQuery,
  setPaginatedQuery,
  filter,
}: UseWeighingsListProps) {
  return useCustomGridQuery<WeighingListItem, WeighingFilterRequest>({
    asyncFunction: listWeighings,
    queryKey: queryKey.weighing.weighings,
    paginatedQuery,
    setPaginatedQuery,
    filterQuery: [],
    filter: filter ?? ({} as WeighingFilterRequest),
  });
}
