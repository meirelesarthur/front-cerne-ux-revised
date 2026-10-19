// src/pages/Operacional/Pastagem/index.tsx
// -----------------------------------------------------------------------------
// Tela de LISTAGEM (grid) de Pastagem — TASK-PAST-FE-02. Domínio PRÓPRIO
// (`Operacional`, URL `/operacional/pastagem`, mirror
// `Operacional/Appropriations`). `useCustomGridQuery` (sem ID pai) +
// `userPaginatedQuery` (storage), order `code` desc (servidor), pageSize 10.
// -----------------------------------------------------------------------------

import { useMemo, useState, type ElementType } from 'react';

import { Box, Text, VStack, useDisclosure } from '@chakra-ui/react';
import { FiPenTool } from 'react-icons/fi';
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

import { deletePasture, listPastures } from '@/services/v2/Pastures';

import type { PastureFilterForm, PastureListItem } from '@/@types/v2/Pastures';

import { buildPastureColumns } from './columns';
import { FilterSidePastagem } from './FilterSidePastagem';
import { HeaderTable } from './HeaderTable';

const PASTURES_STORAGE_KEY = 'OperacionalPastagem' + queryKey.pastures.pastures;

export default function PastagemList() {
  const { languageGB } = useLanguage();
  const navigate = useNavigate();
  const { can } = usePermissions();
  const text = languageGB.pastures.pasture;

  const canCreate = can('pastures_create');
  const canView = can('pastures_view');
  const canDelete = can('pastures_delete');
  const canEdit = can('pastures_edit');

  const defaultQueryOptions = useMemo(
    () => ({ pageSize: 10, storageKey: PASTURES_STORAGE_KEY }),
    []
  );

  const { paginatedQuery, handlePaginatedQuery, handleFilterChange, handleResetFilter } =
    userPaginatedQuery<PastureFilterForm>(defaultQueryOptions);

  const { open: isFilterOpen, onOpen: onOpenFilter, onClose: onCloseFilter } = useDisclosure();

  const filtersApplied = useMemo(
    () =>
      Object.values(paginatedQuery.filter ?? {}).filter(
        (v) => v !== undefined && v !== null && v !== ''
      ).length,
    [paginatedQuery.filter]
  );

  const [toDelete, setToDelete] = useState<PastureListItem | null>(null);
  const {
    open: isOpenDeleteDialog,
    onOpen: onOpenDeleteDialog,
    onClose: onCloseDeleteDialog,
  } = useDisclosure();

  const pasturesList = useCustomGridQuery<PastureListItem, PastureFilterForm>({
    asyncFunction: listPastures,
    queryKey: queryKey.pastures.pastures,
    paginatedQuery,
    setPaginatedQuery: handlePaginatedQuery,
    filterQuery: [],
    filter: {
      user_uuid: paginatedQuery.filter?.user_uuid,
      start_date: paginatedQuery.filter?.start_date,
      end_date: paginatedQuery.filter?.end_date,
    },
  });

  const deleteMutation = useRequest({
    asyncFunction: async ({ pastureUuid }: { pastureUuid: string }) => deletePasture(pastureUuid),
    queryKey: queryKey.pastures.pastures,
    queryKey2: queryKey.pastures.pasture,
    typesRequest: 'update',
    entityName: text.singularLabel,
    personalizedMessage: text.list.deletedToast,
    actionSuccess: () => {
      onCloseDeleteDialog();
      setToDelete(null);
    },
  });

  const isDeleting = deleteMutation.isPending;

  function handleDeleteClick(pasture: PastureListItem) {
    setToDelete(pasture);
    onOpenDeleteDialog();
  }

  function handleConfirmDelete() {
    if (toDelete) {
      deleteMutation.mutate({ pastureUuid: toDelete.uuid });
    }
  }

  const defaultColumns = useMemo(
    () =>
      buildPastureColumns({
        languageGB,
        canView,
        canEdit,
        canDelete,
        isDeleting,
        onView: (pasture) => navigate(`/operacional/pastagem/${pasture.uuid}/visualizar`),
        onEditOrFinish: (pasture) => navigate(`/operacional/pastagem/${pasture.uuid}`),
        onAppropriate: (pasture) => navigate(`/operacional/pastagem/${pasture.uuid}/apropriacao`),
        onDelete: handleDeleteClick,
      }),
    [languageGB, canView, canEdit, canDelete, isDeleting, navigate]
  );

  const gridSettings = useGridSettings<PastureListItem>({
    storageKey: PASTURES_STORAGE_KEY,
    storageScope: useGridStorageScope(),
    columns: defaultColumns,
  });
  const { columnOrder, setColumnOrder, columnVisibility, setColumnVisibility } = gridSettings;

  const isLoading = checkLoadingStatus([pasturesList]);
  const items = pasturesList.data?.data?.items;
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
            <HeaderTable
              onOpenFilter={onOpenFilter}
              filtersApplied={filtersApplied}
              languageGB={languageGB}
              canCreate={canCreate}
              onCreate={() => navigate('/operacional/pastagem/criar')}
            />
          }
        >
          <VStack align="flex-start" gap={1}>
            <Text fontSize="2xl" fontWeight="bold" color="brandColorText">
              {text.list.pageTitle}
            </Text>
            <Text fontSize="sm" color="fg.muted">
              {text.list.pageSubtitle}
            </Text>
          </VStack>
        </HeaderGrid>

        <Box mt={6}>
          <Table
            isLoading={isLoading}
            isError={pasturesList.isError}
            error={pasturesList.error}
            isEmpty={isEmpty}
            onRetry={() => pasturesList.refetch()}
            isRetrying={pasturesList.isFetching}
            emptyIcon={FiPenTool as ElementType}
            emptyTitle={
              filtersApplied > 0 ? text.list.emptyState.titleFiltered : text.list.emptyState.title
            }
            emptyDescription={
              filtersApplied > 0
                ? text.list.emptyState.descriptionFiltered
                : text.list.emptyState.description
            }
            canCreate={filtersApplied === 0 && canCreate}
            createLabel={text.list.emptyState.cta}
            onCreate={() => navigate('/operacional/pastagem/criar')}
          />
        </Box>
      </TableProvider>

      <FilterSidePastagem
        isOpen={isFilterOpen}
        onClose={onCloseFilter}
        handleFilterChange={handleFilterChange}
        handleReset={handleResetFilter}
        filter={paginatedQuery.filter}
        languageGB={languageGB}
        filtersApplied={filtersApplied}
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
