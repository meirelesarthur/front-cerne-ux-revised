// src/pages/CadastrosBase/CategoriasProduto/index.tsx
// -----------------------------------------------------------------------------
// Tela de LISTAGEM (grid flat, sem hierarquia própria — `CategoryProduct` é o
// 2º nível de `GroupProduct → CategoryProduct → Kind`, mas não tem `parent_id`)
// de CATEGORIAS DE PRODUTO — Cadastros Base. Rota:
// /cadastros-base/produtos/categorias (guardada por `categoryproducts_view`,
// DEC-006 — legado, registrada em src/router/index.tsx antes do catch-all
// /cadastros-base/*).
//
// Estrutura idêntica a CadastrosBase/GruposProduto/index.tsx (grid paginado +
// HeaderTable + FilterSide + delete via useRequest + DeleteConfirmDialog),
// acrescida de 4 filtros (search/group_uuid/type/is_enabled) em vez de 2, e das
// colunas `type_label`/`group.description`/`financial_category.description`.
// Paginação REAL server-side (`CategoryProductController::index()` usa
// `ApiResponse::paginated` com `LengthAwarePaginator` de verdade).
//
// Exclusão com guard de dependências (achado #2 de TASK-CP-FE-01,
// `DeleteCategoryProductAction` — `kinds()->exists()` OU
// `products.category_id` em uso — 422 com mensagem de negócio explícita). O
// `onError` GLOBAL de `useRequest` (src/hooks/useRequest.tsx) já lê
// `error.response.data.message`/`.error` do envelope e exibe no toast — não
// precisa de um `onError` dedicado aqui.
// -----------------------------------------------------------------------------

import { useMemo, useState } from 'react';

import { Badge, Box, Flex, Icon, Text, useDisclosure } from '@chakra-ui/react';
import { createColumnHelper } from '@tanstack/react-table';
import type { ElementType } from 'react';
import { FiEdit, FiTag, FiTrash2 } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';

import { Actions } from '@/components/Action';
import { ContainerGrid } from '@/components/ContainerGrid';
import { DeleteConfirmDialog } from '@/components/DeleteConfirmDialog';
import { HeaderGrid } from '@/components/HeaderGrid';
import { Table } from '@/components/Table';

import { TableProvider } from '@/contexts/TableContext';

import { useLanguage } from '@/hooks/useLanguage';
import { userPaginatedQuery } from '@/hooks/usePaginatedQueryStorage';
import { usePermissions } from '@/hooks/usePermissions';
import { useRequest } from '@/hooks/useRequest';

import { checkLoadingStatus } from '@/utils/checkLoadingStatus';
import { styleColumTable } from '@/utils/style-colum-table';

import { queryKey } from '@/constants/query-key';

import { deleteCategoryProduct } from '@/services/v2/CategoryProducts/category-product-service';

import type {
  CategoryProductFilterForm,
  CategoryProductListItem,
} from '@/@types/v2/CategoryProducts/category-product';

import { FilterSideCategoriasProduto } from './FilterSideCategoriasProduto';
import { HeaderTable } from './HeaderTable';
import { useCategoryProductsList } from './useCategoryProducts';

import { PageHeader } from '@/components/ui/PageHeader';

