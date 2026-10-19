// src/pages/CadastrosBase/Produtos/Classes/useKinds.tsx
// -----------------------------------------------------------------------------
// Hooks de query do módulo de CLASSES DE PRODUTO (Kind) — mesmo padrão de
// Racas/useBreeds.tsx (CRUD-por-GUID mais recente equivalente):
//   - useKindsList → useCustomGridQuery (listagem, SEM ID de contexto)
//   - useKindForm  → useCustomFormQueryByGuid (detalhe p/ formulário, Lei 2)
//
// `KindFilterForm.category_uuid` é um filtro SERVER-SIDE — o `filter`
// repassado ao `useCustomGridQuery` aqui inclui `category_uuid` junto com
// `search`/`is_enabled`, indo direto na querystring real de `GET /kinds`.
// -----------------------------------------------------------------------------

import type { Dispatch, SetStateAction } from 'react';

import { useCustomFormQueryByGuid } from '@/hooks/useCustomFormQueryByGuid';
import { useCustomGridQuery } from '@/hooks/useCustomGridQuery';

import { queryKey } from '@/constants/query-key';

import { getKindByUuid, listKinds } from '@/services/v2/Kinds/kind-service';

import type { PaginatedQueryProps } from '@/@types/pagination';
import type { KindData, KindFilterForm, KindListItem } from '@/@types/v2/Kinds';

// Shape efetivamente enviado a `/kinds` — inclui `category_uuid` (server-side).
export interface KindListRequestFilter {
  search?: string;
  is_enabled?: '' | '1' | '0';
  category_uuid?: string;
}

interface UseKindsListProps {
  paginatedQuery: PaginatedQueryProps;
  setPaginatedQuery: Dispatch<SetStateAction<PaginatedQueryProps<any>>>;
  filter?: KindFilterForm;
}

// Query de listagem de Classes (SEM ID de contexto — `useCustomGridQuery`).
// `category_uuid` do filtro é repassado ao request (server-side).
export function useKindsList({ paginatedQuery, setPaginatedQuery, filter }: UseKindsListProps) {
  const requestFilter: KindListRequestFilter = {
    search: filter?.search,
    is_enabled: filter?.is_enabled,
    category_uuid: filter?.category_uuid,
  };

  return useCustomGridQuery<KindListItem, KindListRequestFilter>({
    asyncFunction: listKinds,
    queryKey: queryKey.kinds.list,
    paginatedQuery,
    setPaginatedQuery,
    filterQuery: [],
    filter: requestFilter,
  });
}

interface UseKindFormProps {
  registrationId?: string;
  fillForm: (data: KindData, resetForce?: boolean) => void;
}

// Query de detalhe para preencher o formulário de edição (match por GUID).
export function useKindForm({ registrationId, fillForm }: UseKindFormProps) {
  return useCustomFormQueryByGuid<KindData>({
    registrationId,
    queryKey: queryKey.kinds.detail,
    asyncFunction: getKindByUuid,
    fillForm,
  });
}
