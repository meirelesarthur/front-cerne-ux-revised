// src/pages/BaseRegistrations/Permissions/index.tsx
// -----------------------------------------------------------------------------
// Tela de LISTAGEM (grid) de Permissões — Cadastros Base, execução 032,
// TASK-FE-2401. Rota: /cadastros-base/permissoes (guardada por
// `permissions_view`).
//
// Molde: `SystemUpdates/index.tsx` (mesma tenancy GLOBAL, `useCustomGridQuery`
// + `useGridSettings`) + `Banks/index.tsx` (busca server-side com debounce
// local, contrato de tela §7.2).
//
// `pageSize: 20` (NÃO 10) — reflete o `paginate(20)` HARDCODED no backend
// (contrato de tela §7.4: `PermissionRepository::listPaginated` ignora
// qualquer `per_page` enviado). SEM seletor de tamanho de página nesta tela —
// `GridSettings` mantém apenas ordenação/visibilidade de coluna.
// -----------------------------------------------------------------------------

import { useEffect, useMemo, useRef, useState } from 'react';

import { ElementType } from 'react';

import { Box, Flex, Icon, Text, useDisclosure, VStack } from '@chakra-ui/react';
import { createColumnHelper } from '@tanstack/react-table';
import { FiEdit, FiEye, FiKey, FiTrash2 } from 'react-icons/fi';
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
  deletePermission,
  listPermissions,
} from '@/services/v2/BaseRegistrations/permission-service';

import type {
  PermissionFilterForm,
  PermissionListItem,
} from '@/@types/v2/BaseRegistrations/permission';

import { HeaderTable } from './HeaderTable';

const PERMISSIONS_STORAGE_KEY =
  'BaseRegistrationsPermissions' + queryKey.baseRegistrations.permissions;

