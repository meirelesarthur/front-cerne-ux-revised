// src/pages/Operacional/Diet/DietBeat/index.tsx
// -----------------------------------------------------------------------------
// Tela de LISTAGEM (grid) de BATIDA (DietBeat — Operacional/Pecuária,
// TASK-FE-DIET-05). Rota `/operacional/dietas/batidas` — guardada por
// `<RequirePermission permission="diet-beats_view">` (TASK-FE-DIET-07).
//
// UX-GAP confirmado (`ux-map.md`). Molde 1:1 `FoodBeat/index.tsx`, adaptado
// aos campos reais de DietBeat (colunas LM-DB-01..07). SEM ação de
// relatório/impressão (não confirmado no contrato de Dieta, diferente de
// FoodBeat) — só view/edit + delete (devolução de estoque é server-side,
// AD-03).
// -----------------------------------------------------------------------------

import { useMemo, useState, type ElementType } from 'react';

import { Box, Text, useDisclosure } from '@chakra-ui/react';
import { FiPackage } from 'react-icons/fi';
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

import { deleteDietBeat, listDietBeats } from '@/services/v2/DietBeats/diet-beat-service';
import type { ListDietBeatsParams } from '@/services/v2/DietBeats/diet-beat-service';

import type { DietBeatFilterForm, DietBeatListItem } from '@/@types/v2/DietBeats';

import { useDietBeatColumns } from './diet-beat-columns';
import { FilterSideDietBeat } from './FilterSideDietBeat';
import { HeaderDietBeatTable } from './HeaderDietBeatTable';

import { PageHeader } from '@/components/ui/PageHeader';

// Chave de storage desta tela — NÃO colide com a de Dieta (prefixo próprio +
// `queryKey.dietBeats.dietBeats`).
const DIET_BEAT_STORAGE_KEY = 'OperacionalDietaBatida' + queryKey.dietBeats.dietBeats;

// Achatamento `DietBeatFilterForm` → `ListDietBeatsParams` (querystring real
// de `GET /diet-beats`) — mirror `FoodBeat::toRequestFilter`.
function toRequestFilter(filter?: DietBeatFilterForm | null): ListDietBeatsParams {
  return {
    equipment_uuid: filter?.equipment_uuid || undefined,
    date: filter?.date || undefined,
    diet_uuid: filter?.diet_uuid || undefined,
  };
}

export default function DietBeatList() {
  const { languageGB } = useLanguage();
  const navigate = useNavigate();
  const { can } = usePermissions();
  const text = languageGB.dietBeats.dietBeat;

  const canCreate = can('diet-beats_create');
  const canEdit = can('diet-beats_view') || can('diet-beats_edit');
  const canDelete = can('diet-beats_delete');

  const defaultQueryOptions = useMemo(
    () => ({
      pageSize: 10,
      storageKey: DIET_BEAT_STORAGE_KEY,
    }),
    []
  );

  const { paginatedQuery, handlePaginatedQuery, handleFilterChange, handleResetFilter } =
    userPaginatedQuery<DietBeatFilterForm>(defaultQueryOptions);

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

  const dietBeatsList = useCustomGridQuery<DietBeatListItem, ListDietBeatsParams>({
    asyncFunction: listDietBeats,
    queryKey: queryKey.dietBeats.dietBeats,
    paginatedQuery,
    setPaginatedQuery: handlePaginatedQuery,
    filterQuery: [],
    filter: requestFilter,
  });

  const [toDelete, setToDelete] = useState<DietBeatListItem | null>(null);
  const {
    open: isOpenDeleteDialog,
    onOpen: onOpenDeleteDialog,
    onClose: onCloseDeleteDialog,
  } = useDisclosure();

  const deleteMutation = useRequest({
    asyncFunction: async ({ dietBeatUuid }: { dietBeatUuid: string }) => {
      return await deleteDietBeat(dietBeatUuid);
    },
    queryKey: queryKey.dietBeats.dietBeats,
    typesRequest: 'update',
    entityName: text.singularLabel,
    personalizedMessage: text.list.deletedToast,
    actionSuccess: () => {
      onCloseDeleteDialog();
      setToDelete(null);
    },
  });

  const handleEditClick = (dietBeat: DietBeatListItem) => {
    navigate(`/operacional/dietas/batidas/${dietBeat.uuid}`);
  };

  const handleDeleteClick = (dietBeat: DietBeatListItem) => {
    setToDelete(dietBeat);
    onOpenDeleteDialog();
  };

  const handleConfirmDelete = () => {
    if (toDelete) {
      deleteMutation.mutate({ dietBeatUuid: toDelete.uuid });
    }
  };

  const isDeleting = deleteMutation.isPending;

  const defaultColumns = useDietBeatColumns({
    languageGB,
    canEdit,
    canDelete,
    onEdit: handleEditClick,
    onDelete: handleDeleteClick,
    isDeleting,
  });

  const gridSettings = useGridSettings<DietBeatListItem>({
    storageKey: DIET_BEAT_STORAGE_KEY,
    storageScope: useGridStorageScope(),
    columns: defaultColumns,
  });
  const { columnOrder, setColumnOrder, columnVisibility, setColumnVisibility } = gridSettings;

  const isLoading = checkLoadingStatus([dietBeatsList]);
  const items = dietBeatsList.data?.data?.items;
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
            <HeaderDietBeatTable
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
            isError={dietBeatsList.isError}
            error={dietBeatsList.error}
            onRetry={() => dietBeatsList.refetch()}
            isRetrying={dietBeatsList.isFetching}
            isEmpty={isEmpty}
            emptyIcon={FiPackage as ElementType}
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
            onCreate={() => navigate('/operacional/dietas/batidas/novo')}
          />
        </Box>
      </TableProvider>

      <FilterSideDietBeat
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
