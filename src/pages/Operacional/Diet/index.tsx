// src/pages/Operacional/Diet/index.tsx
// -----------------------------------------------------------------------------
// Tela de LISTAGEM (grid) de DIETA (Diet — Operacional/Pecuária,
// TASK-FE-DIET-02). Rota `/operacional/dietas` — guardada por
// `<RequirePermission permission="diets_view">` (rota conectada em
// TASK-FE-DIET-07, fora do escopo deste arquivo).
//
// UX-GAP confirmado (`ux-map.md`) — nenhuma tela de Dieta dedicada no design
// system `cerne`. Referência FUNCIONAL: estrutura do legado (Dieta CRUD).
// Referência VISUAL: padrão CRUD já consolidado no `frontend_root` — molde
// 1:1 `Fabrica/index.tsx` (Food), adaptado aos campos reais de Diet
// (`arquitetura-frontend-dieta.md` §3, colunas LM-DIETS-01..07).
// -----------------------------------------------------------------------------

import { useMemo, useState, type ElementType } from 'react';

import { Box, Text, useDisclosure } from '@chakra-ui/react';
import { FiClipboard } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';

import { ContainerGrid } from '@/components/ContainerGrid';
import { DeleteConfirmDialog } from '@/components/DeleteConfirmDialog';
import { HeaderGrid } from '@/components/HeaderGrid';
import { Table } from '@/components/Table';

import { TableProvider } from '@/contexts/TableContext';

import { useCustomGridQuery } from '@/hooks/useCustomGridQuery';
import { useGridSettings } from '@/hooks/useGridSettings';
import { useGridStorageScope } from '@/hooks/useGridStorageScope';
import { useLanguage } from '@/hooks/useLanguage';
import { userPaginatedQuery } from '@/hooks/usePaginatedQueryStorage';
import { usePermissions } from '@/hooks/usePermissions';
import { useRequest } from '@/hooks/useRequest';

import { checkLoadingStatus } from '@/utils/checkLoadingStatus';

import { queryKey } from '@/constants/query-key';

import { deleteDiet, listDiets } from '@/services/v2/Diets/diet-service';
import type { ListDietsParams } from '@/services/v2/Diets/diet-service';

import type { DietFilterForm, DietListItem } from '@/@types/v2/Diets';

import { useDietColumns } from './diet-columns';
import { FilterSideDiet } from './FilterSideDiet';
import { HeaderDietTable } from './HeaderDietTable';

import { PageHeader } from '@/components/ui/PageHeader';

// Chave de storage desta tela. Paginação (`userPaginatedQuery`) e
// personalização de grid (`useGridSettings`) derivam da MESMA expressão para
// nunca divergirem (mesmo padrão de `Fabrica`/`CentroCusto`).
const DIET_STORAGE_KEY = 'OperacionalDieta' + queryKey.diets.diets;

// Achatamento `DietFilterForm` → `ListDietsParams` (querystring real de
// `GET /diets`, AD-08) — mirror `Fabrica::toRequestFilter`.
function toRequestFilter(filter?: DietFilterForm | null): ListDietsParams {
  return {
    search: filter?.search || undefined,
    objective: filter?.objective || undefined,
    date: filter?.date || undefined,
  };
}

