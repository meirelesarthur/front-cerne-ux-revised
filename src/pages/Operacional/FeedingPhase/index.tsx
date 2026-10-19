// src/pages/Operacional/FeedingPhase/index.tsx
// -----------------------------------------------------------------------------
// Tela de LISTAGEM (grid) de Fases de Alimentação (FeedingPhase —
// Operacional/Pecuária/Confinamento, F-034, TASK-FP-FE-02). Rota
// `/operacional/fases-alimentacao` — guardada por
// `<RequirePermission permission="feeding-phases_view">` (rota conectada em
// TASK-FP-FE-04, fora do escopo deste arquivo).
//
// UX-GAP confirmado (`feeding-phases-contrato-tela-frontend.md` §1) —
// nenhuma tela de Fases de Alimentação (nem de Dieta) no design system
// `cerne`. Decisão pré-autorizada: espelhar o CRUD migrado de Dieta
// (`src/pages/Operacional/Diet/index.tsx`), adaptado aos campos reais de
// Fases (§4.3/§4.4 do contrato de tela).
// -----------------------------------------------------------------------------

import { useMemo, useState, type ElementType } from 'react';

import { Box, Text, useDisclosure, VStack } from '@chakra-ui/react';
import { FiCalendar } from 'react-icons/fi';
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
  deleteFeedingPhase,
  listFeedingPhases,
} from '@/services/v2/FeedingPhases/feeding-phase-service';
import type { ListFeedingPhasesParams } from '@/services/v2/FeedingPhases/feeding-phase-service';

import type { FeedingPhaseFilterForm, FeedingPhaseListItem } from '@/@types/v2/FeedingPhases';

import { useFeedingPhaseColumns } from './feeding-phase-columns';
import { FilterSideFeedingPhase } from './FilterSideFeedingPhase';
import { HeaderFeedingPhaseTable } from './HeaderFeedingPhaseTable';

// Chave de storage desta tela. Paginação (`userPaginatedQuery`) e
// personalização de grid (`useGridSettings`) derivam da MESMA expressão para
// nunca divergirem (mesmo padrão de `Diet`).
const FEEDING_PHASE_STORAGE_KEY =
  'OperacionalFasesAlimentacao' + queryKey.feedingPhases.feedingPhases;

// Achatamento `FeedingPhaseFilterForm` → `ListFeedingPhasesParams` (querystring
// real de `GET /feeding-phases`) — mirror `DietList::toRequestFilter`.
function toRequestFilter(filter?: FeedingPhaseFilterForm | null): ListFeedingPhasesParams {
  return {
    name: filter?.name || undefined,
    diet_uuid: filter?.diet_uuid || undefined,
    change_rule: filter?.change_rule || undefined,
  };
}

export default function FeedingPhaseList() {
  const { languageGB } = useLanguage();
  const navigate = useNavigate();
  const { can } = usePermissions();
  const text = languageGB.feedingPhases.feedingPhase;

  const canCreate = can('feeding-phases_create');
  const canEdit = can('feeding-phases_edit');
  const canDelete = can('feeding-phases_delete');

  const defaultQueryOptions = useMemo(
    () => ({
      pageSize: 10,
      storageKey: FEEDING_PHASE_STORAGE_KEY,
    }),
    []
  );

  const { paginatedQuery, handlePaginatedQuery, handleFilterChange, handleResetFilter } =
    userPaginatedQuery<FeedingPhaseFilterForm>(defaultQueryOptions);

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

  const feedingPhasesList = useCustomGridQuery<FeedingPhaseListItem, ListFeedingPhasesParams>({
    asyncFunction: listFeedingPhases,
    queryKey: queryKey.feedingPhases.feedingPhases,
    paginatedQuery,
    setPaginatedQuery: handlePaginatedQuery,
    filterQuery: [],
    filter: requestFilter,
  });

  // ---- Estado de exclusão --------------------------------------------------
  const [toDelete, setToDelete] = useState<FeedingPhaseListItem | null>(null);
  const {
    open: isOpenDeleteDialog,
    onOpen: onOpenDeleteDialog,
    onClose: onCloseDeleteDialog,
  } = useDisclosure();

  const deleteMutation = useRequest({
    asyncFunction: async ({ feedingPhaseUuid }: { feedingPhaseUuid: string }) => {
      return await deleteFeedingPhase(feedingPhaseUuid);
    },
    queryKey: queryKey.feedingPhases.feedingPhases,
    // `TypesRequest` não tem variante "delete" (mesmo truque já usado por
    // `Diet`/`Fabrica` para a mesma operação) — `personalizedMessage` sempre
    // vence o rótulo genérico de "update".
    typesRequest: 'update',
    entityName: text.singularLabel,
    personalizedMessage: text.list.deletedToast,
    actionSuccess: () => {
      onCloseDeleteDialog();
      setToDelete(null);
    },
  });

  const handleOpenClick = (feedingPhase: FeedingPhaseListItem) => {
    navigate(`/operacional/fases-alimentacao/${feedingPhase.uuid}`);
  };

  const handleDeleteClick = (feedingPhase: FeedingPhaseListItem) => {
    setToDelete(feedingPhase);
    onOpenDeleteDialog();
  };

  const handleConfirmDelete = () => {
    if (toDelete) {
      deleteMutation.mutate({ feedingPhaseUuid: toDelete.uuid });
    }
  };

  const isDeleting = deleteMutation.isPending;

  const defaultColumns = useFeedingPhaseColumns({
    languageGB,
    canEdit,
    canDelete,
    onOpen: handleOpenClick,
    onDelete: handleDeleteClick,
    isDeleting,
  });

  const gridSettings = useGridSettings<FeedingPhaseListItem>({
    storageKey: FEEDING_PHASE_STORAGE_KEY,
    storageScope: useGridStorageScope(),
    columns: defaultColumns,
  });
  const { columnOrder, setColumnOrder, columnVisibility, setColumnVisibility } = gridSettings;

  const isLoading = checkLoadingStatus([feedingPhasesList]);
  const items = feedingPhasesList.data?.data?.items;
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
            <HeaderFeedingPhaseTable
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
            isError={feedingPhasesList.isError}
            error={feedingPhasesList.error}
            isEmpty={isEmpty}
            onRetry={() => feedingPhasesList.refetch()}
            isRetrying={feedingPhasesList.isFetching}
            emptyIcon={FiCalendar as ElementType}
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
            onCreate={() => navigate('/operacional/fases-alimentacao/novo')}
          />
        </Box>
      </TableProvider>

      <FilterSideFeedingPhase
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
