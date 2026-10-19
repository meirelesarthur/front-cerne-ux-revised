// src/pages/Financeiro/BudgetPlanning/index.tsx
// -----------------------------------------------------------------------------
// Tela de LISTAGEM (grid) de Prev. Orçamentária (BudgetPlanning — F-106,
// esteira 97-Esteiras/067, TASK-PO-FE-06). Rota: `/financeiro/previsao`
// (guardada por `budget-plannings_view`, item de menu `fin-pre` JÁ EXISTE —
// `navigationTree.ts`/`navigationPermissions.ts` INALTERADOS).
//
// Mirror estrutural de `Financeiro/Congelamentos/index.tsx` (mesmo módulo
// Financeiro, sibling mais próximo do mesmo formato de casca): `ContainerGrid`
// → `TableProvider` → `HeaderGrid` → `EmptyState`/`Table`, `useCustomGridQuery`
// + `userPaginatedQuery` + `useGridSettings` + `useGridStorageScope`,
// `Actions`/`Actions.Item`, `DeleteConfirmDialog`. NÃO mirror de
// `ContasAPagar/index.tsx` (mesmo módulo Financeiro, mas com seleção
// múltipla/baixa/documentos que NÃO existem nesta feature — ver Leitura do
// dev da Tarefa).
//
// Colunas (contrato de tela §6, mirror 1:1 do `list_manifest` legado): code,
// date (`dd/mm/yyyy`), year, Responsável (pode vir `null` — fallback "—") +
// Ações (dropdown: Visualizar/Exportar `budget-plannings_view`, Editar
// `_edit`, Excluir `_delete`).
//
// Filtro (`FilterSideBudgetPlanning`, Contrato B) — SÓ `year`
// (`BudgetPlanningIndexRequest` não aceita outro campo, mirror fiel — não há
// `filter_manifest` de UI no legado).
//
// Exportar (linha) — `exportBudgetPlanning(uuid)` → blob → `downloadBlob`,
// ação de LEITURA (não passa por `useRequest`/invalidação), loading POR LINHA
// (mirror `handleGenerateReceipt` de `ContasAPagar/index.tsx`).
// -----------------------------------------------------------------------------

import { useMemo, useState } from 'react';

import { Box, EmptyState, Flex, Icon, Text, useDisclosure, VStack } from '@chakra-ui/react';
import { createColumnHelper } from '@tanstack/react-table';
import { FiClipboard, FiDownload, FiEdit, FiEye, FiTrash2 } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';

import { Actions } from '@/components/Action';
import { Button } from '@/components/Button';
import { ContainerGrid } from '@/components/ContainerGrid';
import { DeleteConfirmDialog } from '@/components/DeleteConfirmDialog';
import { HeaderGrid } from '@/components/HeaderGrid';
import { Table } from '@/components/Table';
import { toaster } from '@/components/ui/toaster';

import { TableProvider } from '@/contexts/TableContext';

import { useCustomGridQuery } from '@/hooks/useCustomGridQuery';
import { useGridSettings } from '@/hooks/useGridSettings';
import { useGridStorageScope } from '@/hooks/useGridStorageScope';
import { useLanguage } from '@/hooks/useLanguage';
import { userPaginatedQuery } from '@/hooks/usePaginatedQueryStorage';
import { usePermissions } from '@/hooks/usePermissions';
import { useRequest } from '@/hooks/useRequest';

import { checkLoadingStatus } from '@/utils/checkLoadingStatus';
import { downloadBlob } from '@/utils/downloadBlob';
import formatDate from '@/utils/formatDate';
import { styleColumTable } from '@/utils/style-colum-table';

import { queryKey } from '@/constants/query-key';

import {
  deleteBudgetPlanning,
  exportBudgetPlanning,
  getAllBudgetPlannings,
} from '@/services/v2/Financeiro/budget-planning-service';
import type { ListBudgetPlanningsParams } from '@/services/v2/Financeiro/budget-planning-service';

import type {
  BudgetPlanningFilterRequest,
  BudgetPlanningListData,
} from '@/@types/v2/Financeiro/budgetPlanning';

import { FilterSideBudgetPlanning } from './FilterSideBudgetPlanning';
import { HeaderBudgetPlanningTable } from './HeaderBudgetPlanningTable';

// Chave de storage desta tela — mirror `CONGELAMENTOS_STORAGE_KEY`.
const BUDGET_PLANNING_STORAGE_KEY = 'FinanceiroBudgetPlanning' + queryKey.financial.budgetPlannings;

