// src/pages/BaseRegistrations/CategoryTypes/index.tsx
// -----------------------------------------------------------------------------
// Tela de LISTAGEM (grid FLAT — sem hierarquia) de TIPOS DE CATEGORIA
// (CategoryType) — Cadastros Base / Financeiros.
// Rota: /cadastros-base/tipos-de-categoria (guardada por `categorytypes_view`,
// registrada em src/router/index.tsx — este arquivo não mexe em rota/menu).
//
// Referência UX (TASK-CTY-01): não existe tela oficial de Tipos de Categoria
// no design system `cerne` (UX-GAP declarado na ficha) — precedente INTERNO
// CadastrosBase/MotivosBaixa (paginação real + exclusão) + CadastrosBase/
// Especies (forma exata do dado de 2 campos, sem `code`). Estrutura:
//   - grid via useCustomGridQuery inline (paginação REAL server-side, ciente
//     de que o backend hoje ignora `per_page` — Risco 2 da ficha);
//   - HeaderTable → botões de ação (Add respeita categorytypes_create);
//   - FilterSideCategoryTypes → drawer (search/is_enabled), COM
//     re-hidratação ao reabrir (ver o próprio arquivo do filtro);
//   - delete via useRequest + DeleteConfirmDialog (respeita
//     categorytypes_delete; onError GENÉRICO do useRequest — hoje o backend
//     pode devolver 500 cru em vez de 422 estruturado quando em uso, Risco 1
//     da ficha — não decodificamos `errors.in_use[]`, o toast exibe o que a
//     API devolver).
// -----------------------------------------------------------------------------

import { useMemo, useState } from 'react';

import type { ElementType } from 'react';

import { Badge, Box, Flex, Icon, Text, useDisclosure, VStack } from '@chakra-ui/react';
import { createColumnHelper } from '@tanstack/react-table';
import { FiEdit, FiMinusCircle, FiTrash2 } from 'react-icons/fi';
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
  deleteCategoryType,
  listCategoryTypes,
} from '@/services/v2/CategoryTypes/category-type-service';

import type { CategoryTypeFilterForm, CategoryTypeListItem } from '@/@types/v2/CategoryTypes';

import { FilterSideCategoryTypes } from './FilterSideCategoryTypes';
import { HeaderTable } from './HeaderTable';

// Chave estável de storage da personalização de grid desta tela.
const CATEGORY_TYPES_STORAGE_KEY = 'GBCerneBaseRegistrationsCategoryTypes';

export default function CategoryTypesList() {
  const { languageGB } = useLanguage();
  const navigate = useNavigate();
  const { can } = usePermissions();
  const text = languageGB.baseRegistrations.categoryType;

  const canCreate = can('categorytypes_create');
  const canEdit = can('categorytypes_edit');
  const canDelete = can('categorytypes_delete');

  const defaultQueryOptions = useMemo(
    () => ({
      pageSize: 10,
      storageKey:
        languageGB.baseRegistrations.titleModule + queryKey.baseRegistrations.categoryTypes,
    }),
    []
  );

  const { paginatedQuery, handlePaginatedQuery, handleFilterChange, handleResetFilter } =
    userPaginatedQuery<CategoryTypeFilterForm>(defaultQueryOptions);

  // ---- Estado de filtro (drawer) ------------------------------------------
  const { open: isFilterOpen, onOpen: onOpenFilter, onClose: onCloseFilter } = useDisclosure();

  const filtersApplied = useMemo(
    () =>
      Object.values(paginatedQuery.filter ?? {}).filter(
        (v) => v !== undefined && v !== null && v !== ''
      ).length,
    [paginatedQuery.filter]
  );

  // ---- Estado de exclusão --------------------------------------------------
  const [toDelete, setToDelete] = useState<CategoryTypeListItem | null>(null);
  const {
    open: isOpenDeleteDialog,
    onOpen: onOpenDeleteDialog,
    onClose: onCloseDeleteDialog,
  } = useDisclosure();

  const categoryTypesList = useCustomGridQuery<CategoryTypeListItem, CategoryTypeFilterForm>({
    asyncFunction: listCategoryTypes,
    queryKey: queryKey.baseRegistrations.categoryTypes,
    paginatedQuery,
    setPaginatedQuery: handlePaginatedQuery,
    filterQuery: [],
    filter: paginatedQuery.filter ?? ({} as CategoryTypeFilterForm),
  });

  const deleteMutation = useRequest({
    asyncFunction: async ({ categoryTypeUuid }: { categoryTypeUuid: string }) => {
      return await deleteCategoryType(categoryTypeUuid);
    },
    queryKey: queryKey.baseRegistrations.categoryTypes,
    queryKey2: queryKey.baseRegistrations.categoryType,
    // `useRequest`'s TypesRequest não tem variante "delete" (só update/create/
    // apply/export/revoke/restore) — "update" é a mesma convenção usada por
    // LowReason/Species/TypeTitle para a mesma operação. O texto exibido no
    // toast vem de `personalizedMessage`, então o rótulo genérico associado a
    // "update" nunca aparece ao usuário.
    //
    // onError: NÃO customizado — usa o tratamento genérico interno do
    // useRequest (lê `message`/`error` do envelope). Hoje o backend pode
    // devolver 500 cru em vez de 422 estruturado quando o Tipo de Categoria
    // está em uso (Risco 1 da ficha — DeleteCategoryTypeAction sem guarda de
    // FK) — o toast genérico exibe o que a API mandar, seja 422 amigável ou
    // 500 genérico. Não decodificamos `errors.in_use[]`.
    typesRequest: 'update',
    entityName: text.singularLabel,
    personalizedMessage: text.list.deletedToast,
    actionSuccess: () => {
      onCloseDeleteDialog();
      setToDelete(null);
    },
  });

  const handleDeleteClick = (categoryType: CategoryTypeListItem) => {
    setToDelete(categoryType);
    onOpenDeleteDialog();
  };

  const handleConfirmDelete = () => {
    if (toDelete) {
      deleteMutation.mutate({ categoryTypeUuid: toDelete.uuid });
    }
  };

  const isDeleting = deleteMutation.isPending;

  const columnHelper = createColumnHelper<CategoryTypeListItem>();
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
                  onClick={() =>
                    navigate(`/cadastros-base/tipos-de-categoria/${row.original.uuid}`)
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

  const gridSettings = useGridSettings<CategoryTypeListItem>({
    storageKey: CATEGORY_TYPES_STORAGE_KEY,
    storageScope: useGridStorageScope(),
    columns: defaultColumns,
  });
  const { columnOrder, setColumnOrder, columnVisibility, setColumnVisibility } = gridSettings;

  const isLoading = checkLoadingStatus([categoryTypesList]);
  const items = categoryTypesList.data?.data?.items;
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
            isError={categoryTypesList.isError}
            error={categoryTypesList.error}
            isEmpty={isEmpty}
            onRetry={() => categoryTypesList.refetch()}
            isRetrying={categoryTypesList.isFetching}
            emptyIcon={FiMinusCircle as ElementType}
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
            onCreate={() => navigate('/cadastros-base/tipos-de-categoria/novo')}
          />
        </Box>
      </TableProvider>

      <FilterSideCategoryTypes
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
