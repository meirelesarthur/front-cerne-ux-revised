// src/pages/Operacional/Separations/index.tsx
// -----------------------------------------------------------------------------
// Tela de LISTAGEM (grid) de APARTAÇÃO — Operacional > Pecuária
// (97-Esteiras/005 Tarefa 24, item de menu NOVO `ope-pec-apa` →
// `separation_view`).
//
// Rota: /operacional/apartacao (guardada por `separation_view`, registrada
// em src/router/index.tsx).
//
// UX-GAP confirmado pelo dono (frontend-contract-apartacao.md §1) — sem
// tela própria no design system `cerne`, seguir o padrão vigente do fork:
// molde `Operacional/Nascimentos/index.tsx` (CRUD simples, ação condicionada
// por 1 booleano de estado).
//
// 6 colunas + ação (contrato §5) — Código · Data · Responsável · Qtd. Lotes ·
// Qtd. Animais · Status Processamento · Ações. Filtro por Lote (1 campo).
//
// Sem Zustand — fazenda ativa já vem do AuthContext via interceptor;
// paginação/filtro por `userPaginatedQuery`. `useCustomGridQuery` (sem ID de
// contexto pai, mirror a maioria das listagens de módulo).
//
// Nenhum botão/link "Processar" — fora de escopo desta feature (feature
// futura "Processamentos", contrato §5).
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
import { separationProcessingStatus } from '@/constants/Separations/separation-processing-status';

import { deleteSeparation } from '@/services/v2/Separations/separation-service';

import type { SeparationFilterRequest, SeparationListItem } from '@/@types/v2/Separations';

import { FilterSideSeparations } from './FilterSideSeparations';
import { HeaderTable } from './HeaderTable';
import { SeparationActionsMenu } from './SeparationActionsMenu';
import { useSeparationsList } from './useSeparations';

const PAGE_SIZE_OPTIONS = [10, 30, 50, 100];

export default function SeparationsList() {
  const { languageGB } = useLanguage();
  const navigate = useNavigate();
  const { can } = usePermissions();
  const text = languageGB.separations.separation;

  const canView = can('separation_view');
  const canEdit = can('separation_edit');
  const canDelete = can('separation_delete');

  const defaultQueryOptions = useMemo(
    () => ({
      pageSize: 10,
      storageKey: 'OperacionalApartacao' + queryKey.separations.separationsList,
    }),
    []
  );

  const { paginatedQuery, handlePaginatedQuery, handleFilterChange, handleResetFilter } =
    userPaginatedQuery<SeparationFilterRequest & { batch_label?: string }>(defaultQueryOptions);

  const { open: isFilterOpen, onOpen: onOpenFilter, onClose: onCloseFilter } = useDisclosure();

  // `batch_label` é companion DISPLAY-ONLY de re-hidratação do
  // `SelectAsyncPaginate` — nunca conta como filtro aplicado (mesma regra de
  // `Operacional/Nascimentos/index.tsx`).
  const filtersApplied = useMemo(
    () =>
      Object.entries(paginatedQuery.filter ?? {})
        .filter(([key]) => !key.endsWith('_label'))
        .filter(([, v]) => v !== undefined && v !== null && v !== '').length,
    [paginatedQuery.filter]
  );

  const separationsList = useSeparationsList({
    paginatedQuery,
    setPaginatedQuery: handlePaginatedQuery,
    filter: paginatedQuery.filter ?? undefined,
  });

  // ---- Estado de exclusão --------------------------------------------------
  const queryClient = useQueryClient();
  const [toDelete, setToDelete] = useState<SeparationListItem | null>(null);
  const {
    open: isOpenDeleteDialog,
    onOpen: onOpenDeleteDialog,
    onClose: onCloseDeleteDialog,
  } = useDisclosure();

  const deleteMutation = useMutation({
    mutationFn: async (uuid: string) => deleteSeparation(uuid),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [queryKey.separations.separationsList] });

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

  function handleDeleteClick(item: SeparationListItem) {
    setToDelete(item);
    onOpenDeleteDialog();
  }

  function handleConfirmDelete() {
    if (toDelete) {
      deleteMutation.mutate(toDelete.uuid);
    }
  }

  const columnHelper = createColumnHelper<SeparationListItem>();
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
      columnHelper.accessor('employee_name', {
        header: text.list.table.employeeName,
        cell: ({ row }) => <Text lineClamp="1">{row.original.employee_name}</Text>,
      }),
      columnHelper.accessor('batch_count', {
        header: text.list.table.batchCount,
        cell: ({ row }) => <Text fontSize="sm">{row.original.batch_count}</Text>,
        meta: styleColumTable.sm,
      }),
      columnHelper.accessor('animal_count', {
        header: text.list.table.animalCount,
        cell: ({ row }) => <Text fontSize="sm">{row.original.animal_count}</Text>,
        meta: styleColumTable.sm,
      }),
      columnHelper.accessor('finished_processing', {
        header: text.list.table.processingStatus.processed,
        cell: ({ row }) => (
          <Badge
            colorPalette={separationProcessingStatus.getColor(row.original.finished_processing)}
            variant="subtle"
            py={1}
            px={3}
          >
            {separationProcessingStatus.getLabel(row.original.finished_processing, languageGB)}
          </Badge>
        ),
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
              <SeparationActionsMenu
                canView={canView}
                canEdit={canEdit}
                canDelete={canDelete}
                isFinishedProcessing={item.finished_processing}
                isDeleting={isDeleting}
                labels={{
                  view: text.list.actions.view,
                  edit: text.list.actions.edit,
                  delete: text.list.actions.delete,
                }}
                onView={() => navigate(`/operacional/apartacao/${item.uuid}`)}
                onEdit={() => navigate(`/operacional/apartacao/${item.uuid}/editar`)}
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

  const isLoading = checkLoadingStatus([separationsList]);
  const items = separationsList.data?.data?.items;
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
            isError={separationsList.isError}
            error={separationsList.error}
            isEmpty={isEmpty}
            onRetry={() => separationsList.refetch()}
            isRetrying={separationsList.isFetching}
            retryLabel={text.list.error.retry}
            emptyIcon={FiFileText as ElementType}
            emptyTitle={
              filtersApplied > 0 ? text.list.emptyState.titleFiltered : text.list.emptyState.titleEmpty
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

      <FilterSideSeparations
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