export default function CategoriasProdutoList() {
  const { languageGB } = useLanguage();
  const navigate = useNavigate();
  const { can } = usePermissions();
  const text = languageGB.categoryProducts.categoryProduct;

  const canCreate = can('categoryproducts_create');
  const canEdit = can('categoryproducts_edit');
  const canDelete = can('categoryproducts_delete');

  const defaultQueryOptions = useMemo(
    () => ({
      pageSize: 10,
      storageKey: 'CadastrosBaseCategoriasProduto' + queryKey.categoryProducts.list,
    }),
    []
  );

  const { paginatedQuery, handlePaginatedQuery, handleFilterChange, handleResetFilter } =
    userPaginatedQuery<CategoryProductFilterForm>(defaultQueryOptions);

  // ---- Estado de filtro (drawer) ------------------------------------------
  const { open: isFilterOpen, onOpen: onOpenFilter, onClose: onCloseFilter } = useDisclosure();

  const filtersApplied = useMemo(
    () =>
      Object.entries(paginatedQuery.filter ?? {}).filter(
        // `group_label` é DISPLAY-ONLY (companion do Select assíncrono) — não
        // conta como filtro aplicado por si só (evita contar 2x com `group_uuid`).
        ([key, value]) =>
          key !== 'group_label' &&
          value !== undefined &&
          value !== null &&
          value !== '' &&
          value !== false
      ).length,
    [paginatedQuery.filter]
  );

  // ---- Estado de exclusão --------------------------------------------------
  const [toDelete, setToDelete] = useState<CategoryProductListItem | null>(null);
  const {
    open: isOpenDeleteDialog,
    onOpen: onOpenDeleteDialog,
    onClose: onCloseDeleteDialog,
  } = useDisclosure();

  const categoryProductsList = useCategoryProductsList({
    paginatedQuery,
    setPaginatedQuery: handlePaginatedQuery,
    filter: paginatedQuery.filter ?? undefined,
  });

  const deleteMutation = useRequest({
    asyncFunction: async ({ categoryProductUuid }: { categoryProductUuid: string }) => {
      return await deleteCategoryProduct(categoryProductUuid);
    },
    queryKey: queryKey.categoryProducts.list,
    queryKey2: queryKey.categoryProducts.detail,
    // `useRequest`'s TypesRequest não tem variante "delete" — "update" é a
    // opção compilável usada pelo mesmo motivo em GruposProduto/Racas (o texto
    // exibido vem de `personalizedMessage`). O `onError` GLOBAL deste hook já
    // exibe a mensagem de negócio real (422 de dependências) — ver cabeçalho.
    typesRequest: 'update',
    entityName: text.singularLabel,
    personalizedMessage: text.list.deletedToast,
    actionSuccess: () => {
      onCloseDeleteDialog();
      setToDelete(null);
    },
  });

  const handleDeleteClick = (categoryProduct: CategoryProductListItem) => {
    setToDelete(categoryProduct);
    onOpenDeleteDialog();
  };

  const handleConfirmDelete = () => {
    if (toDelete) {
      deleteMutation.mutate({ categoryProductUuid: toDelete.uuid });
    }
  };

  const isDeleting = deleteMutation.isPending;

  const items = categoryProductsList.data?.data?.items ?? [];

  const columnHelper = createColumnHelper<CategoryProductListItem>();
  const defaultColumns = useMemo(
    () => [
      columnHelper.accessor('description', {
        header: text.list.table.description,
        cell: ({ row }) => (
          <Text fontWeight="medium" lineClamp="1">
            {row.original.description}
          </Text>
        ),
      }),
      columnHelper.accessor('type_label', {
        header: text.list.table.type,
        cell: ({ row }) => <Text lineClamp="1">{row.original.type_label}</Text>,
        meta: styleColumTable.md,
      }),
      columnHelper.accessor((row) => row.group?.description, {
        id: 'group',
        header: text.list.table.group,
        cell: ({ row }) => <Text lineClamp="1">{row.original.group?.description}</Text>,
        meta: styleColumTable.md,
      }),
      columnHelper.accessor((row) => row.financial_category?.description, {
        id: 'financial_category',
        header: text.list.table.financialCategory,
        cell: ({ row }) => (
          <Text lineClamp="1" color={row.original.financial_category ? undefined : 'fg.muted'}>
            {row.original.financial_category?.description ?? '—'}
          </Text>
        ),
        meta: styleColumTable.md,
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
        meta: styleColumTable.sm,
      }),
      columnHelper.display({
        id: 'acoes',
        header: '',
        cell: ({ row }) => (
          <Flex justify="flex-end">
            <Actions size="sm">
              {canEdit && (
                <Actions.Item
                  icon={<Icon as={FiEdit} />}
                  onClick={() =>
                    navigate(`/cadastros-base/produtos/categorias/${row.original.uuid}`)
                  }
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
        meta: styleColumTable.sm,
      }),
    ],
    [navigate, isDeleting, text, canEdit, canDelete]
  );

  const isLoading = checkLoadingStatus([categoryProductsList]);
  const isError = categoryProductsList.isError;
  const isEmpty = !isLoading && !isError && items.length === 0;

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
          <PageHeader title={text.list.pageTitle} description={text.list.pageSubtitle} />
        </HeaderGrid>

        <Box mt={6}>
          <Table
            isLoading={isLoading}
            isError={isError}
            error={categoryProductsList.error}
            isEmpty={isEmpty}
            onRetry={() => categoryProductsList.refetch()}
            isRetrying={categoryProductsList.isFetching}
            emptyIcon={FiTag as ElementType}
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
            onCreate={() => navigate('/cadastros-base/produtos/categorias/novo')}
          />
        </Box>
      </TableProvider>

      <FilterSideCategoriasProduto
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
