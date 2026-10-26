// src/pages/BaseRegistrations/ReversalExpenses/index.tsx
// -----------------------------------------------------------------------------
// Tela de LISTAGEM (grid) de ESTORNO — Cadastros Base / Gerais.
// Rota: /cadastros-base/estorno (guardada por `reversal_view`, registrada em
// TASK-FE-064 — este arquivo não mexe em rota/menu).
//
// Mirror mecânico de CadastrosBase/Armazem/index.tsx, SIMPLIFICADO
// (ReversalExpense-contrato.md v1.0 §16):
//   - Colunas na MESMA ORDEM do legado (`reverse/index.blade.php:31-34`):
//     Descrição → Usa Kg → Ativo → Valor (alinhado à direita) → Ações;
//   - SEM coluna/filtro `type` — campo nem exposto pelo
//     `ReversalExpenseResource` (D1/D7 do contrato), diferente de `Warehouse`;
//   - Coluna "Ativo" usa Badge Ativo/Inativo (verde/cinza), convenção já
//     consolidada em todos os grids do projeto (Warehouse.is_active,
//     PaymentTerm.is_enabled, Activity.is_enabled) — prevalece sobre o texto
//     plano "Sim/Não" do Blade legado (`reverse/index.blade.php:42`);
//   - Coluna "Usa Kg" (`use_kg`) usa texto simples Sim/Não — sem precedente
//     de Badge em nenhum módulo já migrado para este campo.
// -----------------------------------------------------------------------------

import { useMemo, useState } from 'react';

import { ElementType } from 'react';

import { Badge, Box, Flex, Icon, Text, useDisclosure } from '@chakra-ui/react';
import { createColumnHelper } from '@tanstack/react-table';
import { FiEdit, FiRotateCcw, FiTrash2 } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';

import { Actions } from '@/components/Action';
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
import { styleColumTable } from '@/utils/style-colum-table';

import { queryKey } from '@/constants/query-key';

import {
  deleteReversalExpense,
  listReversalExpenses,
} from '@/services/v2/BaseRegistrations/reversalExpenses-service';

import type {
  ReversalExpenseFilterForm,
  ReversalExpenseListItem,
} from '@/@types/v2/BaseRegistrations/reversalExpenses';

import { FilterSideReversalExpenses } from './FilterSideReversalExpenses';
import { HeaderTable } from './HeaderTable';

import { PageHeader } from '@/components/ui/PageHeader';

// Chave de storage estável da personalização de grid desta tela (independente
// de idioma), espelhando o padrão de CadastrosBase/CentroCusto.
const REVERSAL_EXPENSES_GRID_STORAGE_KEY = 'GBCerneBaseRegistrationsReversalExpenses';

