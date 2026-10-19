// src/pages/CadastrosBase/Categorias/useFinancialCategories.tsx
// -----------------------------------------------------------------------------
// Hooks de query do módulo de CATEGORIAS FINANCEIRAS (FinancialCategory —
// Cadastros Base / Financeiro) — TASK-FE-310, mesmo papel de
// Agrupadores/useGroupers.tsx:
//   - useFinancialCategoriesList → useCustomGridQuery, modo GRID achatado
//     (qualquer filtro ativo — search/is_enabled/classification, contrato
//     §6.1/TASK-FE-311).
//   - useFinancialCategoryTree   → useQuery simples, SEM paginação — a
//     árvore inteira (grupo→folha) já vem numa única resposta de
//     `/financial-categories/tree` (diferente de Agrupadores, que busca
//     filhos sob demanda por nó — aqui não há mecanismo equivalente, ver
//     TASK-FE-311).
//   - useFinancialCategoryForm   → useCustomFormQueryByGuid, detalhe p/
//     formulário (TASK-FE-312).
// -----------------------------------------------------------------------------

import type { Dispatch, SetStateAction } from 'react';

import { useQuery } from '@tanstack/react-query';

import { useCustomFormQueryByGuid } from '@/hooks/useCustomFormQueryByGuid';
import { useCustomGridQuery } from '@/hooks/useCustomGridQuery';

import { queryKey } from '@/constants/query-key';

import {
  getFinancialCategory,
  getFinancialCategoryTree,
  listFinancialCategories,
} from '@/services/v2/FinancialCategories/financial-category-service';

import type { PaginatedQueryProps } from '@/@types/pagination';
import type {
  FinancialCategoryDetail,
  FinancialCategoryFilterForm,
  FinancialCategoryListItem,
} from '@/@types/v2/FinancialCategories';

interface UseFinancialCategoriesListProps {
  paginatedQuery: PaginatedQueryProps;
  setPaginatedQuery: Dispatch<SetStateAction<PaginatedQueryProps<any>>>;
  filter?: FinancialCategoryFilterForm;
  /** Só habilita a query no modo GRID (qualquer filtro ativo) — modo árvore usa `useFinancialCategoryTree`. */
  enabled?: boolean;
}

// Modo GRID achatado (qualquer filtro ativo do drawer) — contrato §6.1,
// `per_page` default 10 (decidido no `usePaginatedQueryStorage` da tela).
export function useFinancialCategoriesList({
  paginatedQuery,
  setPaginatedQuery,
  filter,
  enabled = true,
}: UseFinancialCategoriesListProps) {
  return useCustomGridQuery<FinancialCategoryListItem, FinancialCategoryFilterForm>({
    asyncFunction: listFinancialCategories,
    queryKey: queryKey.financialCategories.list,
    paginatedQuery,
    setPaginatedQuery,
    filterQuery: [],
    filter: filter ?? ({} as FinancialCategoryFilterForm),
    enabled,
  });
}

// Árvore completa — SEM paginação (`GET /financial-categories/tree` já
// devolve grupo+folhas de uma vez, contrato §3.2). `staleTime` curto (não 0):
// a árvore muda pouco durante a navegação normal da tela (mesma decisão de
// `getPermissionTree`/`CategoryTreeSelector`, que já consome este mesmo
// endpoint para o Plano de Contas).
export function useFinancialCategoryTree(enabled = true) {
  return useQuery({
    queryKey: [queryKey.financialCategories.tree],
    queryFn: async () => {
      const response = await getFinancialCategoryTree();
      return response.data;
    },
    staleTime: 30 * 1000,
    enabled,
    retry: false,
  });
}

interface UseFinancialCategoryFormProps {
  registrationId?: string;
  fillForm: (data: FinancialCategoryDetail, resetForce?: boolean) => void;
}

// Query de detalhe para preencher o formulário de edição/preview do pai
// (modo "criar filho", TASK-FE-312) — match por GUID, mesmo padrão de
// `useGrouperForm`/`useCostCenterForm`.
export function useFinancialCategoryForm({
  registrationId,
  fillForm,
}: UseFinancialCategoryFormProps) {
  return useCustomFormQueryByGuid<FinancialCategoryDetail>({
    registrationId,
    queryKey: queryKey.financialCategories.detail,
    asyncFunction: getFinancialCategory,
    fillForm,
  });
}
