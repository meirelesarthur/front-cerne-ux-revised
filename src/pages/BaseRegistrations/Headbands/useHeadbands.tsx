// src/pages/BaseRegistrations/Headbands/useHeadbands.tsx
// -----------------------------------------------------------------------------
// Hooks de query do módulo de TESTEIRAS (Headband) — TASK-HB-FE-03. Mirror de
// `CadastrosBase/CentroCusto/useCostCenters.tsx` / `CadastrosBase/Afiliados/
// useAfiliados.tsx`:
//   - useHeadbandsList → useCustomGridQuery (listagem paginada + filtros,
//     catálogo GLOBAL, SEM X-Farm-Id/ID de contexto)
//
// `TASK-HB-FE-05` acrescenta `useHeadbandPartnersChecklist` e `TASK-HB-FE-06`
// acrescenta `useHeadbandForm` neste mesmo arquivo (ficha da tarefa) — não um
// wrapper isolado por hook.
// -----------------------------------------------------------------------------

import type { Dispatch, SetStateAction } from 'react';

import { useCustomGridQuery } from '@/hooks/useCustomGridQuery';

import { queryKey } from '@/constants/query-key';

import { listHeadbands } from '@/services/v2/BaseRegistrations/headband-service';

import type { PaginatedQueryProps } from '@/@types/pagination';
import type { HeadbandListItem, HeadbandsFilterForm } from '@/@types/v2/BaseRegistrations/headband';

interface UseHeadbandsListProps {
  paginatedQuery: PaginatedQueryProps;
  setPaginatedQuery: Dispatch<SetStateAction<PaginatedQueryProps<any>>>;
  filter?: HeadbandsFilterForm;
}

// Query de listagem paginada de Testeiras (filtros `type`/`partner_uuid` vão
// como query params — ver `ListHeadbandsParams` em `headband-service.ts`).
export function useHeadbandsList({
  paginatedQuery,
  setPaginatedQuery,
  filter,
}: UseHeadbandsListProps) {
  return useCustomGridQuery<HeadbandListItem, HeadbandsFilterForm>({
    asyncFunction: listHeadbands,
    queryKey: queryKey.baseRegistrations.headbands,
    paginatedQuery,
    setPaginatedQuery,
    filterQuery: [],
    filter: filter ?? ({} as HeadbandsFilterForm),
  });
}
