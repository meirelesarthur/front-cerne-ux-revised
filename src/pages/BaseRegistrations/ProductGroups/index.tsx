// src/pages/BaseRegistrations/ProductGroups/index.tsx
// -----------------------------------------------------------------------------
// Tela de LISTAGEM (grid flat, sem hierarquia) de GRUPOS DE PRODUTO —
// Cadastros Base. Rota: /cadastros-base/produtos/grupos (guardada por
// `groupproducts_view`, registrada em src/router/index.tsx antes do catch-all
// /cadastros-base/*).
//
// Estrutura idêntica a CadastrosBase/CentroCusto/index.tsx e
// CadastrosBase/Racas/index.tsx (grid paginado + HeaderTable + FilterSide +
// delete via useRequest + DeleteConfirmDialog). Paginação REAL server-side
// (achado #1 de TASK-GRP-01 — `GroupProductController::index()` usa
// `ApiResponse::paginated` com `LengthAwarePaginator` de verdade).
//
// Sem flags `can_edit`/`can_delete` por item no `GroupProductResource` —
// autorização das ações de linha é 100% por permissão GLOBAL
// (`groupproducts_edit`/`groupproducts_delete`), mesmo padrão de
// Perfil/Racas/index.tsx.
//
// Exclusão DEFINITIVA (`GroupProduct` não usa SoftDeletes) — o
// `DeleteConfirmDialog` recebe copy própria (`warningText`) deixando isso
// explícito. O guard de FK 422 (achado #2 de TASK-GRP-01,
// `DeleteGroupProductAction`) não precisa de um `onError` dedicado aqui: o
// `onError` GLOBAL de `useRequest` (src/hooks/useRequest.tsx) já lê
// `error.response.data.message`/`.error` do envelope e exibe no toast — o
// mesmo mecanismo usado por CostCenters para a mensagem de FK RESTRICT.
// -----------------------------------------------------------------------------

import { useMemo, useState } from 'react';

import { ElementType } from 'react';

import { Badge, Box, Flex, Icon, Text, useDisclosure, VStack } from '@chakra-ui/react';
import { createColumnHelper } from '@tanstack/react-table';
import { FiEdit, FiPackage, FiTrash2 } from 'react-icons/fi';
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
  deleteProductGroup,
  listProductGroups,
} from '@/services/v2/ProductGroups/product-group-service';

import type {
  ProductGroupFilterForm,
  ProductGroupListItem,
} from '@/@types/v2/ProductGroups/product-group';

import { FilterSideProductGroups } from './FilterSideProductGroups';
import { HeaderTable } from './HeaderTable';

// Chave de storage desta tela. Paginação (`userPaginatedQuery`) e
// personalização de grid (`useGridSettings`) derivam da MESMA expressão para
// nunca divergirem — mesmo padrão de CentroCusto (DEC-007 §12).
const PRODUCT_GROUPS_STORAGE_KEY = 'CadastrosBaseGruposProduto' + queryKey.productGroups.list;