export default function PermissionsList() {
  const { languageGB } = useLanguage();
  const navigate = useNavigate();
  const { can } = usePermissions();
  const text = languageGB.baseRegistrations.permission;

  const canCreate = can('permissions_create');
  const canEdit = can('permissions_edit');
  const canDelete = can('permissions_delete');

  const defaultQueryOptions = useMemo(
    () => ({
      pageSize: 20, // reflete o `paginate(20)` hardcoded do backend — contrato de tela §7.4.
      orderBy: { name: 'name', ascOrDesc: 'asc' }, // já é o default do backend, mandado explícito.
      storageKey: PERMISSIONS_STORAGE_KEY,
    }),
    []
  );

  const { paginatedQuery, handlePaginatedQuery, handleFilterChange } =
    userPaginatedQuery<PermissionFilterForm>(defaultQueryOptions);

  // ---- Busca (servidor, name/description, com debounce local) -------------
  const [searchInput, setSearchInput] = useState(paginatedQuery.filter?.search ?? '');
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    const timeout = setTimeout(() => {
      handleFilterChange({ search: searchInput.trim() || undefined });
    }, 400);

    return () => clearTimeout(timeout);
  }, [searchInput, handleFilterChange]);

  // ---- Estado de exclusão --------------------------------------------------
  const [toDelete, setToDelete] = useState<PermissionListItem | null>(null);
  const {
    open: isOpenDeleteDialog,
    onOpen: onOpenDeleteDialog,
    onClose: onCloseDeleteDialog,
  } = useDisclosure();

  const permissionsList = useCustomGridQuery<PermissionListItem, PermissionFilterForm>({
    asyncFunction: listPermissions,
    queryKey: queryKey.baseRegistrations.permissions,
    paginatedQuery,
    setPaginatedQuery: handlePaginatedQuery,
    filterQuery: [],
    filter: paginatedQuery.filter ?? ({} as PermissionFilterForm),
  });

  const deleteMutation = useRequest({
    asyncFunction: async ({ permissionUuid }: { permissionUuid: string }) => {
      return await deletePermission(permissionUuid);
    },
    queryKey: queryKey.baseRegistrations.permissions,
    queryKey2: queryKey.baseRegistrations.permission,
    // `useRequest`'s TypesRequest não tem variante "delete" — "update" é a
    // mesma convenção usada por outros módulos do projeto para a mesma operação.
    typesRequest: 'update',
    entityName: text.singularLabel,
    personalizedMessage: text.list.deletedToast,
    actionSuccess: () => {
      onCloseDeleteDialog();
      setToDelete(null);
    },
  });

  const handleDeleteClick = (permission: PermissionListItem) => {
    setToDelete(permission);
    onOpenDeleteDialog();
  };

  const handleConfirmDelete = () => {
    if (toDelete) {
      deleteMutation.mutate({ permissionUuid: toDelete.uuid });
    }
  };

  const isDeleting = deleteMutation.isPending;

  // Itens já vêm filtrados/paginados do servidor (`search`/`page`/`per_page`
  // reais) — nenhum filtro adicional no client.
  const items = permissionsList.data?.data?.items ?? [];

  const columnHelper = createColumnHelper<PermissionListItem>();
  const defaultColumns = useMemo(
    () => [
      columnHelper.accessor('name', {
        header: text.list.table.name,
        enableHiding: false,
        meta: { gridLabel: text.list.table.name },
        cell: ({ row }) => (
          <Text fontSize="sm" fontWeight="medium" lineClamp="1">
            {row.original.name}
          </Text>
        ),
      }),
      columnHelper.accessor('description', {
        header: text.list.table.description,
        meta: { ...styleColumTable.sm, gridLabel: text.list.table.description },
        cell: ({ row }) => (
          <Text fontSize="sm" color="fg.muted" lineClamp="1">
            {row.original.description}
          </Text>
        ),
      }),
      columnHelper.display({
        id: 'acoes',
        header: '',
        enableHiding: false,
        cell: ({ row }) => (
          <Flex justify="flex-end">
            <Actions size="sm">
              <Actions.Item
                icon={<Icon as={FiEye} />}
                onClick={() => navigate(`/cadastros-base/permissoes/${row.original.uuid}/detalhe`)}
              >
                {text.list.actions.view}
              </Actions.Item>
              {canEdit && (
                <Actions.Item
                  icon={<Icon as={FiEdit} />}
                  onClick={() => navigate(`/cadastros-base/permissoes/${row.original.uuid}`)}
                >
                  {text.list.actions.edit}
                </Actions.Item>
              )}
              {canDelete && (
                <Actions.Item
                  icon={<Icon as={FiTrash2} />}
                  onClick={() => handleDeleteClick(row.original)}
                  tone="danger"
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
    [navigate, isDeleting, languageGB.defaltStrings.actions, text, canEdit, canDelete]
  );

  const gridSettings = useGridSettings<PermissionListItem>({
    storageKey: PERMISSIONS_STORAGE_KEY,
    storageScope: useGridStorageScope(),
    columns: defaultColumns,
  });
  const { columnOrder, setColumnOrder, columnVisibility, setColumnVisibility } = gridSettings;

  const isLoading = checkLoadingStatus([permissionsList]);
  // Reflete o filtro REALMENTE aplicado no servidor (não o texto ainda sendo
  // digitado localmente) — evita o EmptyState mostrar a variante "filtrado"
  // antes do debounce aplicar.
  const hasSearch = Boolean(paginatedQuery.filter?.search);
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
              searchValue={searchInput}
              onSearchChange={setSearchInput}
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
            isError={permissionsList.isError}
            error={permissionsList.error}
            isEmpty={isEmpty}
            onRetry={() => permissionsList.refetch()}
            isRetrying={permissionsList.isFetching}
            emptyIcon={FiKey as ElementType}
            emptyTitle={hasSearch ? text.list.emptyState.titleFiltered : text.list.emptyState.titleEmpty}
            emptyDescription={
              hasSearch
                ? text.list.emptyState.descriptionFiltered
                : text.list.emptyState.descriptionEmpty
            }
            canCreate={!hasSearch && canCreate}
            createLabel={text.list.emptyState.cta}
            onCreate={() => navigate('/cadastros-base/permissoes/novo')}
          />
        </Box>
      </TableProvider>

      <DeleteConfirmDialog
        isOpen={isOpenDeleteDialog}
        onClose={() => {
          onCloseDeleteDialog();
          setToDelete(null);
        }}
        onConfirm={handleConfirmDelete}
        isLoading={isDeleting}
        itemName={toDelete?.name}
        tone="danger"
      />
    </ContainerGrid>
  );
}
