// src/pages/CadastrosBase/EstagioReprodutivo/useCategoryMatrices.tsx
// -----------------------------------------------------------------------------
// Hooks de query do módulo de ESTÁGIO REPRODUTIVO (CategoryMatrix) — mesmo
// padrão de CadastrosBase/Especies/useSpecies.tsx / CadastrosBase/Warehouses.
//
// TASK-CATYMT-01 cobriu só a LISTAGEM (useCategoryMatricesList) — família Grid
// com paginação REAL (ao contrário de Espécies). TASK-CATYMT-02 adiciona
// `useCategoryMatrixForm` (detalhe/formulário) neste mesmo arquivo.
// -----------------------------------------------------------------------------

import type { Dispatch, SetStateAction } from 'react';

import { useCustomFormQueryByGuid } from '@/hooks/useCustomFormQueryByGuid';
import { useCustomGridQuery } from '@/hooks/useCustomGridQuery';

import { queryKey } from '@/constants/query-key';

import {
  getCategoryMatrixByUuid,
  listCategoryMatrices,
} from '@/services/v2/CategoryMatrices/category-matrix-service';

import type { PaginatedQueryProps } from '@/@types/pagination';
import type {
  CategoryMatrixData,
  CategoryMatrixFilterForm,
  CategoryMatrixListItem,
} from '@/@types/v2/CategoryMatrices/category-matrix';

interface UseCategoryMatricesListProps {
  paginatedQuery: PaginatedQueryProps;
  setPaginatedQuery: Dispatch<SetStateAction<PaginatedQueryProps<any>>>;
  filter?: CategoryMatrixFilterForm;
}

// Query de listagem de Estágio Reprodutivo (filtros `search`/`is_enabled`/
// `specie_uuid` vão como query params reais — ver ListCategoryMatricesParams).
// Usa `useCustomGridQuery` (família Grid padrão do projeto) com paginação REAL
// — `listCategoryMatrices` já adapta o envelope paginado real para o shape
// `ResponsePagination` que este hook espera (nada de `meta:null` fixo).
export function useCategoryMatricesList({
  paginatedQuery,
  setPaginatedQuery,
  filter,
}: UseCategoryMatricesListProps) {
  return useCustomGridQuery<CategoryMatrixListItem, CategoryMatrixFilterForm>({
    asyncFunction: listCategoryMatrices,
    queryKey: queryKey.categoryMatrices.list,
    paginatedQuery,
    setPaginatedQuery,
    filterQuery: [],
    filter: filter ?? ({} as CategoryMatrixFilterForm),
  });
}

interface UseCategoryMatrixFormProps {
  registrationId?: string;
  fillForm: (data: CategoryMatrixData, resetForce?: boolean) => void;
}

// TASK-CATYMT-02 — query de detalhe para preencher o formulário de edição
// (match por GUID), mesmo padrão de `useSpecieForm`/`useCostCenterForm`.
export function useCategoryMatrixForm({ registrationId, fillForm }: UseCategoryMatrixFormProps) {
  return useCustomFormQueryByGuid<CategoryMatrixData>({
    registrationId,
    queryKey: queryKey.categoryMatrices.detail,
    asyncFunction: getCategoryMatrixByUuid,
    fillForm,
  });
}
