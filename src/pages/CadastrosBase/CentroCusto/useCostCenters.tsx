// src/pages/CadastrosBase/CentroCusto/useCostCenters.tsx
// -----------------------------------------------------------------------------
// Hooks de query do módulo de CENTROS DE CUSTO — mesmo padrão de
// Perfil/useRoles.tsx (único CRUD já migrado neste projeto pelo pipeline
// formal):
//   - useCostCentersList → useCustomGridQuery (listagem paginada + filtros)
//   - useCostCenterForm  → useCustomFormQueryByGuid (detalhe p/ formulário)
//   - useCostCenterTree  → useQuery direto (árvore quase-estática, cacheada,
//     TASK-BE-351/TASK-FE-317 — mirror exato de `useFinancialCategoryTree`
//     em `PlanAccount/usePlanAccounts.tsx`, consumida cross-page pelo form de
//     Categoria Financeira, sentido inverso do já feito em TASK-FE-316)
// -----------------------------------------------------------------------------

import type { Dispatch, SetStateAction } from 'react';

import { useQuery } from '@tanstack/react-query';

import { useCustomFormQueryByGuid } from '@/hooks/useCustomFormQueryByGuid';
import { useCustomGridQuery } from '@/hooks/useCustomGridQuery';

import { queryKey } from '@/constants/query-key';

import {
  getCostCenter,
  getCostCenterTree,
  listCostCenters,
} from '@/services/v2/CostCenters/cost-center-service';

import type { PaginatedQueryProps } from '@/@types/pagination';
import type {
  CostCenterDetail,
  CostCenterFilterForm,
  CostCenterListItem,
} from '@/@types/v2/CostCenters';

interface UseCostCentersListProps {
  paginatedQuery: PaginatedQueryProps;
  setPaginatedQuery: Dispatch<SetStateAction<PaginatedQueryProps<any>>>;
  filter?: CostCenterFilterForm;
}

// Query de listagem paginada de centros de custo (filtros `search`/`type`/
// `is_enabled` vão como query params — ver ListCostCentersParams).
export function useCostCentersList({
  paginatedQuery,
  setPaginatedQuery,
  filter,
}: UseCostCentersListProps) {
  return useCustomGridQuery<CostCenterListItem, CostCenterFilterForm>({
    asyncFunction: listCostCenters,
    queryKey: queryKey.costCenters.list,
    paginatedQuery,
    setPaginatedQuery,
    filterQuery: [],
    filter: filter ?? ({} as CostCenterFilterForm),
  });
}

interface UseCostCenterFormProps {
  registrationId?: string;
  fillForm: (data: CostCenterDetail, resetForce?: boolean) => void;
}

// Query de detalhe para preencher o formulário de edição (match por GUID).
export function useCostCenterForm({ registrationId, fillForm }: UseCostCenterFormProps) {
  return useCustomFormQueryByGuid<CostCenterDetail>({
    registrationId,
    queryKey: queryKey.costCenters.detail,
    asyncFunction: getCostCenter,
    fillForm,
  });
}

interface UseCostCenterTreeParams {
  /**
   * TASK-FE-1087 — opt-in, mirror de `GetCostCenterTreeParams.onlyTopLevel`
   * (`cost-center-service.ts`). Default `false`/AUSENTE preserva o
   * comportamento HISTÓRICO byte-a-byte (árvore completa) — é a chamada que
   * `CentroCusto/useCostCenters.tsx`'s outros consumidores e o card de
   * Categorias Financeiras do Plano de Contas continuam fazendo, sem tocar
   * neste arquivo. `true` é usado SÓ por `CreateOrUpdateFinancialCategory
   * .tsx` (campo "Centros de Custo vinculados") para listar/selecionar
   * apenas os nós de topo.
   *
   * A query-key INCLUI `onlyTopLevel` (`[queryKey.costCenters.tree,
   * onlyTopLevel]`) — as duas variantes têm o MESMO `staleTime` de 5min;
   * sem o parâmetro na chave elas colidiriam no cache do TanStack Query
   * (mesma chave `'cost-centers-tree'` para respostas DIFERENTES), e abrir
   * Centro de Custo e depois Categoria Financeira (ou vice-versa) exibiria a
   * lista errada até o cache expirar.
   */
  onlyTopLevel?: boolean;
}

/**
 * Árvore de Centros de Custo (`GET /cost-centers/tree`, TASK-BE-351) — dado
 * quase-estático por tenant, mesmos parâmetros de `useFinancialCategoryTree`
 * (cache de 5 minutos, sem refetch agressivo). Consumida cross-page por
 * `CreateOrUpdateFinancialCategory.tsx` (TASK-FE-317, campo "Centros de
 * Custo vinculados"; TASK-FE-1087 acrescenta `onlyTopLevel`).
 * @return {UseQueryResult<CostCenterTreeNode[]>} query TanStack com a árvore em `data`.
 */
export function useCostCenterTree({ onlyTopLevel = false }: UseCostCenterTreeParams = {}) {
  return useQuery({
    queryKey: [queryKey.costCenters.tree, onlyTopLevel],
    queryFn: async () => {
      const response = await getCostCenterTree({ onlyTopLevel });
      return response.data;
    },
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: false,
  });
}
