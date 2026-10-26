// src/pages/Financeiro/Congelamentos/index.tsx
// -----------------------------------------------------------------------------
// Tela de LISTAGEM (grid) de CONGELAMENTOS FINANCEIROS (FinancialFreeze —
// F-110, esteira 97-Esteiras/008, Tarefa 31). Rota: `/financeiro/congelamentos`
// (guardada por `financial-freeze_view`, item de menu `fin-cng` JÁ EXISTE —
// `navigationTree.ts`/`navigationPermissions.ts` INALTERADOS).
//
// Mirror estrutural de `Financeiro/Conciliacao/ImportacaoOfx/index.tsx`
// (mesmo módulo Financeiro, entrega mais recente do fork): `ContainerGrid` →
// `TableProvider` → `HeaderGrid` → `EmptyState`/`Table`, `useCustomGridQuery`
// + `userPaginatedQuery` + `useGridSettings` + `useGridStorageScope`,
// `Actions`/`Actions.Item`, `DeleteConfirmDialog`.
//
// Colunas (contrato de tela §5.1, mirror 1:1 do `list_manifest` legado):
// Mês, Ano, Responsável, Congelado?, Dt. Criação, Dt. Atualização + Ações.
// Ordenação FIXA no servidor (`year DESC, month DESC`) — a API não aceita
// `orderBy`, então NENHUM header é clicável e não há ordenação client-side.
//
// `month_label` do servidor (PT-BR fixo) NUNCA é consumido aqui — o rótulo
// da coluna Mês é derivado via `financialFreezeMonthOptions.getLabel`.
// -----------------------------------------------------------------------------

import { useMemo, useState } from 'react';

import { Badge, Box, EmptyState, Flex, Icon, Text, useDisclosure, VStack } from '@chakra-ui/react';
import { createColumnHelper } from '@tanstack/react-table';
import { FiEdit, FiEye, FiLock, FiTrash2 } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';

import { Actions } from '@/components/Action';
import { Button } from '@/components/Button';
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
import formatDate from '@/utils/formatDate';
import { styleColumTable } from '@/utils/style-colum-table';

import { financialFreezeStatusColor } from '@/constants/Financial/FinancialFreeze/financial-freeze-status';
import { financialFreezeMonthOptions } from '@/constants/Financial/FinancialFreeze/options/financial-freeze-month-options';
import { boolean as booleanOptions } from '@/constants/options/boolean';
import { queryKey } from '@/constants/query-key';

import {
  deleteFinancialFreeze,
  listFinancialFreezes,
} from '@/services/v2/FinancialFreeze/financial-freeze-service';
import type { ListFinancialFreezesParams } from '@/services/v2/FinancialFreeze/financial-freeze-service';

import type {
  FinancialFreezeFilterRequest,
  FinancialFreezeListItem,
} from '@/@types/v2/FinancialFreeze';

import { FilterSideCongelamentos } from './FilterSideCongelamentos';
import { HeaderTable } from './HeaderTable';

import { PageHeader } from '@/components/ui/PageHeader';

// Chave de storage desta tela — mirror `IMPORTACAO_OFX_STORAGE_KEY`.
const CONGELAMENTOS_STORAGE_KEY = 'FinanceiroCongelamentos' + queryKey.financial.financialFreezes;

function toRequestFilter(filter?: FinancialFreezeFilterRequest | null): ListFinancialFreezesParams {
  return {
    month: filter?.month || undefined,
    year: filter?.year || undefined,
  };
}

