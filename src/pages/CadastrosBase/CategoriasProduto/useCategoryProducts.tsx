// src/pages/CadastrosBase/CategoriasProduto/useCategoryProducts.tsx
// -----------------------------------------------------------------------------
// Hooks de query do módulo de CATEGORIAS DE PRODUTO — mesmo padrão de
// GruposProduto/useProductGroups.tsx / Racas/useBreeds.tsx:
//   - useCategoryProductsList → useCustomGridQuery (listagem, SEM ID de
//     contexto, paginação REAL server-side — TASK-CP-FE-01)
//   - useCategoryProductForm  → useCustomFormQueryByGuid (detalhe p/
//     formulário, TASK-CP-FE-02)
// -----------------------------------------------------------------------------

import type { Dispatch, SetStateAction } from 'react';

import { useCustomFormQueryByGuid } from '@/hooks/useCustomFormQueryByGuid';
import { useCustomGridQuery } from '@/hooks/useCustomGridQuery';

import { queryKey } from '@/constants/query-key';

import {
  getCategoryProduct,
  listCategoryProducts,
} from '@/services/v2/CategoryProducts/category-product-service';

import type { PaginatedQueryProps } from '@/@types/pagination';
import type {
  CategoryProductDetail,
  CategoryProductFilterForm,
  CategoryProductListItem,
} from '@/@types/v2/CategoryProducts/category-product';

interface UseCategoryProductsListProps {
  paginatedQuery: PaginatedQueryProps;
  setPaginatedQuery: Dispatch<SetStateAction<PaginatedQueryProps<any>>>;
  filter?: CategoryProductFilterForm;
}

// Query de listagem paginada de categorias de produto (filtros `search`/
// `group_uuid`/`type`/`is_enabled` vão como query params reais — ver
// ListCategoryProductsParams).
export function useCategoryProductsList({
  paginatedQuery,
  setPaginatedQuery,
  filter,
}: UseCategoryProductsListProps) {
  return useCustomGridQuery<CategoryProductListItem, CategoryProductFilterForm>({
    asyncFunction: listCategoryProducts,
    queryKey: queryKey.categoryProducts.list,
    paginatedQuery,
    setPaginatedQuery,
    filterQuery: [],
    filter: filter ?? ({} as CategoryProductFilterForm),
  });
}

interface UseCategoryProductFormProps {
  registrationId?: string;
  fillForm: (data: CategoryProductDetail, resetForce?: boolean) => void;
}

// Query de detalhe para preencher o formulário de edição (match por GUID).
export function useCategoryProductForm({ registrationId, fillForm }: UseCategoryProductFormProps) {
  return useCustomFormQueryByGuid<CategoryProductDetail>({
    registrationId,
    queryKey: queryKey.categoryProducts.detail,
    asyncFunction: getCategoryProduct,
    fillForm,
  });
}