function toRequestFilter(filter?: BudgetPlanningFilterRequest | null): ListBudgetPlanningsParams {
  return {
    year: filter?.year || undefined,
  };
}

export default function BudgetPlanningList() {
  const { languageGB } = useLanguage();
  const navigate = useNavigate();
  const { can } = usePermissions();
  const text = languageGB.financial.budgetPlanning;

  const canView = can('budget-plannings_view');
  const canEdit = can('budget-plannings_edit');
  const canDelete = can('budget-plannings_delete');
  const canCreate = can('budget-plannings_create');

  const defaultQueryOptions = useMemo(
    () => ({ pageSize: 10, storageKey: BUDGET_PLANNING_STORAGE_KEY }),
    []
  );

  const { paginatedQuery, handlePaginatedQuery, handleFilterChange, handleResetFilter } =
    userPaginatedQuery<BudgetPlanningFilterRequest>(defaultQueryOptions);

  const { open: isFilterOpen, onOpen: onOpenFilter, onClose: onCloseFilter } = useDisclosure();

  const filtersApplied = useMemo(
    () =>
      Object.entries(paginatedQuery.filter ?? {})
        .map(([, v]) => v)
        .filter((v) => v !== undefined && v !== null && v !== '').length,
    [paginatedQuery.filter]
  );

  const requestFilter = useMemo(
    () => toRequestFilter(paginatedQuery.filter),
    [paginatedQuery.filter]
  );

  const [toDelete, setToDelete] = useState<BudgetPlanningListData | null>(null);
  const {
    open: isOpenDeleteDialog,
    onOpen: onOpenDeleteDialog,
    onClose: onCloseDeleteDialog,
  } = useDisclosure();

  // `useCustomGridQuery` — SEM ID de contexto (`year` é filtro comum, não um
  // ID pai), mirror `financialFreezesList`.
  const budgetPlanningsList = useCustomGridQuery<BudgetPlanningListData, ListBudgetPlanningsParams>(
    {
      asyncFunction: getAllBudgetPlannings,
      queryKey: queryKey.financial.budgetPlannings,
      paginatedQuery,
      setPaginatedQuery: handlePaginatedQuery,
      filterQuery: [],
      filter: requestFilter,
    }
  );

  // Hard delete (sem soft delete, fiel ao legado) — `useRequest({ typesRequest:
  // 'update' })`, mirror `Congelamentos/index.tsx` (`useDeleted` NÃO existe
  // no fork V3).
  const deleteMutation = useRequest({
    asyncFunction: async ({ budgetPlanningUuid }: { budgetPlanningUuid: string }) => {
      return await deleteBudgetPlanning(budgetPlanningUuid);
    },
    queryKey: queryKey.financial.budgetPlannings,
    queryKey2: queryKey.financial.budgetPlanning,
    typesRequest: 'update',
    entityName: text.singularLabel,
    personalizedMessage: text.toasts.deleteSuccess,
    actionSuccess: () => {
      onCloseDeleteDialog();
      setToDelete(null);
    },
  });

  const isDeleting = deleteMutation.isPending;

  function handleDeleteClick(item: BudgetPlanningListData) {
    setToDelete(item);
    onOpenDeleteDialog();
  }

  function handleConfirmDelete() {
    if (toDelete) deleteMutation.mutate({ budgetPlanningUuid: toDelete.uuid });
  }

  // ---- Exportar (linha) — ação de LEITURA (download direto do blob), NÃO
  // passa por `useRequest`/invalidação de query. Loading POR LINHA, mirror
  // `handleGenerateReceipt` de `ContasAPagar/index.tsx`. ----
  const [exportingUuid, setExportingUuid] = useState<string | null>(null);

  async function handleExportClick(item: BudgetPlanningListData) {
    if (exportingUuid) return;
    setExportingUuid(item.uuid);
    try {
      const blob = await exportBudgetPlanning(item.uuid);
      downloadBlob(blob, `${item.code}.xlsx`);
    } catch {
      toaster.error({
        title: text.actions.export,
        description: languageGB.common.errorLog.unknownError,
      });
    } finally {
      setExportingUuid(null);
    }
  }

  const columnHelper = createColumnHelper<BudgetPlanningListData>();
  const defaultColumns = useMemo(
    () => [
      columnHelper.accessor('code', {
        header: text.list.table.code,
        cell: ({ row }) => (
          <Text fontSize="sm" fontWeight="medium">
            {row.original.code}
          </Text>
        ),
        meta: { ...styleColumTable.sm, gridLabel: text.list.table.code },
      }),
      columnHelper.accessor('date', {
        header: text.list.table.date,
        cell: ({ row }) => (
          <Text fontSize="sm">{row.original.date ? formatDate(row.original.date) : '—'}</Text>
        ),
        meta: { ...styleColumTable.date, gridLabel: text.list.table.date },
      }),
      columnHelper.accessor('year', {
        header: text.list.table.year,
        cell: ({ row }) => <Text fontSize="sm">{row.original.year}</Text>,
        meta: { ...styleColumTable.sm, gridLabel: text.list.table.year },
      }),
      columnHelper.accessor('responsavel', {
        header: text.list.table.responsavel,
        cell: ({ row }) => (
          <Text fontSize="sm" color="fg.muted">
            {row.original.responsavel ?? '—'}
          </Text>
        ),
        enableHiding: false,
        meta: { gridLabel: text.list.table.responsavel },
      }),
      columnHelper.display({
        id: 'acoes',
        header: '',
        enableHiding: false,
        cell: ({ row }) => (
          <Flex justify="flex-end">
            <Actions size="sm">
              {canView && (
                <Actions.Item
                  icon={<Icon as={FiEye} />}
                  onClick={() => navigate(`/financeiro/previsao/${row.original.uuid}/visualizar`)}
                >
                  {text.actions.view}
                </Actions.Item>
              )}
              {canView && (
                <Actions.Item
                  icon={<Icon as={FiDownload} />}
                  onClick={() => handleExportClick(row.original)}
                  disabled={exportingUuid === row.original.uuid}
                >
                  {text.actions.export}
                </Actions.Item>
              )}
              {canEdit && (
                <Actions.Item
                  icon={<Icon as={FiEdit} />}
                  onClick={() => navigate(`/financeiro/previsao/${row.original.uuid}`)}
                >
                  {text.actions.edit}
                </Actions.Item>
              )}
              {canDelete && (
                <>
                  <Actions.Separator />
                  <Actions.Item
                    icon={<Icon as={FiTrash2} />}
                    onClick={() => handleDeleteClick(row.original)}
                    tone="danger"
                    disabled={isDeleting}
                  >
                    {text.actions.delete}
                  </Actions.Item>
                </>
              )}
            </Actions>
          </Flex>
        ),
        meta: {
          ...styleColumTable.sm,
          gridLabel: languageGB.defaltStrings.actions,
          gridOrder: 'fixed-end',
          gridDataColumn: false,
        },
      }),
    ],
    [navigate, isDeleting, exportingUuid, languageGB, canView, canEdit, canDelete, text]
  );

  const gridSettings = useGridSettings<BudgetPlanningListData>({
    storageKey: BUDGET_PLANNING_STORAGE_KEY,
    storageScope: useGridStorageScope(),
    columns: defaultColumns,
  });
  const { columnOrder, setColumnOrder, columnVisibility, setColumnVisibility } = gridSettings;

  const isLoading = checkLoadingStatus([budgetPlanningsList]);
  const isError = budgetPlanningsList.isError;
  const items = budgetPlanningsList.data?.data?.items;
  const isEmpty = !isLoading && !isError && (items?.length ?? 0) === 0;

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
            <HeaderBudgetPlanningTable
              onOpenFilter={onOpenFilter}
              filtersApplied={filtersApplied}
              languageGB={languageGB}
              gridSettings={gridSettings}
            />
          }
        >
          <VStack align="flex-start" gap={1}>
            <Text fontSize="2xl" fontWeight="bold" color="brandColorText">
              {text.titleModule}
            </Text>
          </VStack>
        </HeaderGrid>

        <Box mt={6}>
          {isEmpty && !isError ? (
            <EmptyState.Root>
              <EmptyState.Content>
                <EmptyState.Indicator>
                  <Icon as={FiClipboard} boxSize={8} color="fg.muted" />
                </EmptyState.Indicator>
                <VStack textAlign="center" gap={1}>
                  <EmptyState.Title>{text.list.emptyState.title}</EmptyState.Title>
                </VStack>
                {filtersApplied === 0 && canCreate && (
                  <Button
                    title={languageGB.defaltStrings.new}
                    size="sm"
                    onClick={() => navigate('/financeiro/previsao/create')}
                  />
                )}
              </EmptyState.Content>
            </EmptyState.Root>
          ) : (
            <Table
              isLoading={isLoading}
              isError={budgetPlanningsList.isError}
              error={budgetPlanningsList.error}
              onRetry={() => budgetPlanningsList.refetch()}
              isRetrying={budgetPlanningsList.isFetching}
            />
          )}
        </Box>
      </TableProvider>

      <FilterSideBudgetPlanning
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
