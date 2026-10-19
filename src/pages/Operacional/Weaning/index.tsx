// src/pages/Operacional/Weaning/index.tsx
// -----------------------------------------------------------------------------
// Tela de LISTAGEM (grid) de DESMAMA — Operacional > Pecuária > Manejo
// (TASK-WN-FE-03, item de menu `ope-pec-man-des` → `weaning_view`).
//
// Rota: /operacional/desmame (guardada por `weaning_view`, registrada em
// src/router/index.tsx).
//
// Referência UX (UX-GAP já decidido pelo dono — sem página dedicada no
// design system `cerne` para Desmama, `02-arquitetura-frontend-desmama.md
// §3`): composição dos mesmos componentes já adaptados usados por
// Nascimentos/Pastagem (`TableProvider`/`DataTable`, `FilterSide`, `Badge`,
// `DeleteConfirmDialog`).
//
// Colunas reais (mirror `WeaningResource`/`WeaningRepository::
// listWithFilters` — SEM MOCK): código, data, tipo, lote, responsável,
// status. NENHUMA coluna de "contagem de animais" — a listagem real NÃO
// eager-carrega `animalsWeanings` (só o detalhe faz), então esse dado não
// existe na resposta do índice.
//
// Sem Zustand — fazenda ativa já vem do AuthContext via interceptor;
// paginação/filtro por `userPaginatedQuery`.
// -----------------------------------------------------------------------------

import { useMemo, useState } from 'react';
import type { ElementType } from 'react';

import { Badge, Box, Flex, Text, useDisclosure, VStack } from '@chakra-ui/react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createColumnHelper } from '@tanstack/react-table';
import { FiFileText } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';

import { ContainerGrid } from '@/components/ContainerGrid';
import { DeleteConfirmDialog } from '@/components/DeleteConfirmDialog';
import { HeaderGrid } from '@/components/HeaderGrid';
import { Table } from '@/components/Table';
import { toaster } from '@/components/ui/toaster';

import { TableProvider } from '@/contexts/TableContext';

import { useLanguage } from '@/hooks/useLanguage';
import { userPaginatedQuery } from '@/hooks/usePaginatedQueryStorage';
import { usePermissions } from '@/hooks/usePermissions';

import { checkLoadingStatus } from '@/utils/checkLoadingStatus';
import { extractApiErrorMessage } from '@/utils/extractApiErrorMessage';
import formatDate from '@/utils/formatDate';
import { styleColumTable } from '@/utils/style-colum-table';

import { queryKey } from '@/constants/query-key';
import { weaningTypeOptions } from '@/constants/weaning/options/weaning-type-options';
import { weaningTypeColor } from '@/constants/weaning/weaning-type';

import { deleteWeaning } from '@/services/v2/Weaning/weaning-service';

import type { WeaningData, WeaningFilterForm } from '@/@types/v2/Weaning';

import { FilterSideWeaning } from './FilterSideWeaning';
import { HeaderTable } from './HeaderTable';
import { useWeaningsList } from './useWeanings';
import { WeaningActionsMenu } from './WeaningActionsMenu';

const PAGE_SIZE_OPTIONS = [10, 30, 50, 100];

