// src/pages/CadastrosBase/Usuarios/useUsuario.tsx
// -----------------------------------------------------------------------------
// Hooks de query do módulo de USUÁRIOS (User) — TASK-FE-804, mirror EXATO de
// `useMarkers.tsx`/`useFunctions.tsx`:
//   - useUsersList → useCustomGridQuery (listagem paginada REAL de servidor +
//     filtros)
//   - useUserForm  → useCustomFormQueryByGuid (detalhe p/ formulário, NÃO
//     `useCustomFormQueryById` — achado documentado em `useFunctions.tsx`: é
//     o hook REAL e dominante em todo `CadastrosBase/*` para forms
//     create/edit por GUID neste repositório)
//
// Consumidos pelas telas de TASK-FE-805 (listagem) e TASK-FE-811 (formulário).
// -----------------------------------------------------------------------------

import type { Dispatch, SetStateAction } from 'react';

import { useCustomFormQueryByGuid } from '@/hooks/useCustomFormQueryByGuid';
import { useCustomGridQuery } from '@/hooks/useCustomGridQuery';

import { queryKey } from '@/constants/query-key';

import { getUser, listUsers } from '@/services/v2/Users/user-service';

import type { PaginatedQueryProps } from '@/@types/pagination';
import type { UserDetail, UserFilterForm, UserListItem } from '@/@types/v2/Users';

interface UseUsersListProps {
  paginatedQuery: PaginatedQueryProps;
  setPaginatedQuery: Dispatch<SetStateAction<PaginatedQueryProps<any>>>;
  filter?: UserFilterForm;
}

// Query de listagem paginada de usuários (filtros `search`/`role_uuid`/
// `is_active`/`online`/`inactive_days`/`tenant_uuid`/`plan`/`tenant_status`
// vão como query params — ver ListUsersParams). Paginação REAL de servidor
// (default 10/página) — mesmo shape de `useMarkersList`.
export function useUsersList({ paginatedQuery, setPaginatedQuery, filter }: UseUsersListProps) {
  return useCustomGridQuery<UserListItem, UserFilterForm>({
    asyncFunction: listUsers,
    queryKey: queryKey.users.usersList,
    paginatedQuery,
    setPaginatedQuery,
    filterQuery: [],
    filter: filter ?? ({} as UserFilterForm),
  });
}

interface UseUserFormProps {
  registrationId?: string;
  fillForm: (data: UserDetail, resetForce?: boolean) => void;
}

// Query de detalhe para preencher o formulário de edição (match por GUID).
export function useUserForm({ registrationId, fillForm }: UseUserFormProps) {
  return useCustomFormQueryByGuid<UserDetail>({
    registrationId,
    queryKey: queryKey.users.user,
    asyncFunction: getUser,
    fillForm,
  });
}