export default function ProductGroupsList() {
  const { languageGB } = useLanguage();
  const navigate = useNavigate();
  const { can } = usePermissions();
  const text = languageGB.productGroups.productGroup;

  const canCreate = can('groupproducts_create');
  const canEdit = can('groupproducts_edit');
  const canDelete = can('groupproducts_delete');

  const defaultQueryOptions = useMemo(
    () => ({
      pageSize: 10,
      storageKey: PRODUCT_GROUPS_STORAGE_KEY,
    }),
    []
  );

  const { paginatedQuery, handlePaginatedQuery, handleFilterChange, handleResetFilter } =
    userPaginatedQuery<ProductGroupFilterForm>(defaultQueryOptions);

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
  const [toDelete, setToDelete] = useState<ProductGroupListItem | null>(null);
  const {
    open: isOpenDeleteDialog,
    onOpen: onOpenDeleteDialog,
    onClose: onCloseDeleteDialog,
  } = useDisclosure();

  const productGroupsList = useCustomGridQuery<ProductGroupListItem, ProductGroupFilterForm>({
    asyncFunction: listProductGroups,
    queryKey: queryKey.productGroups.list,
    paginatedQuery,
    setPaginatedQuery: handlePaginatedQuery,
    filterQuery: [],
    filter: paginatedQuery.filter ?? ({} as ProductGroupFilterForm),
  });

  const deleteMutation = useRequest({
    asyncFunction: async ({ productGroupUuid }: { productGroupUuid: string }) => {
      return await deleteProductGroup(productGroupUuid);
    },
    queryKey: queryKey.productGroups.list,
    queryKey2: queryKey.productGroups.detail,
    // `useRequest`'s TypesRequest não tem variante "delete" — "update" é a
    // opção compilável usada pelo mesmo motivo em CostCenters/Racas (o texto
    // exibido vem de `personalizedMessage`, o rótulo genérico associado a
    // "update" nunca aparece ao usuário). O `onError` GLOBAL deste hook já
    // exibe a mensagem de negócio real (422 de FK em uso) — ver cabeçalho.
    typesRequest: 'update',
    entityName: text.singularLabel,
    personalizedMessage: text.list.deletedToast,
    actionSuccess: () => {
      onCloseDeleteDialog();
      setToDelete(null);
    },
  });

  const handleDeleteClick = (productGroup: ProductGroupListItem) => {
    setToDelete(productGroup);
    onOpenDeleteDialog();
  };

  const handleConfirmDelete = () => {
    if (toDelete) {
      deleteMutation.mutate({ productGroupUuid: toDelete.uuid });
    }
  };

  const isDeleting = deleteMutation.isPending;

  const items = productGroupsList.data?.data?.items ?? [];

  const columnHelper = createColumnHelper<ProductGroupListItem>();
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
      columnHelper.accessor('is_enabled', {
        header: text.list.table.active,
        cell: ({ row }) => (
          <Badge
            colorPalette={row.original.is_enabled ? 'green' : 'gray'}
            variant="subtle"
            py={1}
            px={3}
          >
            {row.original.is_enabled ? text.list.table.activeLabel : text.list.table.inactiveLabel}
          </Badge>
        ),
        meta: { ...styleColumTable.sm, gridLabel: text.list.table.active },
      }),
      columnHelper.display({
        id: 'acoes',
        header: '',
        enableHiding: false,
        cell: ({ row }) => (
          <Flex justify="flex-end">
            <Actions size="sm">
              {canEdit && (
                <Actions.Item
                  icon={<Icon as={FiEdit} />}
                  onClick={() => navigate(`/cadastros-base/produtos/grupos/${row.original.uuid}`)}
                >
                  {text.list.actions.edit}
                </Actions.Item>
              )}
              {canDelete && (
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
    [navigate, isDeleting, text, canEdit, canDelete, languageGB.defaltStrings.actions]
  );

  const gridSettings = useGridSettings<ProductGroupListItem>({
    storageKey: PRODUCT_GROUPS_STORAGE_KEY,
    storageScope: useGridStorageScope(),
    columns: defaultColumns,
  });
  const { columnOrder, setColumnOrder, columnVisibility, setColumnVisibility } = gridSettings;

  const isLoading = checkLoadingStatus([productGroupsList]);
  const isEmpty = !isLoading && items.length === 0;

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
            isError={productGroupsList.isError}
            error={productGroupsList.error}
            isEmpty={isEmpty}
            onRetry={() => productGroupsList.refetch()}
            isRetrying={productGroupsList.isFetching}
            emptyIcon={FiPackage as ElementType}
            emptyTitle={
              filtersApplied > 0
                ? text.list.emptyState.titleFiltered
                : canCreate
                  ? text.list.emptyState.titleEmpty
                  : text.list.emptyState.titleEmptyNoCreate
            }
            emptyDescription={
              filtersApplied > 0
                ? text.list.emptyState.descriptionFiltered
                : canCreate
                  ? text.list.emptyState.descriptionEmpty
                  : text.list.emptyState.descriptionEmptyNoCreate
            }
            canCreate={filtersApplied === 0 && canCreate}
            createLabel={text.list.emptyState.cta}
            onCreate={() => navigate('/cadastros-base/produtos/grupos/novo')}
          />
        </Box>
      </TableProvider>

      <FilterSideProductGroups
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
        title={text.list.deleteConfirm.title}
        itemName={toDelete?.description}
        warningText={text.list.deleteConfirm.warning}
      />
    </ContainerGrid>
  );
}