export default function WeaningsList() {
  const { languageGB } = useLanguage();
  const navigate = useNavigate();
  const { can } = usePermissions();
  const text = languageGB.weaning.weaning;

  const canView = can('weaning_view');
  const canEdit = can('weaning_edit');
  const canDelete = can('weaning_delete');

  const defaultQueryOptions = useMemo(
    () => ({
      pageSize: 10,
      storageKey: 'OperacionalWeaning' + queryKey.weaning.weanings,
    }),
    []
  );

  const { paginatedQuery, handlePaginatedQuery, handleFilterChange, handleResetFilter } =
    userPaginatedQuery<WeaningFilterForm>(defaultQueryOptions);

  const { open: isFilterOpen, onOpen: onOpenFilter, onClose: onCloseFilter } = useDisclosure();

  // `responsible_label` é companion DISPLAY-ONLY de re-hidratação do
  // `SelectAsyncPaginate` — nunca conta como filtro aplicado (mesma regra
  // de `Operacional/Nascimentos/index.tsx`).
  const filtersApplied = useMemo(
    () =>
      Object.entries(paginatedQuery.filter ?? {})
        .filter(([key]) => !key.endsWith('_label'))
        .filter(([, v]) => v !== undefined && v !== null && v !== '').length,
    [paginatedQuery.filter]
  );

  const weaningsList = useWeaningsList({
    paginatedQuery,
    setPaginatedQuery: handlePaginatedQuery,
    filter: paginatedQuery.filter ?? undefined,
  });

  // ---- Estado de exclusão --------------------------------------------------
  const queryClient = useQueryClient();
  const [toDelete, setToDelete] = useState<WeaningData | null>(null);
  const {
    open: isOpenDeleteDialog,
    onOpen: onOpenDeleteDialog,
    onClose: onCloseDeleteDialog,
  } = useDisclosure();

  const deleteMutation = useMutation({
    mutationFn: async (uuid: string) => deleteWeaning(uuid),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [queryKey.weaning.weanings] });

      toaster.success({
        title: text.singularLabel,
        description: text.list.deletedToast,
        duration: 7000,
      });

      onCloseDeleteDialog();
      setToDelete(null);
    },
    onError: (error) => {
      toaster.error({
        title: text.singularLabel,
        description: extractApiErrorMessage(error) ?? languageGB.common.errorLog.unknownError,
        duration: 7000,
      });
    },
  });

  const isDeleting = deleteMutation.isPending;

  function handleDeleteClick(item: WeaningData) {
    setToDelete(item);
    onOpenDeleteDialog();
  }

  function handleConfirmDelete() {
    if (toDelete) {
      deleteMutation.mutate(toDelete.uuid);
    }
  }

  const columnHelper = createColumnHelper<WeaningData>();
  const defaultColumns = useMemo(
    () => [
      columnHelper.accessor('code', {
        header: text.list.table.code,
        cell: ({ row }) => <Text fontWeight="medium">{row.original.code}</Text>,
        meta: styleColumTable.sm,
      }),
      columnHelper.accessor('date', {
        header: text.list.table.date,
        cell: ({ row }) => <Text fontSize="sm">{formatDate(row.original.date)}</Text>,
        meta: styleColumTable.date,
      }),
      columnHelper.accessor('type', {
        header: text.list.table.type,
        cell: ({ row }) => (
          <Badge colorPalette={weaningTypeColor[row.original.type]} variant="subtle">
            {weaningTypeOptions.getLabel(row.original.type, languageGB)}
          </Badge>
        ),
        meta: styleColumTable.sm,
      }),
      columnHelper.display({
        id: 'batch',
        header: text.list.table.batch,
        cell: ({ row }) => <Text lineClamp="1">{row.original.batch?.description ?? '-'}</Text>,
      }),
      columnHelper.display({
        id: 'responsible',
        header: text.list.table.responsible,
        cell: ({ row }) => <Text lineClamp="1">{row.original.responsible?.name ?? '-'}</Text>,
      }),
      columnHelper.accessor('processing_status', {
        header: text.list.table.status,
        cell: ({ row }) => {
          const status = row.original.processing_status;
          if (status !== 'PENDING' && status !== 'FINISHED') {
            return <Text>{text.list.status.none}</Text>;
          }
          return (
            <Badge colorPalette={status === 'FINISHED' ? 'gray' : 'green'} variant="subtle">
              {status === 'FINISHED' ? text.list.status.finished : text.list.status.pending}
            </Badge>
          );
        },
        meta: styleColumTable.sm,
      }),
      columnHelper.display({
        id: 'acoes',
        header: '',
        enableHiding: false,
        enableSorting: false,
        cell: ({ row }) => {
          const item = row.original;
          return (
            <Flex justify="flex-end">
              <WeaningActionsMenu
                canView={canView}
                canEdit={canEdit}
                canDelete={canDelete}
                finishedProcessing={item.finished_processing}
                isDeleting={isDeleting}
                labels={{
                  view: text.list.actions.view,
                  edit: text.list.actions.edit,
                  delete: text.list.actions.delete,
                  editDisabledTooltip: text.list.actions.editDisabledTooltip,
                  deleteDisabledTooltip: text.list.actions.deleteDisabledTooltip,
                }}
                onView={() => navigate(`/operacional/desmame/${item.uuid}/visualizar`)}
                onEdit={() => navigate(`/operacional/desmame/${item.uuid}`)}
                onDelete={() => handleDeleteClick(item)}
              />
            </Flex>
          );
        },
        meta: styleColumTable.sm,
      }),
    ],
    [navigate, isDeleting, text, canView, canEdit, canDelete, languageGB]
  );

  const isLoading = checkLoadingStatus([weaningsList]);
  const items = weaningsList.data?.data?.items;
  const isEmpty = !isLoading && (items?.length ?? 0) === 0;

  return (
    <ContainerGrid>
      <TableProvider
        data={items}
        columns={defaultColumns}
        pagination={paginatedQuery}
        setPagination={handlePaginatedQuery}
        enableMultiRowSelection={false}
      >
        <HeaderGrid
          header={
            <HeaderTable
              onOpenFilter={onOpenFilter}
              filtersApplied={filtersApplied}
              languageGB={languageGB}
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
            pageSizeOptions={PAGE_SIZE_OPTIONS}
            isError={weaningsList.isError}
            error={weaningsList.error}
            isEmpty={isEmpty}
            onRetry={() => weaningsList.refetch()}
            isRetrying={weaningsList.isFetching}
            retryLabel={text.list.error.retry}
            emptyIcon={FiFileText as ElementType}
            emptyTitle={
              filtersApplied > 0
                ? text.list.emptyState.titleFiltered
                : text.list.emptyState.titleEmpty
            }
            emptyDescription={
              filtersApplied > 0
                ? text.list.emptyState.descriptionFiltered
                : text.list.emptyState.descriptionEmpty
            }
            canCreate={false}
          />
        </Box>
      </TableProvider>

      <FilterSideWeaning
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
        title={text.deleteDialog.title}
        description={
          toDelete
            ? text.deleteDialog.descriptionTemplate.replace('{code}', String(toDelete.code))
            : undefined
        }
        hideQuestionMark
        tone="danger"
      />
    </ContainerGrid>
  );
}
