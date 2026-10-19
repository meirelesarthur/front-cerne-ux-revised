// src/pages/CadastrosBase/PlanAccount/usePlanAccounts.tsx
// -----------------------------------------------------------------------------
// Hooks de query do módulo de PLANO DE CONTAS — mesmo padrão de
// CentroCusto/useCostCenters.tsx:
//   - usePlanAccountsList     → useCustomGridQuery (listagem paginada + filtros, TASK-PA-03a)
//   - usePlanAccountForm      → useCustomFormQueryByGuid (detalhe p/ formulário, TASK-PA-03b)
//   - useFinancialCategoryTree→ useQuery direto (árvore quase-estática, cacheada,
//     TASK-PA-16 — mesmo racional de `usePermissionTree` em `Perfil/useRoles.tsx`,
//     vivendo dentro do hook-file da PÁGINA que a consome)
// -----------------------------------------------------------------------------

import type { Dispatch, SetStateAction } from 'react';

import { useQuery } from '@tanstack/react-query';

import { useCustomFormQueryByGuid } from '@/hooks/useCustomFormQueryByGuid';
import { useCustomGridQuery } from '@/hooks/useCustomGridQuery';

import { queryKey } from '@/constants/query-key';

import { getFinancialCategoryTree } from '@/services/v2/FinancialCategories/financial-category-service';
import {
  getPlanAccount,
  getPlanAccountCodePreview,
  listPlanAccounts,
} from '@/services/v2/PlanAccounts/plan-account-service';

import type { PaginatedQueryProps } from '@/@types/pagination';
import type {
  PlanAccountDetail,
  PlanAccountFilterForm,
  PlanAccountListItem,
} from '@/@types/v2/PlanAccounts';

interface UsePlanAccountsListProps {
  paginatedQuery: PaginatedQueryProps;
  setPaginatedQuery: Dispatch<SetStateAction<PaginatedQueryProps<any>>>;
  filter?: PlanAccountFilterForm;
}

// Query de listagem paginada do Plano de Contas (filtros `search`/`condition`/
// `class`/`type`/`is_enabled`/`parent_uuid` vão como query params — ver
// ListPlanAccountsParams).
export function usePlanAccountsList({
  paginatedQuery,
  setPaginatedQuery,
  filter,
}: UsePlanAccountsListProps) {
  return useCustomGridQuery<PlanAccountListItem, PlanAccountFilterForm>({
    asyncFunction: listPlanAccounts,
    queryKey: queryKey.planAccounts.list,
    paginatedQuery,
    setPaginatedQuery,
    filterQuery: [],
    filter: filter ?? ({} as PlanAccountFilterForm),
  });
}

interface UsePlanAccountFormProps {
  registrationId?: string;
  fillForm: (data: PlanAccountDetail, resetForce?: boolean) => void;
}

// Query de detalhe para preencher o formulário de criação/edição (match por
// GUID) — TASK-PA-03b. Reaproveitada também para o modo "criar subconta"
// (2ª chamada, antecessor pré-fixado — ver `CreateOrUpdatePlanAccount.tsx`),
// mesmo padrão de `parentPreviewQuery` do `CostCenter`.
export function usePlanAccountForm({ registrationId, fillForm }: UsePlanAccountFormProps) {
  return useCustomFormQueryByGuid<PlanAccountDetail>({
    registrationId,
    queryKey: queryKey.planAccounts.detail,
    asyncFunction: getPlanAccount,
    fillForm,
  });
}

interface UsePlanAccountCodePreviewProps {
  enabled: boolean;
  parentUuid?: string;
}

export function usePlanAccountCodePreview({ enabled, parentUuid }: UsePlanAccountCodePreviewProps) {
  return useQuery({
    queryKey: [queryKey.planAccounts.codePreview, parentUuid ?? null],
    queryFn: async () => {
      const response = await getPlanAccountCodePreview(parentUuid);
      return response.data;
    },
    enabled,
    staleTime: 0,
    gcTime: 0,
    refetchOnWindowFocus: false,
    retry: false,
  });
}

/**
 * Árvore de Categorias Financeiras (`GET /financial-categories/tree`,
 * TASK-PA-16) — dado quase-estático por tenant, mesmos parâmetros de
 * `usePermissionTree` (cache de 5 minutos, sem refetch agressivo).
 * @return {UseQueryResult<FinancialCategoryTreeNode[]>} query TanStack com a árvore em `data`.
 */
export function useFinancialCategoryTree() {
  return useQuery({
    queryKey: [queryKey.financialCategories.tree],
    queryFn: async () => {
      const response = await getFinancialCategoryTree();
      return response.data;
    },
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: false,
  });
}
