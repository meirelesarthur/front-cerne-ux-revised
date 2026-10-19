// src/pages/Operacional/Sanitario/useSanitarios.tsx
// -----------------------------------------------------------------------------
// Hook de dados do módulo SANITÁRIO (Operacional > Pecuária > Manejo, F-062,
// TASK-SAN-FE-02) — listagem paginada real de servidor + filtro por
// `batch_uuid`/`user_uuid` (`san-screen-list`, `EP-SAN-01`), mirror
// `Weaning/useWeanings.tsx`/`Acasalamento/useAcasalamentos.tsx`
// (`useCustomGridQuery`, sem Zustand — fazenda ativa já vem do AuthContext
// via interceptor).
//
// ⚠️ Arquivo destinado a ser COMPARTILHADO com as Tarefas seguintes (27-32,
// contexto de formulário/cascatas/detalhe/relatório) — esta Tarefa só
// acrescenta o hook de listagem, nenhum outro arquivo desta pasta é tocado
// além dos 5 listados em `07-Tarefas_Frontend/26-...md`.
// -----------------------------------------------------------------------------

import type { Dispatch, SetStateAction } from 'react';

import { useCustomGridQuery } from '@/hooks/useCustomGridQuery';

import { queryKey } from '@/constants/query-key';

import { listSanitaries } from '@/services/v2/Sanitaries/sanitaries-service';

import type { PaginatedQueryProps } from '@/@types/pagination';
import type { SanitaryFilterRequest, SanitaryListItem } from '@/@types/v2/Sanitaries';

interface UseSanitariosListProps {
  paginatedQuery: PaginatedQueryProps;
  setPaginatedQuery: Dispatch<SetStateAction<PaginatedQueryProps<any>>>;
  filter?: SanitaryFilterRequest;
}

export function useSanitariosList({
  paginatedQuery,
  setPaginatedQuery,
  filter,
}: UseSanitariosListProps) {
  return useCustomGridQuery<SanitaryListItem, SanitaryFilterRequest>({
    asyncFunction: listSanitaries,
    queryKey: queryKey.sanitary.sanitaries,
    paginatedQuery,
    setPaginatedQuery,
    filterQuery: [],
    filter: filter ?? ({} as SanitaryFilterRequest),
  });
}
