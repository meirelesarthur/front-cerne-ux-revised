// src/pages/Operacional/Marcacao/index.tsx
// -----------------------------------------------------------------------------
// Tela de LISTAGEM (grid) de MARCAÇÃO — Operacional > Agricultura > Manejo
// (TASK-MC-FE-03, item de menu a ser criado em TASK-MC-FE-09, onda 2, fora
// desta Tarefa).
//
// Rota: /operacional/marcacao (registro de rota/menu é TASK-MC-FE-09).
//
// Referência UX (`UX-GAP: seguir-pelo-padrão`, decisão do dono já registrada
// em `ARCHITECTURE-MARCACAO-FE.md §2` — sem tela própria em `GB.Cerne.UX`
// para Marcação): composição sibling-first mirror `Operacional/Weaning/
// index.tsx` (grid+filtro+ações) + `Operacional/VendaAnimais/index.tsx`
// (seleção múltipla controlada por `uuid`).
//
// 9 colunas reais (mirror `MarkingResource` — SEM MOCK): código, área,
// responsável, variedade, quantidade, safra, semana, data, cor. NENHUMA
// coluna "data prevista" — o roteiro front assumia um `forecast_date` que o
// `MarkingResource` real NÃO expõe (docblock do Resource: subcadastros são
// deliberadamente omitidos deste envelope); confirmação de contrato, não
// decisão nova (ver `@/@types/v2/Marcacao/marking/index.d.ts`).
//
// Seleção múltipla (fundação p/ TASK-MC-FE-07, onda 2): gate de checkbox
// homogêneo por `status` (mirror `CLM-BULK-CHECKBOX-GATE`, parte 1 — "linhas
// habilitadas só quando compartilham status"). A parte 2 da regra original
// ("quando status===2, também exigem mesma quantidade de forecasts e mesma
// data entre as linhas selecionadas") NÃO é aplicável aqui: `MarkingResource`
// da listagem não expõe contagem de forecasts nem `forecast_date` (mesma
// LACUNA da coluna omitida acima) — SEM MOCK, o gate fino fica para
// TASK-MC-FE-07 (validado no servidor pelos endpoints de bulk).
//
// Sem Zustand — fazenda ativa já vem do AuthContext via interceptor;
// paginação/filtro por `userPaginatedQuery`.
// -----------------------------------------------------------------------------

import { useMemo, useState, type ElementType } from 'react';

import { Badge, Box, Flex, Text, useDisclosure } from '@chakra-ui/react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createColumnHelper, type OnChangeFn, type RowSelectionState } from '@tanstack/react-table';
import { FiTag } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';

import { ContainerGrid } from '@/components/ContainerGrid';
import { DeleteConfirmDialog } from '@/components/DeleteConfirmDialog';
import { HeaderGrid } from '@/components/HeaderGrid';
import { Table } from '@/components/Table';
import { Checkbox } from '@/components/ui/checkbox';
import { toaster } from '@/components/ui/toaster';

import { TableProvider } from '@/contexts/TableContext';

import { useLanguage } from '@/hooks/useLanguage';
import { userPaginatedQuery } from '@/hooks/usePaginatedQueryStorage';
import { usePermissions } from '@/hooks/usePermissions';

import { checkLoadingStatus } from '@/utils/checkLoadingStatus';
import { downloadBlob } from '@/utils/downloadBlob';
import { extractApiErrorMessage } from '@/utils/extractApiErrorMessage';
import formatDate from '@/utils/formatDate';
import { styleColumTable } from '@/utils/style-colum-table';

import { markingStatusColor } from '@/constants/marcacao/marking/marking-status';
import { markingColorOptions } from '@/constants/marcacao/marking/options/marking-color-options';
import { markingStatusOptions } from '@/constants/marcacao/marking/options/marking-status-options';
import { queryKey } from '@/constants/query-key';

import { deleteMarking, downloadMarkingReport } from '@/services/v2/Marcacao/marking-service';

import type { MarkingData, MarkingFilterForm } from '@/@types/v2/Marcacao/marking';

