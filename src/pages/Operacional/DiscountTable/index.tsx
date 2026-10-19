// src/pages/Operacional/DiscountTable/index.tsx
// -----------------------------------------------------------------------------
// Tela de LISTAGEM (grid) de Descontos/Classificação (DiscountTable —
// Operacional/Agricultura, F-032, TASK-DT-FE-02). Rota
// `/operacional/discount-tables` — guardada por
// `<RequirePermission permission="discount-tables_view">` (rota conectada em
// TASK-DT-FE-04, fora do escopo deste arquivo).
//
// UX-GAP confirmado (`discount-tables-contrato-tela-frontend.md` §1) —
// nenhuma tela de Descontos/Classificação no design system `cerne`. Decisão
// pré-autorizada: espelhar o CRUD migrado de Fases de Alimentação
// (`src/pages/Operacional/FeedingPhase/index.tsx`), adaptado aos campos
// reais desta tela (§4.4 do contrato de tela).
//
// Ordem server-side `code` desc (fidelidade; SEM sort do usuário,
// `DiscountTableRepository::listWithFilters`, `->orderByDesc('code')`).
// -----------------------------------------------------------------------------

import { useMemo, useState, type ElementType } from 'react';

import { Box, Text, useDisclosure, VStack } from '@chakra-ui/react';
import { FiPercent } from 'react-icons/fi';
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

import {
  deleteDiscountTable,
  listDiscountTables,
} from '@/services/v2/DiscountTables/discount-table-service';
import type { ListDiscountTablesParams } from '@/services/v2/DiscountTables/discount-table-service';

import type { DiscountTableFilterForm, DiscountTableListItem } from '@/@types/v2/DiscountTables';

import { useDiscountTableColumns } from './discount-table-columns';
import { FilterSideDiscountTable } from './FilterSideDiscountTable';
import { HeaderDiscountTableTable } from './HeaderDiscountTableTable';

// Chave de storage desta tela. Paginação (`userPaginatedQuery`) e
// personalização de grid (`useGridSettings`) derivam da MESMA expressão para
// nunca divergirem (mesmo padrão de FeedingPhase/Diet).
const DISCOUNT_TABLE_STORAGE_KEY =
  'OperacionalDescontosClassificacao' + queryKey.discountTables.discountTables;

// Achatamento `DiscountTableFilterForm` → `ListDiscountTablesParams`
// (querystring real de `GET /discount-tables`) — mirror `FeedingPhaseList::toRequestFilter`.
function toRequestFilter(filter?: DiscountTableFilterForm | null): ListDiscountTablesParams {
  return {
    search: filter?.search || undefined,
  };
}

export default function DiscountTableList() {
  const { languageGB } = useLanguage();
  const navigate = useNavigate();
  const { can } = usePermissions();
  const text = languageGB.discountTables.discountTable;

  const canCreate = can('discount-tables_create');
  const canEdit = can('discount-tables_edit');
  const canDelete = can('discount-tables_delete');

  const defaultQueryOptions = useMemo(
    () => ({
      pageSize: 10,
      storageKey: DISCOUNT_TABLE_STORAGE_KEY,
    }),
    []
  );

  const { paginatedQuery, handlePaginatedQuery, handleFilterChange, handleResetFilter } =
    userPaginatedQuery<DiscountTableFilterForm>(defaultQueryOptions);

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

  const discountTablesList = useCustomGridQuery<DiscountTableListItem, ListDiscountTablesParams>({
    asyncFunction: listDiscountTables,
    queryKey: queryKey.discountTables.discountTables,
    paginatedQuery,
    setPaginatedQuery: handlePaginatedQuery,
    filterQuery: [],
    filter: requestFilter,
  });

  // ---- Estado de exclusão --------------------------------------------------
  const [toDelete, setToDelete] = useState<DiscountTableListItem | null>(null);
  const {
    open: isOpenDeleteDialog,
    onOpen: onOpenDeleteDialog,
    onClose: onCloseDeleteDialog,
  } = useDisclosure();

  const deleteMutation = useRequest({
    asyncFunction: async ({ discountTableUuid }: { discountTableUuid: string }) => {
      return await deleteDiscountTable(discountTableUuid);
    },
    queryKey: queryKey.discountTables.discountTables,
    // `TypesRequest` não tem variante "delete" (mesmo truque já usado por
    // `FeedingPhase`/`Diet`/`Fabrica` para a mesma operação) —
    // `personalizedMessage` sempre vence o rótulo genérico de "update".
    typesRequest: 'update',
    entityName: text.singularLabel,
    personalizedMessage: text.list.deletedToast,
    actionSuccess: () => {
      onCloseDeleteDialog();
      setToDelete(null);
    },
  });

  const handleOpenClick = (discountTable: DiscountTableListItem) => {
    navigate(`/operacional/discount-tables/${discountTable.uuid}`);
  };

  const handleDeleteClick = (discountTable: DiscountTableListItem) => {
    setToDelete(discountTable);
    onOpenDeleteDialog();
  };

  const handleConfirmDelete = () => {
    if (toDelete) {
      deleteMutation.mutate({ discountTableUuid: toDelete.uuid });
    }
  };

  const isDeleting = deleteMutation.isPending;

  const defaultColumns = useDiscountTableColumns({
    languageGB,
    canEdit,
    canDelete,
    onOpen: handleOpenClick,
    onDelete: handleDeleteClick,
    isDeleting,
  });

  const gridSettings = useGridSettings<DiscountTableListItem>({
    storageKey: DISCOUNT_TABLE_STORAGE_KEY,
    storageScope: useGridStorageScope(),
    columns: defaultColumns,
  });
  const { columnOrder, setColumnOrder, columnVisibility, setColumnVisibility } = gridSettings;

  const isLoading = checkLoadingStatus([discountTablesList]);
  const items = discountTablesList.data?.data?.items;
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
            <HeaderDiscountTableTable
              onOpenFilter={onOpenFilter}
              filtersApplied={filtersApplied}
              languageGB={languageGB}
              gridSettings={gridSettings}
              canCreate={canCreate}
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
            isError={discountTablesList.isError}
            error={discountTablesList.error}
            onRetry={() => discountTablesList.refetch()}
            isRetrying={discountTablesList.isFetching}
            isEmpty={isEmpty}
            emptyIcon={FiPercent as ElementType}
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
            onCreate={() => navigate('/operacional/discount-tables/create')}
          />
        </Box>
      </TableProvider>

      <FilterSideDiscountTable
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
