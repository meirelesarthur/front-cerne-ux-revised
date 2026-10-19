// src/pages/CadastrosBase/Perfil/useRoles.tsx
// -----------------------------------------------------------------------------
// Hooks de query do módulo de PERFIS (Roles RBAC) — padrão da camada de
// exemplo (src/_examples/hooks/useResources.tsx):
//   - useRolesList     → useCustomGridQuery (listagem paginada + filtro search)
//   - useRoleForm      → useCustomFormQueryByGuid (detalhe p/ formulário)
//   - usePermissionTree→ useQuery direto (árvore estática, cacheada)
// -----------------------------------------------------------------------------

import type { Dispatch, SetStateAction } from "react";

import { useQuery } from "@tanstack/react-query";

import type { PaginatedQueryProps } from "@/@types/pagination";
import type {
  RoleDetail,
  RoleFilterForm,
  RoleListItem,
} from "@/@types/v2/Roles";
import { queryKey } from "@/constants/query-key";
import { useCustomFormQueryByGuid } from "@/hooks/useCustomFormQueryByGuid";
import { useCustomGridQuery } from "@/hooks/useCustomGridQuery";
import { getPermissionTree } from "@/services/v2/Roles/permission-service";
import { getRole, listRoles } from "@/services/v2/Roles/role-service";

interface UseRolesListProps {
  paginatedQuery: PaginatedQueryProps;
  setPaginatedQuery: Dispatch<SetStateAction<PaginatedQueryProps<any>>>;
  filter?: RoleFilterForm;
}

/** Query de listagem paginada de perfis (filtro `search` vai como query param). */
export function useRolesList({
  paginatedQuery,
  setPaginatedQuery,
  filter,
}: UseRolesListProps) {
  return useCustomGridQuery<RoleListItem, RoleFilterForm>({
    asyncFunction: listRoles,
    queryKey: queryKey.roles.list,
    paginatedQuery,
    setPaginatedQuery,
    filterQuery: [],
    filter: filter ?? ({} as RoleFilterForm),
  });
}

interface UseRoleFormProps {
  registrationId?: string;
  fillForm: (data: RoleDetail, resetForce?: boolean) => void;
}

/** Query de detalhe para preencher o formulário de edição (match por GUID). */
export function useRoleForm({ registrationId, fillForm }: UseRoleFormProps) {
  return useCustomFormQueryByGuid<RoleDetail>({
    registrationId,
    queryKey: queryKey.roles.detail,
    asyncFunction: getRole,
    fillForm,
  });
}

/**
 * Árvore de permissões (GET /permissions/tree). Dado praticamente estático
 * (~980 folhas) — cache de 5 minutos para não rebuscar a cada montagem.
 */
export function usePermissionTree() {
  return useQuery({
    queryKey: [queryKey.roles.permissionTree],
    queryFn: async () => {
      const response = await getPermissionTree();
      return response.data;
    },
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: false,
  });
}
