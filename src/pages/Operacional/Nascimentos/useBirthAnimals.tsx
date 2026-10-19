// src/pages/Operacional/Nascimentos/useBirthAnimals.tsx
// -----------------------------------------------------------------------------
// Hooks de query do módulo de NASCIMENTOS (BirthAnimal) — mesmo padrão de
// `Operacional/VendaAnimais/useMovementSales.tsx`/`Operacional/Romaneios/useRomaneios.tsx`:
//   - useBirthAnimalsList → useCustomGridQuery (listagem paginada real de
//     servidor + 4 filtros do drawer, TASK-NASC-FE-01).
//   - useBirthAnimalDetail → useCustomFormQueryByGuid (hidratação read-only da
//     tela de Detalhe — sem `useForm`, mesmo racional de
//     `useTransferDetail`/`useMovementSaleDetail`).
//
// Sem Zustand — fazenda ativa já vem do AuthContext via interceptor;
// paginação/filtro por `userPaginatedQuery`.
// -----------------------------------------------------------------------------

import type { Dispatch, SetStateAction } from 'react';

import { useCustomFormQueryByGuid } from '@/hooks/useCustomFormQueryByGuid';
import { useCustomGridQuery } from '@/hooks/useCustomGridQuery';

import { queryKey } from '@/constants/query-key';

import {
  getBirthAnimalByUuid,
  listBirthAnimals,
} from '@/services/v2/BirthAnimals/birth-animal-service';

import type { PaginatedQueryProps } from '@/@types/pagination';
import type {
  BirthAnimalDetail,
  BirthAnimalFilterForm,
  BirthAnimalListItem,
} from '@/@types/v2/BirthAnimals';

interface UseBirthAnimalsListProps {
  paginatedQuery: PaginatedQueryProps;
  setPaginatedQuery: Dispatch<SetStateAction<PaginatedQueryProps<any>>>;
  filter?: BirthAnimalFilterForm;
}

export function useBirthAnimalsList({
  paginatedQuery,
  setPaginatedQuery,
  filter,
}: UseBirthAnimalsListProps) {
  return useCustomGridQuery<BirthAnimalListItem, BirthAnimalFilterForm>({
    asyncFunction: listBirthAnimals,
    queryKey: queryKey.birthAnimals.birthAnimalsList,
    paginatedQuery,
    setPaginatedQuery,
    filterQuery: [],
    filter: filter ?? ({} as BirthAnimalFilterForm),
  });
}

// Tela de VISUALIZAÇÃO read-only (contrato de tela §6) — SEM `useForm` (mirror
// `RomaneioDetalhe.tsx`/`MovementSaleDetalhe.tsx`): a tela lê `.data` direto,
// `fillForm` é um no-op deliberado (nunca chamado de fato em modo leitura pura).
export function useBirthAnimalDetail(birthAnimalUuid: string | undefined) {
  return useCustomFormQueryByGuid<BirthAnimalDetail>({
    registrationId: birthAnimalUuid,
    asyncFunction: getBirthAnimalByUuid,
    fillForm: () => undefined,
    queryKey: queryKey.birthAnimals.birthAnimal,
  });
}

interface UseBirthAnimalFormProps {
  registrationId?: string;
  fillForm: (data: BirthAnimalDetail, resetForce?: boolean) => void;
}

// Query de detalhe para popular o formulário de edição (TASK-NASC-FE-02,
// contrato §7) — `useCustomFormQueryByGuid` (mesma variante já em uso por
// `useBirthAnimalDetail` acima, convenção deste módulo — diferente de
// `useCustomFormQueryById` usado por `CadastrosBase/Rebanho/useAnimal.tsx`).
export function useBirthAnimalForm({ registrationId, fillForm }: UseBirthAnimalFormProps) {
  return useCustomFormQueryByGuid<BirthAnimalDetail>({
    registrationId,
    queryKey: queryKey.birthAnimals.birthAnimal,
    asyncFunction: getBirthAnimalByUuid,
    fillForm,
  });
}
