// src/pages/Operacional/Separations/useSeparations.tsx
// -----------------------------------------------------------------------------
// Hooks de query do módulo de APARTAÇÃO (Separation) — mesmo padrão de
// `Operacional/Nascimentos/useBirthAnimals.tsx`:
//   - useSeparationsList → useCustomGridQuery (listagem paginada real de
//     servidor + 1 filtro do drawer — Lote, TASK-APART-FE-01).
//   - useSeparationDetail → useCustomFormQueryByGuid (hidratação read-only da
//     tela de Detalhe — sem `useForm`, mesmo racional de
//     `useBirthAnimalDetail`/`useMovementSaleDetail`).
//
// Sem Zustand — fazenda ativa já vem do AuthContext via interceptor;
// paginação/filtro por `userPaginatedQuery`.
// -----------------------------------------------------------------------------

import type { Dispatch, SetStateAction } from 'react';

import { useCustomFormQueryByGuid } from '@/hooks/useCustomFormQueryByGuid';
import { useCustomGridQuery } from '@/hooks/useCustomGridQuery';

import { queryKey } from '@/constants/query-key';

import { getSeparationByUuid, listSeparations } from '@/services/v2/Separations/separation-service';

import type { PaginatedQueryProps } from '@/@types/pagination';
import type {
  SeparationDetail,
  SeparationFilterRequest,
  SeparationListItem,
} from '@/@types/v2/Separations';

interface UseSeparationsListProps {
  paginatedQuery: PaginatedQueryProps;
  setPaginatedQuery: Dispatch<SetStateAction<PaginatedQueryProps<any>>>;
  filter?: SeparationFilterRequest;
}

export function useSeparationsList({
  paginatedQuery,
  setPaginatedQuery,
  filter,
}: UseSeparationsListProps) {
  return useCustomGridQuery<SeparationListItem, SeparationFilterRequest>({
    asyncFunction: listSeparations,
    queryKey: queryKey.separations.separationsList,
    paginatedQuery,
    setPaginatedQuery,
    filterQuery: [],
    filter: filter ?? ({} as SeparationFilterRequest),
  });
}

// Tela de VISUALIZAÇÃO read-only (contrato de tela §6) — SEM `useForm` (mirror
// `BirthAnimalDetalhe.tsx`/`RomaneioDetalhe.tsx`): a tela lê `.data` direto,
// `fillForm` é um no-op deliberado (nunca chamado de fato em modo leitura pura).
export function useSeparationDetail(separationUuid: string | undefined) {
  return useCustomFormQueryByGuid<SeparationDetail>({
    registrationId: separationUuid,
    asyncFunction: getSeparationByUuid,
    fillForm: () => undefined,
    queryKey: queryKey.separations.separation,
  });
}

interface UseSeparationFormProps {
  registrationId?: string;
  fillForm: (data: SeparationDetail, resetForce?: boolean) => void;
}

// Query de detalhe para popular o formulário de edição (TASK-APART-FE-02,
// contrato §7) — `useCustomFormQueryByGuid` (mesma variante já em uso por
// `useSeparationDetail` acima, mirror `useBirthAnimalForm`).
export function useSeparationForm({ registrationId, fillForm }: UseSeparationFormProps) {
  return useCustomFormQueryByGuid<SeparationDetail>({
    registrationId,
    queryKey: queryKey.separations.separation,
    asyncFunction: getSeparationByUuid,
    fillForm,
  });
}