export default function ReversalExpensesList() {
  const { languageGB } = useLanguage();
  const navigate = useNavigate();
  const { can } = usePermissions();
  const text = languageGB.baseRegistrations.reversalExpense;

  const canCreate = can('reversal_create');

  const defaultQueryOptions = useMemo(
    () => ({
      pageSize: 10,
      storageKey:
        languageGB.baseRegistrations.titleModule + queryKey.baseRegistrations.reversalExpenses,
    }),
    []
  );

  const { paginatedQuery, handlePaginatedQuery, handleFilterChange, handleResetFilter } =
    userPaginatedQuery<ReversalExpenseFilterForm>(defaultQueryOptions);

  // ---- Estado de filtro (drawer) ------------------------------------------
  const { open: isFilterOpen, onOpen: onOpenFilter, onClose: onCloseFilter } = useDisclosure();

  const filtersApplied = useMemo(
    () =>
      Object.values(paginatedQuery.filter ?? {}).filter(
        (v) => v !== undefined && v !== null && v !== '' && v !== false
      ).length,
    [paginatedQuery.filter]
  );

  // ---- Estado de exclusão --------------------------------------------------
  const [toDelete, setToDelete] = useState<ReversalExpenseListItem | null>(null);
  const {
    open: isOpenDeleteDialog,
    onOpen: onOpenDeleteDialog,
    onClose: onCloseDeleteDialog,
  } = useDisclosure();

  const reversalExpensesList = useCustomGridQuery<
    ReversalExpenseListItem,
    ReversalExpenseFilterForm
  >({
    asyncFunction: listReversalExpenses,
    queryKey: queryKey.baseRegistrations.reversalExpenses,
    paginatedQuery,
    setPaginatedQuery: handlePaginatedQuery,
    filterQuery: [],
    filter: paginatedQuery.filter ?? ({} as ReversalExpenseFilterForm),
  });

  const deleteMutation = useRequest({
    asyncFunction: async ({ reversalExpenseUuid }: { reversalExpenseUuid: string }) => {
      return await deleteReversalExpense(reversalExpenseUuid);
    },
    queryKey: queryKey.baseRegistrations.reversalExpenses,
    queryKey2: queryKey.baseRegistrations.reversalExpense,
    // `useRequest`'s TypesRequest não tem variante "delete" — "update" é a
    // única opção compilável e o mesmo truque já usado por Armazem/
    // CondicoesPagamento para a mesma operação. O texto exibido no toast vem
    // de `personalizedMessage`, então o rótulo genérico de "update" nunca
    // aparece ao usuário.
    typesRequest: 'update',
    entityName: text.singularLabel,
    personalizedMessage: text.list.deletedToast,
    actionSuccess: () => {
      onCloseDeleteDialog();
      setToDelete(null);
    },
  });

  const handleDeleteClick = (reversalExpense: ReversalExpenseListItem) => {
    setToDelete(reversalExpense);
    onOpenDeleteDialog();
  };

  const handleConfirmDelete = () => {
    if (toDelete) {
      deleteMutation.mutate({ reversalExpenseUuid: toDelete.uuid });
    }
  };

  const isDeleting = deleteMutation.isPending;

  const columnHelper = createColumnHelper<ReversalExpenseListItem>();
  const defaultColumns = useMemo(
    () => [
      columnHelper.accessor('description', {
        header: text.list.table.description,
        cell: ({ row }) => (
          <Text fontWeight="medium" lineClamp="1">
            {row.original.description}
          </Text>
        ),
        meta: { gridLabel: text.list.table.description },
      }),
      columnHelper.accessor('use_kg', {
        header: text.list.table.useKg,
        cell: ({ row }) => (
          <Text fontSize="sm">
            {row.original.use_kg ? text.list.table.yes : text.list.table.no}
          </Text>
        ),
        meta: { ...styleColumTable.sm, gridLabel: text.list.table.useKg },
      }),
      columnHelper.accessor('is_enabled', {
        header: text.list.table.isEnabled,
        cell: ({ row }) => (
          <Badge
            colorPalette={row.original.is_enabled ? 'green' : 'gray'}
            variant="subtle"
            py={1}
            px={3}
          >
            {row.original.is_enabled ? text.list.table.active : text.list.table.inactive}
          </Badge>
        ),
        meta: { ...styleColumTable.sm, gridLabel: text.list.table.isEnabled },
      }),
      columnHelper.accessor('value', {
        header: text.list.table.value,
        cell: ({ row }) => (
          <Text textAlign="right">
            {Number(row.original.value).toLocaleString('pt-BR', {
              style: 'currency',
              currency: 'BRL',
            })}
          </Text>
        ),
        meta: { ...styleColumTable.sm, gridLabel: text.list.table.value },
      }),
      columnHelper.display({
        id: 'acoes',
        header: '',
        enableHiding: false,
        cell: ({ row }) => (
          <Flex justify="flex-end">
            <Actions size="sm">
              {can('reversal_edit') && (
                <Actions.Item
                  icon={<Icon as={FiEdit} />}
                  onClick={() => navigate(`/cadastros-base/estorno/${row.original.uuid}`)}
                >
                  {text.list.actions.edit}
                </Actions.Item>
              )}
              {can('reversal_delete') && (
                <Actions.Item
                  icon={<Icon as={FiTrash2} />}
                  onClick={() => handleDeleteClick(row.original)}
                  color="red.400"
                  disabled={isDeleting}
                >
                  {text.list.actions.delete}
                </Actions.Item>
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
    [navigate, isDeleting, text, can, languageGB.defaltStrings.actions]
  );

  const gridSettings = useGridSettings<ReversalExpenseListItem>({
    storageKey: REVERSAL_EXPENSES_GRID_STORAGE_KEY,
    storageScope: useGridStorageScope(),
    columns: defaultColumns,
  });
  const { columnOrder, setColumnOrder, columnVisibility, setColumnVisibility } = gridSettings;

  const isLoading = checkLoadingStatus([reversalExpensesList]);
  const items = reversalExpensesList.data?.data?.items;
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
          <Table
            isLoading={isLoading}
            isError={reversalExpensesList.isError}
            error={reversalExpensesList.error}
            isEmpty={isEmpty}
            onRetry={() => reversalExpensesList.refetch()}
            isRetrying={reversalExpensesList.isFetching}
            emptyIcon={FiRotateCcw as ElementType}
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
            onCreate={() => navigate('/cadastros-base/estorno/novo')}
          />
        </Box>
      </TableProvider>

      <FilterSideReversalExpenses
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
        itemName={toDelete?.description}
      />
    </ContainerGrid>
  );
}
