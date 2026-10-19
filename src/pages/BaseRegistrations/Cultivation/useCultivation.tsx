// src/pages/BaseRegistrations/Cultivation/useCultivation.tsx
// -----------------------------------------------------------------------------
// Hooks de query do módulo de CULTURA/VARIEDADE (Cultivation).
//
// DESVIO DOCUMENTADO (ver TASK-CV-04a): `useCultivationTree`/
// `useCultivationActiveOptions` usam `useQuery` DIRETO do TanStack Query —
// NÃO a família `useCustomGridQuery*` — porque `GET /cultivations/tree` e
// `GET /cultivations/active` não são paginados (Seção 3 do
// Cultivation-contrato.md). A família Grid do projeto é desenhada em torno de
// `paginatedQuery`/`meta.pagination`, que estes endpoints não têm. Mesmo
// padrão já usado por `usePermissionTree`
// (src/pages/CadastrosBase/Perfil/useRoles.tsx) para dado hierárquico
// não-paginado.
//
// Busca por nome é filtrada CLIENT-SIDE (ver index.tsx) sobre o array já
// carregado — sem novo request por tecla.
//
// `useCultivationForm` (TASK-CV-04b) segue o padrão real do projeto
// (`useRoleForm`, Perfil/useRoles.tsx) — `useCustomFormQueryByGuid`, NÃO
// `useCustomFormQueryById` (que não existe neste repo).
// -----------------------------------------------------------------------------

import { useQuery } from "@tanstack/react-query";

import type {
  CultivationData,
  CultivationTreeNode,
} from "@/@types/v2/Cultivation/cultivation";
import { queryKey } from "@/constants/query-key";
import { useCustomFormQueryByGuid } from "@/hooks/useCustomFormQueryByGuid";
import {
  getCultivationActive,
  getCultivationById,
  getCultivationTree,
} from "@/services/v2/Cultivation/cultivation-service";

/** Árvore completa de Cultura/Variedade do tenant ativo (não-paginada). */
export function useCultivationTree() {
  return useQuery({
    queryKey: [queryKey.cultivation.tree],
    queryFn: async () => {
      const response = await getCultivationTree();
      return (response.data ?? []) as CultivationTreeNode[];
    },
  });
}

/** Raízes + filhos habilitados (1 nível, DA-CV-09) — popula o Select de
 *  Cultura-pai do formulário. O componente ainda filtra client-side para
 *  mostrar só as raízes (`type === "cultura"`) — MAX_DEPTH=2 (DA-CV-05.5):
 *  uma Variedade nunca pode ser pai. */
export function useCultivationActiveOptions() {
  return useQuery({
    queryKey: [queryKey.cultivation.active],
    queryFn: async () => {
      const response = await getCultivationActive();
      return (response.data ?? []) as CultivationTreeNode[];
    },
  });
}

interface UseCultivationFormProps {
  registrationId?: string;
  fillForm: (data: CultivationData, resetForce?: boolean) => void;
}

/** Query de detalhe para preencher o formulário de edição (match por GUID) —
 *  mesmo padrão de `useRoleForm` (Perfil/useRoles.tsx). */
export function useCultivationForm({
  registrationId,
  fillForm,
}: UseCultivationFormProps) {
  return useCustomFormQueryByGuid<CultivationData>({
    registrationId,
    queryKey: queryKey.cultivation.detail,
    asyncFunction: getCultivationById,
    fillForm,
  });
}
