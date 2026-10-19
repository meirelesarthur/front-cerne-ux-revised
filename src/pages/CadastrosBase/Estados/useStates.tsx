// src/pages/CadastrosBase/Estados/useStates.tsx
// -----------------------------------------------------------------------------
// Hooks de query do módulo de ESTADOS — mesmo padrão de
// CadastrosBase/Cidades/useCities.tsx.
//
// TASK-FE-021 cobre só a LISTAGEM (useStatesList) — não há tela de detalhe/
// formulário de Estado (read-only puro, ver TASK-FE-022).
//
// AJUSTE-FE-ESTADOS-001 (2026-07-23): convertido para paginação REAL server-side
// (o back passou a devolver `ApiResponse::paginated` com meta real, em paralelo).
// `useCustomGridQuery` já operava corretamente (paginação vem de fora, do
// adaptador `listStates` em state-service.ts) — nenhuma mudança estrutural
// necessária neste arquivo além do comentário abaixo.
// -----------------------------------------------------------------------------

import type { Dispatch, SetStateAction } from 'react';

import { useCustomGridQuery } from '@/hooks/useCustomGridQuery';

import { queryKey } from '@/constants/query-key';

import { listStates } from '@/services/v2/States/state-service';

import type { PaginatedQueryProps } from '@/@types/pagination';
import type { StateFilterForm, StateListItem } from '@/@types/v2/States';

interface UseStatesListProps {
  paginatedQuery: PaginatedQueryProps;
  setPaginatedQuery: Dispatch<SetStateAction<PaginatedQueryProps<any>>>;
  filter?: StateFilterForm;
}

// Query de listagem de estados (único filtro `search` vai como query param, sem
// consumidor nesta Tarefa — TASK-FE-022 não tem drawer de filtro). Usa
// `useCustomGridQuery` (família Grid padrão do projeto) com paginação REAL —
// o adaptador `listStates` lê o `meta` real do backend (`ApiResponse::paginated`)
// e converte para o shape `ResponsePagination` que este hook espera, mesmo
// racional de `useCitiesList` (AJUSTE-FE-ESTADOS-001).
export function useStatesList({ paginatedQuery, setPaginatedQuery, filter }: UseStatesListProps) {
  return useCustomGridQuery<StateListItem, StateFilterForm>({
    asyncFunction: listStates,
    queryKey: queryKey.states.list,
    paginatedQuery,
    setPaginatedQuery,
    filterQuery: [],
    filter: filter ?? ({} as StateFilterForm),
  });
}
