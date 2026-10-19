// src/pages/BaseRegistrations/ServiceExpenses/index.tsx
// -----------------------------------------------------------------------------
// Tela de LISTAGEM (grid) de SERVIÇOS — Cadastros Base / Gerais.
// Rota: /cadastros-base/servicos (guardada por `service_view`, registrada em
// TASK-FE-133 — este arquivo não mexe em rota/menu).
//
// Mirror mecânico de CadastrosBase/Estorno/index.tsx (ServiceExpense-
// contrato.md v1.1 §15), COM 2 COLUNAS EXTRAS:
//   - Colunas na MESMA ORDEM do legado (`service/index.blade.php:31-37`):
//     Descrição → Usa Kg → Ativo → Pagamento de Equipe → Tem Comissão →
//     Valor (alinhado à direita) → Ações;
//   - SEM coluna `commission` (o valor percentual não aparece na grid legada,
//     só o flag `has_commission`) — fidelidade estrita, não inventar coluna;
//   - Coluna "Ativo" usa Badge Ativo/Inativo (verde/cinza), convenção já
//     consolidada no projeto;
//   - "Usa Kg"/"Pagamento de Equipe"/"Tem Comissão" usam texto simples
//     Sim/Não — sem precedente de Badge para esses campos.
// -----------------------------------------------------------------------------

import { useMemo, useState, type ElementType } from 'react';

import { Badge, Box, Flex, Icon, Text, useDisclosure, VStack } from '@chakra-ui/react';
import { createColumnHelper } from '@tanstack/react-table';
import { FiEdit, FiTool, FiTrash2 } from 'react-icons/fi';
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
  deleteServiceExpense,
  listServiceExpenses,
} from '@/services/v2/BaseRegistrations/serviceExpense-service';

import type {
  ServiceExpenseFilterForm,
  ServiceExpenseListItem,
} from '@/@types/v2/BaseRegistrations/serviceExpense';

import { FilterSideServiceExpenses } from './FilterSideServiceExpenses';
import { HeaderTable } from './HeaderTable';

// Chave de storage desta tela. Paginação (`userPaginatedQuery`) e
// personalização de grid (`useGridSettings`) derivam da MESMA expressão para
// nunca divergirem.
const SERVICE_EXPENSES_STORAGE_KEY =
  'GBCerneBaseRegistrationsServiceExpenses' + queryKey.baseRegistrations.serviceExpenses;

export default function ServiceExpensesList() {
  const { languageGB } = useLanguage();
  const navigate = useNavigate();
  const { can } = usePermissions();
  const text = languageGB.baseRegistrations.serviceExpense;

  const canCreate = can('service_create');

  const defaultQueryOptions = useMemo(
    () => ({
      pageSize: 10,
      storageKey: SERVICE_EXPENSES_STORAGE_KEY,
    }),
    []
  );

  const { paginatedQuery, handlePaginatedQuery, handleFilterChange, handleResetFilter } =
    userPaginatedQuery<ServiceExpenseFilterForm>(defaultQueryOptions);

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
  const [toDelete, setToDelete] = useState<ServiceExpenseListItem | null>(null);
  const {
    open: isOpenDeleteDialog,
    onOpen: onOpenDeleteDialog,
    onClose: onCloseDeleteDialog,
  } = useDisclosure();

  const serviceExpensesList = useCustomGridQuery<ServiceExpenseListItem, ServiceExpenseFilterForm>({
    asyncFunction: listServiceExpenses,
    queryKey: queryKey.baseRegistrations.serviceExpenses,
    paginatedQuery,
    setPaginatedQuery: handlePaginatedQuery,
    filterQuery: [],
    filter: paginatedQuery.filter ?? ({} as ServiceExpenseFilterForm),
  });

  const deleteMutation = useRequest({
    asyncFunction: async ({ serviceExpenseUuid }: { serviceExpenseUuid: string }) => {
      return await deleteServiceExpense(serviceExpenseUuid);
    },
    queryKey: queryKey.baseRegistrations.serviceExpenses,
    queryKey2: queryKey.baseRegistrations.serviceExpense,
    // `useRequest`'s TypesRequest não tem variante "delete" — "update" é a
    // única opção compilável e o mesmo truque já usado por Estorno/Armazem
    // para a mesma operação. O texto exibido no toast vem de
    // `personalizedMessage`, então o rótulo genérico de "update" nunca
    // aparece ao usuário.
    typesRequest: 'update',
    entityName: text.singularLabel,
    personalizedMessage: text.list.deletedToast,
    actionSuccess: () => {
      onCloseDeleteDialog();
      setToDelete(null);
    },
  });

  const handleDeleteClick = (serviceExpense: ServiceExpenseListItem) => {
    setToDelete(serviceExpense);
    onOpenDeleteDialog();
  };

  const handleConfirmDelete = () => {
    if (toDelete) {
      deleteMutation.mutate({ serviceExpenseUuid: toDelete.uuid });
    }
  };

  const isDeleting = deleteMutation.isPending;

  const columnHelper = createColumnHelper<ServiceExpenseListItem>();
  const defaultColumns = useMemo(
    () => [
      columnHelper.accessor('description', {
        header: text.list.table.description,
        enableHiding: false,
        meta: { gridLabel: text.list.table.description },
        cell: ({ row }) => (
          <Text fontWeight="medium" lineClamp="1">
            {row.original.description}
          </Text>
        ),
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
      columnHelper.accessor('pay_team', {
        header: text.list.table.payTeam,
        cell: ({ row }) => (
          <Text fontSize="sm">
            {row.original.pay_team ? text.list.table.yes : text.list.table.no}
          </Text>
        ),
        meta: { ...styleColumTable.sm, gridLabel: text.list.table.payTeam },
      }),
      columnHelper.accessor('has_commission', {
        header: text.list.table.hasCommission,
        cell: ({ row }) => (
          <Text fontSize="sm">
            {row.original.has_commission ? text.list.table.yes : text.list.table.no}
          </Text>
        ),
        meta: { ...styleColumTable.sm, gridLabel: text.list.table.hasCommission },
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
              {can('service_edit') && (
                <Actions.Item
                  icon={<Icon as={FiEdit} />}
                  onClick={() => navigate(`/cadastros-base/servicos/${row.original.uuid}`)}
                >
                  {text.list.actions.edit}
                </Actions.Item>
              )}
              {can('service_delete') && (
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
    [navigate, isDeleting, languageGB.defaltStrings.actions, text, can]
  );

  const gridSettings = useGridSettings<ServiceExpenseListItem>({
    storageKey: SERVICE_EXPENSES_STORAGE_KEY,
    storageScope: useGridStorageScope(),
    columns: defaultColumns,
  });
  const { columnOrder, setColumnOrder, columnVisibility, setColumnVisibility } = gridSettings;

  const isLoading = checkLoadingStatus([serviceExpensesList]);
  const items = serviceExpensesList.data?.data?.items;
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
            isError={serviceExpensesList.isError}
            error={serviceExpensesList.error}
            isEmpty={isEmpty}
            onRetry={() => serviceExpensesList.refetch()}
            isRetrying={serviceExpensesList.isFetching}
            emptyIcon={FiTool as ElementType}
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
            onCreate={() => navigate('/cadastros-base/servicos/novo')}
          />
        </Box>
      </TableProvider>

      <FilterSideServiceExpenses
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
