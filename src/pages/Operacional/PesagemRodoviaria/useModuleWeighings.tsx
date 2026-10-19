// src/pages/Operacional/PesagemRodoviaria/useModuleWeighings.tsx
// -----------------------------------------------------------------------------
// Hook de dados da LISTAGEM de Pesagem Rodoviária (ModuleWeighing, FE-SCR-01,
// TASK-MWG-FE-02) — mirror `Operacional/Pesagem/useWeighings.tsx` (feature
// irmã ANIMAL, F-071): `useCustomGridQuery` sem Zustand, fazenda ativa já
// resolvida pelo interceptor de `@/services/api.ts` (header `X-Farm-Id`).
//
// PINO CRÍTICO: `moduleWeighing` ≠ `weighing` (pesagem animal) — namespace de
// queryKey/i18n deliberadamente disjunto (`CONTRATO-TELA-PESAGEM-FE §1`).
// -----------------------------------------------------------------------------

import type { Dispatch, SetStateAction } from 'react';

import { useCustomGridQuery } from '@/hooks/useCustomGridQuery';

import { queryKey } from '@/constants/query-key';

import { listModuleWeighings } from '@/services/v2/ModuleWeighing/module-weighing-service';

import type { PaginatedQueryProps } from '@/@types/pagination';
import type {
  ModuleWeighingFilterRequest,
  ModuleWeighingListItem,
} from '@/@types/v2/ModuleWeighing/module-weighing';

interface UseModuleWeighingsListProps {
  paginatedQuery: PaginatedQueryProps;
  setPaginatedQuery: Dispatch<SetStateAction<PaginatedQueryProps<any>>>;
  filter?: ModuleWeighingFilterRequest;
}

export function useModuleWeighingsList({
  paginatedQuery,
  setPaginatedQuery,
  filter,
}: UseModuleWeighingsListProps) {
  return useCustomGridQuery<ModuleWeighingListItem, ModuleWeighingFilterRequest>({
    asyncFunction: listModuleWeighings,
    queryKey: queryKey.moduleWeighing.moduleWeighings,
    paginatedQuery,
    setPaginatedQuery,
    filterQuery: [],
    filter: filter ?? ({} as ModuleWeighingFilterRequest),
  });
}