import { FilterSideMarking } from './FilterSideMarking';
import { HeaderTable } from './HeaderTable';
import { MarkingActionsMenu } from './MarkingActionsMenu';
import { useMarkingsList } from './useMarkings';

import { PageHeader } from '@/components/ui/PageHeader';

const PAGE_SIZE_OPTIONS = [10, 30, 50, 100];

export default function MarkingsList() {
  const { languageGB } = useLanguage();
  const navigate = useNavigate();
  const { can } = usePermissions();
  const text = languageGB.marcacao.marking;

  const canView = can('markings_view');
  const canEdit = can('markings_edit');
  const canForecast = can('markings_forecast');
  const canDone = can('markings_done');
  const canDelete = can('markings_delete');

  // ---- Seleção múltipla (fundação TASK-MC-FE-07) ---------------------------
  const canBatchSelect = canForecast || canDone;
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});

  const handleRowSelectionChange: OnChangeFn<RowSelectionState> = (updater) => {
    const next = typeof updater === 'function' ? updater(rowSelection) : updater;
    setRowSelection(next);
  };

  const defaultQueryOptions = useMemo(
    () => ({
      pageSize: 10,
      storageKey: 'OperacionalMarcacao' + queryKey.marcacao.markings,
    }),
    []
  );

  const { paginatedQuery, handlePaginatedQuery, handleFilterChange, handleResetFilter } =
    userPaginatedQuery<MarkingFilterForm>(defaultQueryOptions);

  const { open: isFilterOpen, onOpen: onOpenFilter, onClose: onCloseFilter } = useDisclosure();

  // `*_label` são companions DISPLAY-ONLY de re-hidratação do
  // SelectAsyncPaginate — nunca contam como filtro aplicado (mesma regra de
  // `Operacional/Weaning/index.tsx`).
  const filtersApplied = useMemo(
    () =>
      Object.entries(paginatedQuery.filter ?? {})
        .filter(([key]) => !key.endsWith('_label'))
        .filter(([, v]) => v !== undefined && v !== null && v !== '').length,
    [paginatedQuery.filter]
  );

  const markingsList = useMarkingsList({
    paginatedQuery,
    setPaginatedQuery: handlePaginatedQuery,
    filter: paginatedQuery.filter ?? undefined,
  });

  const items = markingsList.data?.data?.items;

  const selectedRows = useMemo(
    () => (items ?? []).filter((item) => rowSelection[item.uuid]),
    [rowSelection, items]
  );

  // Gate CLM-BULK-CHECKBOX-GATE (parte 1 — status homogêneo). Ver nota de
  // cabeçalho sobre a parte 2 (forecast qty/date) não ser aplicável aqui.
  function isRowSelectable(row: MarkingData): boolean {
    if (selectedRows.length === 0) return true;
    return row.status === selectedRows[0].status;
  }

  const canBatchForecast = selectedRows.length > 0 && selectedRows.every((row) => row.status !== 3);
  const canBatchDone = selectedRows.length > 0 && selectedRows.every((row) => row.status === 2);

  function handleClickForecastBatch() {
    if (!canBatchForecast) return;
    navigate(
      `/operacional/marcacao/previsao-lote?ids=${selectedRows.map((r) => r.uuid).join(',')}`
    );
  }

  function handleClickDoneBatch() {
    if (!canBatchDone) return;
    navigate(
      `/operacional/marcacao/realizacao-lote?ids=${selectedRows.map((r) => r.uuid).join(',')}`
    );
  }

  // ---- Estado de exclusão --------------------------------------------------
  const queryClient = useQueryClient();
  const [toDelete, setToDelete] = useState<MarkingData | null>(null);
  const {
    open: isOpenDeleteDialog,
    onOpen: onOpenDeleteDialog,
    onClose: onCloseDeleteDialog,
  } = useDisclosure();

  const deleteMutation = useMutation({
    mutationFn: async (uuid: string) => deleteMarking(uuid),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [queryKey.marcacao.markings] });

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

  function handleDeleteClick(item: MarkingData) {
    setToDelete(item);
    onOpenDeleteDialog();
  }

  function handleConfirmDelete() {
    if (toDelete) {
      deleteMutation.mutate(toDelete.uuid);
    }
  }

  // ---- Impressão unitária (síncrono, blob — mirror `VendaAnimaisList`) ----
  const [downloadingReportUuid, setDownloadingReportUuid] = useState<string | null>(null);

  async function handleDownloadReport(item: MarkingData) {
    setDownloadingReportUuid(item.uuid);
    try {
      const blob = await downloadMarkingReport(item.uuid);
      downloadBlob(blob, `marcacao-${item.code ?? item.uuid}.pdf`);
    } catch {
      toaster.error({
        title: text.singularLabel,
        description: languageGB.common.errorLog.unknownError,
      });
    } finally {
      setDownloadingReportUuid(null);
    }
  }

  const columnHelper = createColumnHelper<MarkingData>();
  const defaultColumns = useMemo(
    () => [
      ...(canBatchSelect
        ? [
            columnHelper.display({
              id: 'select',
              header: '',
              enableHiding: false,
              cell: ({
                row,
              }: {
                row: {
                  original: MarkingData;
                  getIsSelected: () => boolean;
                  toggleSelected: () => void;
                };
              }) => (
                <Checkbox
                  checked={row.getIsSelected()}
                  onCheckedChange={() => row.toggleSelected()}
                  disabled={!isRowSelectable(row.original)}
                  aria-label={String(row.original.code ?? row.original.uuid)}
                />
              ),
              meta: { gridOrder: 'fixed-start' },
            }),
          ]
        : []),
      columnHelper.accessor('code', {
        header: text.list.table.code,
        cell: ({ row }) => <Text fontWeight="medium">{row.original.code ?? '-'}</Text>,
        meta: styleColumTable.sm,
      }),
      columnHelper.display({
        id: 'area',
        header: text.list.table.area,
        cell: ({ row }) => <Text lineClamp="1">{row.original.area.name}</Text>,
      }),
      columnHelper.display({
        id: 'responsible',
        header: text.list.table.responsible,
        cell: ({ row }) => <Text lineClamp="1">{row.original.user.name}</Text>,
      }),
      columnHelper.display({
        id: 'variety',
        header: text.list.table.variety,
        cell: ({ row }) => <Text lineClamp="1">{row.original.variety.name}</Text>,
      }),
      columnHelper.accessor('quantity', {
        header: text.list.table.quantity,
        cell: ({ row }) => <Text>{row.original.quantity}</Text>,
        meta: styleColumTable.sm,
      }),
      columnHelper.display({
        id: 'harvest',
        header: text.list.table.harvest,
        cell: ({ row }) => <Text lineClamp="1">{row.original.harvest.name}</Text>,
      }),
      columnHelper.display({
        id: 'week',
        header: text.list.table.week,
        cell: ({ row }) => <Text>{row.original.week_vintage.number_week}</Text>,
        meta: styleColumTable.sm,
      }),
      columnHelper.accessor('date', {
        header: text.list.table.date,
        cell: ({ row }) => <Text fontSize="sm">{formatDate(row.original.date)}</Text>,
        meta: styleColumTable.date,
      }),
      columnHelper.accessor('color', {
        header: text.list.table.color,
        cell: ({ row }) => (
          <Flex align="center" gap={2}>
            <Box
              boxSize={4}
              borderRadius="full"
              border="1px solid"
              borderColor="borderGrid"
              backgroundColor={row.original.color}
            />
            <Text fontSize="sm" lineClamp="1">
              {markingColorOptions.getLabel(row.original.color, languageGB)}
            </Text>
          </Flex>
        ),
        meta: styleColumTable.sm,
      }),
      columnHelper.accessor('status', {
        header: text.list.table.status,
        cell: ({ row }) => (
          <Badge colorPalette={markingStatusColor[row.original.status]} variant="subtle">
            {markingStatusOptions.getLabel(row.original.status, languageGB)}
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
              <MarkingActionsMenu
                canView={canView}
                canEdit={canEdit}
                canForecast={canForecast}
                canDone={canDone}
                canDelete={canDelete}
                status={item.status}
                isDeleting={isDeleting && toDelete?.uuid === item.uuid}
                labels={{
                  view: text.list.actions.view,
                  print: text.list.actions.print,
                  edit: text.list.actions.edit,
                  editDisabledTooltip: text.list.actions.editDisabledTooltip,
                  forecast: text.list.actions.forecast,
                  forecastDisabledTooltip: text.list.actions.forecastDisabledTooltip,
                  done: text.list.actions.done,
                  doneDisabledTooltip: text.list.actions.doneDisabledTooltip,
                  delete: text.list.actions.delete,
                }}
                onView={() => navigate(`/operacional/marcacao/${item.uuid}`)}
                onPrint={() => handleDownloadReport(item)}
                onEdit={() => navigate(`/operacional/marcacao/${item.uuid}`)}
                onForecast={() => navigate(`/operacional/marcacao/${item.uuid}/previsao`)}
                onDone={() => navigate(`/operacional/marcacao/${item.uuid}/realizado`)}
                onDelete={() => handleDeleteClick(item)}
              />
            </Flex>
          );
        },
        meta: styleColumTable.sm,
      }),
    ],
    [
      navigate,
      isDeleting,
      toDelete,
      text,
      canView,
      canEdit,
      canForecast,
      canDone,
      canDelete,
      canBatchSelect,
      languageGB,
      selectedRows,
      downloadingReportUuid,
    ]
  );

  const isLoading = checkLoadingStatus([markingsList]);
  const isEmpty = !isLoading && (items?.length ?? 0) === 0;

  return (
    <ContainerGrid>
      <TableProvider
        data={items}
        columns={defaultColumns}
        pagination={paginatedQuery}
        setPagination={handlePaginatedQuery}
        enableMultiRowSelection={canBatchSelect}
        getRowId={(row: MarkingData) => row.uuid}
        rowSelection={rowSelection}
        onRowSelectionChange={handleRowSelectionChange}
      >
        <HeaderGrid
          header={
            <HeaderTable
              onOpenFilter={onOpenFilter}
              filtersApplied={filtersApplied}
              languageGB={languageGB}
              filter={paginatedQuery.filter}
              batchForecast={
                canForecast
                  ? {
                      selectedCount: canBatchForecast ? selectedRows.length : 0,
                      onClick: handleClickForecastBatch,
                    }
                  : undefined
              }
              batchDone={
                canDone
                  ? {
                      selectedCount: canBatchDone ? selectedRows.length : 0,
                      onClick: handleClickDoneBatch,
                    }
                  : undefined
              }
            />
          }
        >
          <PageHeader title={text.list.pageTitle} description={text.list.pageSubtitle} />
        </HeaderGrid>

        <Box mt={6}>
          <Table
            isLoading={isLoading}
            isError={markingsList.isError}
            error={markingsList.error}
            isEmpty={isEmpty}
            onRetry={() => markingsList.refetch()}
            isRetrying={markingsList.isFetching}
            retryLabel={text.list.error.retry}
            emptyIcon={FiTag as ElementType}
            emptyTitle={
              filtersApplied > 0 ? text.list.emptyState.titleFiltered : text.list.emptyState.titleEmpty
            }
            emptyDescription={
              filtersApplied > 0
                ? text.list.emptyState.descriptionFiltered
                : text.list.emptyState.descriptionEmpty
            }
            canCreate={false}
            pageSizeOptions={PAGE_SIZE_OPTIONS}
          />
        </Box>
      </TableProvider>

      <FilterSideMarking
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
            ? text.deleteDialog.descriptionTemplate.replace('{code}', String(toDelete.code ?? ''))
            : undefined
        }
        hideQuestionMark
        tone="danger"
      />
    </ContainerGrid>
  );
}