export default function CongelamentosList() {
  const { languageGB } = useLanguage();
  const navigate = useNavigate();
  const { can } = usePermissions();
  const text = languageGB.financial.financialFreeze;

  const canView = can('financial-freeze_view');
  const canEdit = can('financial-freeze_edit');
  const canDelete = can('financial-freeze_delete');

  const defaultQueryOptions = useMemo(
    () => ({ pageSize: 10, storageKey: CONGELAMENTOS_STORAGE_KEY }),
    []
  );

  const { paginatedQuery, handlePaginatedQuery, handleFilterChange, handleResetFilter } =
    userPaginatedQuery<FinancialFreezeFilterRequest>(defaultQueryOptions);

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

  const [toDelete, setToDelete] = useState<FinancialFreezeListItem | null>(null);
  const {
    open: isOpenDeleteDialog,
    onOpen: onOpenDeleteDialog,
    onClose: onCloseDeleteDialog,
  } = useDisclosure();

  const financialFreezesList = useCustomGridQuery<
    FinancialFreezeListItem,
    ListFinancialFreezesParams
  >({
    asyncFunction: listFinancialFreezes,
    queryKey: queryKey.financial.financialFreezes,
    paginatedQuery,
    setPaginatedQuery: handlePaginatedQuery,
    filterQuery: [],
    filter: requestFilter,
  });

  // `useDeleted` NÃO existe no fork (busca negativa confirmada) — exclusão é
  // `useRequest({ typesRequest: 'update' })`, mirror `ImportacaoOfxList`.
  const deleteMutation = useRequest({
    asyncFunction: async ({ financialFreezeUuid }: { financialFreezeUuid: string }) => {
      return await deleteFinancialFreeze(financialFreezeUuid);
    },
    queryKey: queryKey.financial.financialFreezes,
    queryKey2: queryKey.financial.financialFreeze,
    typesRequest: 'update',
    entityName: text.singularLabel,
    personalizedMessage: text.list.deletedToast,
    actionSuccess: () => {
      onCloseDeleteDialog();
      setToDelete(null);
    },
  });

  const handleDeleteClick = (item: FinancialFreezeListItem) => {
    setToDelete(item);
    onOpenDeleteDialog();
  };

  const handleConfirmDelete = () => {
    if (toDelete) deleteMutation.mutate({ financialFreezeUuid: toDelete.uuid });
  };

  const isDeleting = deleteMutation.isPending;

  const columnHelper = createColumnHelper<FinancialFreezeListItem>();
  const defaultColumns = useMemo(
    () => [
      columnHelper.accessor('month', {
        header: text.list.table.month,
        // Rótulo derivado no front via fábrica i18n — `month_label` do
        // servidor (PT-BR fixo) NÃO é consumido (contrato de tela §5.1).
        cell: ({ row }) => (
          <Text fontSize="sm">
            {financialFreezeMonthOptions.getLabel(row.original.month, languageGB)}
          </Text>
        ),
        meta: { ...styleColumTable.sm, gridLabel: text.list.table.month },
      }),
      columnHelper.accessor('year', {
        header: text.list.table.year,
        cell: ({ row }) => <Text fontSize="sm">{row.original.year}</Text>,
        meta: { ...styleColumTable.sm, gridLabel: text.list.table.year },
      }),
      columnHelper.accessor('responsible_name', {
        header: text.list.table.responsible,
        cell: ({ row }) => (
          <Text fontSize="sm" color="fg.muted">
            {row.original.responsible_name ?? '—'}
          </Text>
        ),
        enableHiding: false,
        meta: { gridLabel: text.list.table.responsible },
      }),
      columnHelper.accessor('is_frozen', {
        header: text.list.table.isFrozen,
        cell: ({ row }) => (
          <Badge
            colorPalette={financialFreezeStatusColor[String(row.original.is_frozen)] ?? 'gray'}
            variant="subtle"
          >
            {booleanOptions.getLabel(row.original.is_frozen, languageGB)}
          </Badge>
        ),
        meta: { ...styleColumTable.sm, gridLabel: text.list.table.isFrozen },
      }),
      columnHelper.accessor('created_at', {
        header: text.list.table.createdAt,
        cell: ({ row }) => (
          <Text fontSize="sm" color="fg.muted">
            {formatDate(row.original.created_at)}
          </Text>
        ),
        meta: { ...styleColumTable.date, gridLabel: text.list.table.createdAt },
      }),
      columnHelper.accessor('updated_at', {
        header: text.list.table.updatedAt,
        cell: ({ row }) => (
          <Text fontSize="sm" color="fg.muted">
            {formatDate(row.original.updated_at)}
          </Text>
        ),
        meta: { ...styleColumTable.date, gridLabel: text.list.table.updatedAt },
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
                  onClick={() =>
                    navigate(`/financeiro/congelamentos/${row.original.uuid}/visualizar`)
                  }
                >
                  {text.list.actions.view}
                </Actions.Item>
              )}
              {canEdit && (
                <Actions.Item
                  icon={<Icon as={FiEdit} />}
                  onClick={() => navigate(`/financeiro/congelamentos/${row.original.uuid}`)}
                >
                  {text.list.actions.edit}
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
                    {text.list.actions.delete}
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
    [navigate, isDeleting, languageGB, canView, canEdit, canDelete, text]
  );

  const gridSettings = useGridSettings<FinancialFreezeListItem>({
    storageKey: CONGELAMENTOS_STORAGE_KEY,
    storageScope: useGridStorageScope(),
    columns: defaultColumns,
  });
  const { columnOrder, setColumnOrder, columnVisibility, setColumnVisibility } = gridSettings;

  const isLoading = checkLoadingStatus([financialFreezesList]);
  const items = financialFreezesList.data?.data?.items;
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
              gridSettings={gridSettings}
            />
          }
        >
          <PageHeader title={text.list.pageTitle} description={text.list.pageSubtitle} />
        </HeaderGrid>

        <Box mt={6}>
          {isEmpty && !financialFreezesList.isError ? (
            <EmptyState.Root>
              <EmptyState.Content>
                <EmptyState.Indicator>
                  <Icon as={FiLock} boxSize={8} color="fg.muted" />
                </EmptyState.Indicator>
                <VStack textAlign="center" gap={1}>
                  <EmptyState.Title>
                    {filtersApplied > 0
                      ? text.list.emptyState.titleFiltered
                      : text.list.emptyState.titleEmpty}
                  </EmptyState.Title>
                  <EmptyState.Description>
                    {filtersApplied > 0
                      ? text.list.emptyState.descriptionFiltered
                      : text.list.emptyState.descriptionEmpty}
                  </EmptyState.Description>
                </VStack>
                {filtersApplied === 0 && can('financial-freeze_create') && (
                  <Button
                    title={text.list.emptyState.cta}
                    size="sm"
                    onClick={() => navigate('/financeiro/congelamentos/novo')}
                  />
                )}
              </EmptyState.Content>
            </EmptyState.Root>
          ) : (
            <Table
              isLoading={isLoading}
              isError={financialFreezesList.isError}
              error={financialFreezesList.error}
              onRetry={() => financialFreezesList.refetch()}
              isRetrying={financialFreezesList.isFetching}
            />
          )}
        </Box>
      </TableProvider>

      <FilterSideCongelamentos
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
        itemName={
          toDelete
            ? `${financialFreezeMonthOptions.getLabel(toDelete.month, languageGB)}/${toDelete.year}`
            : undefined
        }
        tone="danger"
      />
    </ContainerGrid>
  );
}
