// src/pages/Operacional/Perdas/useLossAnimals.tsx
// -----------------------------------------------------------------------------
// Hooks de query do módulo de PERDAS — mesmo padrão de
// CausaMortePerda/useDeathLosses.tsx (CRUD-por-GUID + paginação real):
//   - useLossAnimalsList → useCustomGridQuery (listagem, SEM ID de contexto —
//     tenancy via header X-Farm-Id)
//   - useLossAnimalForm  → useCustomFormQueryByGuid (detalhe p/ formulário/
//     visualização)
// -----------------------------------------------------------------------------

import type { Dispatch, SetStateAction } from 'react';

import { useCustomFormQueryByGuid } from '@/hooks/useCustomFormQueryByGuid';
import { useCustomGridQuery } from '@/hooks/useCustomGridQuery';

import { queryKey } from '@/constants/query-key';

import {
  getLossAnimal,
  listLossAnimals,
} from '@/services/v2/Operacional/Pecuaria/lossAnimal-service';

import type { PaginatedQueryProps } from '@/@types/pagination';
import type {
  LossAnimalData,
  LossAnimalFilterRequest,
} from '@/@types/v2/Operacional/Pecuaria/lossAnimal';

interface UseLossAnimalsListProps {
  paginatedQuery: PaginatedQueryProps;
  setPaginatedQuery: Dispatch<SetStateAction<PaginatedQueryProps<any>>>;
  filter?: LossAnimalFilterRequest;
}

// Query de listagem de Perdas (SEM ID de contexto — useCustomGridQuery).
export function useLossAnimalsList({
  paginatedQuery,
  setPaginatedQuery,
  filter,
}: UseLossAnimalsListProps) {
  return useCustomGridQuery<LossAnimalData, LossAnimalFilterRequest>({
    asyncFunction: listLossAnimals,
    queryKey: queryKey.lossAnimals.lossAnimals,
    paginatedQuery,
    setPaginatedQuery,
    filterQuery: [],
    filter: filter ?? ({} as LossAnimalFilterRequest),
  });
}

interface UseLossAnimalFormProps {
  registrationId?: string;
  fillForm: (data: LossAnimalData, resetForce?: boolean) => void;
}

// Query de detalhe para preencher o formulário de edição/visualização (match
// por GUID) — mirror `useDeathLossForm`.
export function useLossAnimalForm({ registrationId, fillForm }: UseLossAnimalFormProps) {
  return useCustomFormQueryByGuid<LossAnimalData>({
    registrationId,
    queryKey: queryKey.lossAnimals.lossAnimal,
    asyncFunction: getLossAnimal,
    fillForm,
  });
}
