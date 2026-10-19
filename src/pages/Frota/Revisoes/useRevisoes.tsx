// src/pages/Frota/Revisoes/useRevisoes.tsx
// -----------------------------------------------------------------------------
// Hooks de query do módulo de REVISÕES AGENDADAS — mesmo padrão de
// CadastrosBase/Estados/useStates.tsx.
//
// TASK-REVAG-FE-01 cobre só a LISTAGEM (useScheduledReviewsList) — não há
// tela de detalhe/formulário (read-only puro). Variante SEM ID de contexto
// (`useCustomGridQuery`) — a listagem é global dentro da fazenda ativa, sem
// filtro (endpoint sem filter_manifest, contrato §FE-05).
// -----------------------------------------------------------------------------

import type { Dispatch, SetStateAction } from 'react';

import { useCustomGridQuery } from '@/hooks/useCustomGridQuery';

import { queryKey } from '@/constants/query-key';

import { listScheduledReviews } from '@/services/v2/ScheduledReviews/scheduled-review-service';

import type { PaginatedQueryProps } from '@/@types/pagination';
import type { ScheduledReviewListItem } from '@/@types/v2/ScheduledReviews';

interface UseScheduledReviewsListProps {
  paginatedQuery: PaginatedQueryProps;
  setPaginatedQuery: Dispatch<SetStateAction<PaginatedQueryProps<any>>>;
}

// Query de listagem de revisões agendadas. Usa `useCustomGridQuery` (família
// Grid padrão do projeto, variante SEM ID de contexto) com paginação REAL —
// o adaptador `listScheduledReviews` lê o `meta` real do backend
// (`ApiResponse::paginated`) e converte para o shape `ResponsePagination` que
// este hook espera, mesmo racional de `useStatesList`. `filterQuery: []` e
// `filter: {}` — o endpoint não aceita nenhum filtro (TGT-07).
export function useScheduledReviewsList({
  paginatedQuery,
  setPaginatedQuery,
}: UseScheduledReviewsListProps) {
  return useCustomGridQuery<ScheduledReviewListItem, Record<string, never>>({
    asyncFunction: listScheduledReviews,
    queryKey: queryKey.scheduledReviews.scheduledReviews,
    paginatedQuery,
    setPaginatedQuery,
    filterQuery: [],
    filter: {},
  });
}