export default function DietList() {
  const { languageGB } = useLanguage();
  const navigate = useNavigate();
  const { can } = usePermissions();
  const text = languageGB.diets.diet;

  const canCreate = can('diets_create');
  const canEdit = can('diets_edit');
  const canDelete = can('diets_delete');

  const defaultQueryOptions = useMemo(
    () => ({
      pageSize: 10,
      storageKey: DIET_STORAGE_KEY,
    }),
    []
  );

  const { paginatedQuery, handlePaginatedQuery, handleFilterChange, handleResetFilter } =
    userPaginatedQuery<DietFilterForm>(defaultQueryOptions);

  // ---- Estado de filtro (drawer) ------------------------------------------
  const { open: isFilterOpen, onOpen: onOpenFilter, onClose: onCloseFilter } = useDisclosure();

  const filtersApplied = useMemo(
    () =>
      Object.values(paginatedQuery.filter ?? {}).filter(
        (v) => v !== undefined && v !== null && v !== ''
      ).length,
    [paginatedQuery.filter]
  );

  const requestFilter = useMemo(
    () => toRequestFilter(paginatedQuery.filter),
    [paginatedQuery.filter]
  );

  const dietsList = useCustomGridQuery<DietListItem, ListDietsParams>({
    asyncFunction: listDiets,
    queryKey: queryKey.diets.diets,
    paginatedQuery,
    setPaginatedQuery: handlePaginatedQuery,
    filterQuery: [],
    filter: requestFilter,
  });

  // ---- Estado de exclusão --------------------------------------------------
  const [toDelete, setToDelete] = useState<DietListItem | null>(null);
  const {
    open: isOpenDeleteDialog,
    onOpen: onOpenDeleteDialog,
    onClose: onCloseDeleteDialog,
  } = useDisclosure();

  const deleteMutation = useRequest({
    asyncFunction: async ({ dietUuid }: { dietUuid: string }) => {
      return await deleteDiet(dietUuid);
    },
    queryKey: queryKey.diets.diets,
    // `TypesRequest` não tem variante "delete" (mesmo truque já usado por
    // `Fabrica`/`CentroCusto` para a mesma operação) — `personalizedMessage`
    // sempre vence o rótulo genérico de "update".
    typesRequest: 'update',
    entityName: text.singularLabel,
    personalizedMessage: text.list.deletedToast,
    actionSuccess: () => {
      onCloseDeleteDialog();
      setToDelete(null);
    },
  });

  const handleEditClick = (diet: DietListItem) => {
    navigate(`/operacional/dietas/${diet.uuid}`);
  };

  const handleDeleteClick = (diet: DietListItem) => {
    setToDelete(diet);
    onOpenDeleteDialog();
  };

  const handleConfirmDelete = () => {
    if (toDelete) {
      deleteMutation.mutate({ dietUuid: toDelete.uuid });
    }
  };

  const isDeleting = deleteMutation.isPending;

  const defaultColumns = useDietColumns({
    languageGB,
    canEdit,
    canDelete,
    onEdit: handleEditClick,
    onDelete: handleDeleteClick,
    isDeleting,
  });

  const gridSettings = useGridSettings<DietListItem>({
    storageKey: DIET_STORAGE_KEY,
    storageScope: useGridStorageScope(),
    columns: defaultColumns,
  });
  const { columnOrder, setColumnOrder, columnVisibility, setColumnVisibility } = gridSettings;

  const isLoading = checkLoadingStatus([dietsList]);
  const items = dietsList.data?.data?.items;
  const isEmpty = !isLoading && (items?.length ?? 0) === 0;

  return (
    <ContainerGrid>
      <TableProvider
        data={items}
        columns={defaultColumns}
        pagination={paginatedQuery}
        setPagination={handlePaginatedQuery}
        enableMultiRowSelection={false}
        columnOrder={columnOrder}
        onColumnOrderChange={setColumnOrder}
        columnVisibility={columnVisibility}
        setColumnVisibility={setColumnVisibility}
      >
        <HeaderGrid
          header={
            <HeaderDietTable
              onOpenFilter={onOpenFilter}
              filtersApplied={filtersApplied}
              languageGB={languageGB}
              gridSettings={gridSettings}
              canCreate={canCreate}
            />
          }
        >
          <PageHeader title={text.list.pageTitle} description={text.list.pageSubtitle} />
        </HeaderGrid>

        <Box mt={6}>
          <Table
            isLoading={isLoading}
            isError={dietsList.isError}
            error={dietsList.error}
            onRetry={() => dietsList.refetch()}
            isRetrying={dietsList.isFetching}
            isEmpty={isEmpty}
            emptyIcon={FiClipboard as ElementType}
            emptyTitle={
              filtersApplied > 0 ? text.list.emptyState.titleFiltered : text.list.emptyState.titleEmpty
            }
            emptyDescription={
              filtersApplied > 0
                ? text.list.emptyState.descriptionFiltered
                : text.list.emptyState.descriptionEmpty
            }
            canCreate={filtersApplied === 0 && canCreate}
            createLabel={text.list.emptyState.cta}
            onCreate={() => navigate('/operacional/dietas/novo')}
          />
        </Box>
      </TableProvider>

      <FilterSideDiet
        isOpen={isFilterOpen}
        onClose={onCloseFilter}
        handleFilterChange={handleFilterChange}
        handleReset={handleResetFilter}
        filter={paginatedQuery.filter}
        languageGB={languageGB}
      />

      <DeleteConfirmDialog
        isOpen={isOpenDeleteDialog}
        onClose={() => {
          onCloseDeleteDialog();
          setToDelete(null);
        }}
        onConfirm={handleConfirmDelete}
        isLoading={isDeleting}
        itemName={toDelete?.code}
        tone="danger"
      />
    </ContainerGrid>
  );
}
