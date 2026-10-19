// src/pages/Configuracoes/Apps/index.tsx
// -----------------------------------------------------------------------------
// Tela de LISTAGEM (grid) de APLICATIVOS (App) — módulo Configurações
// (TASK-APP-FE-01). Rota: /configuracoes/apps (guardada por `apps_view`,
// registrada em `src/router/index.tsx`).
//
// `App` é catálogo GLOBAL (App-contrato.md Seção 4, sem `farm_id`/
// `tenant_id`) — listagem usa `useCustomGridQuery` (SEM ID de contexto),
// NUNCA `useCustomGridQueryById`/`useCustomGridQueryByGuid` (armadilha
// explícita da ficha desta Tarefa: não copiar o hook de um módulo
// tenant-scoped vizinho por hábito) — mirror exato de
// `Configuracoes/Help/index.tsx`.
//
// Ordenação: o backend já ordena `version desc, platform desc`
// (App-contrato.md Seção 1, `AppRepository::listWithFilters`) — o front
// preserva a ordem recebida, sem `sortBy`/`orderBy` client-side que a
// sobrescreva (nenhuma coluna desta tabela é `sortable`).
//
// UX-GAP: seguir-pelo-padrão (sem desenho em GB.Cerne.UX para esta tela) —
// estrutura mirror de `Configuracoes/Help/index.tsx` (grid+filtro+exclusão
// via TableProvider/HeaderGrid/DeleteConfirmDialog), adaptada ao contrato
// real de 5 campos (3 texto/textarea, 2 data).
// -----------------------------------------------------------------------------

import { ElementType, useMemo, useState } from 'react';

import { Box, Flex, Icon, Text, useDisclosure, VStack } from '@chakra-ui/react';
import { createColumnHelper } from '@tanstack/react-table';
import { FiEdit, FiSmartphone, FiTrash2 } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';

import { Actions } from '@/components/Action';
import { ContainerGrid } from '@/components/ContainerGrid';
import { DeleteConfirmDialog } from '@/components/DeleteConfirmDialog';
import { HeaderGrid } from '@/components/HeaderGrid';
import { Table } from '@/components/Table';

import { TableProvider } from '@/contexts/TableContext';

import { useCustomGridQuery } from '@/hooks/useCustomGridQuery';
import { useLanguage } from '@/hooks/useLanguage';
import { userPaginatedQuery } from '@/hooks/usePaginatedQueryStorage';
import { usePermissions } from '@/hooks/usePermissions';
import { useRequest } from '@/hooks/useRequest';

import { checkLoadingStatus } from '@/utils/checkLoadingStatus';
import formatDate from '@/utils/formatDate';
import { styleColumTable } from '@/utils/style-colum-table';

import { queryKey } from '@/constants/query-key';

import { deleteApp, getAllApps } from '@/services/v2/Configuracoes/Apps/app-service';

import type { AppData, AppFilterForm } from '@/@types/v2/Configuracoes/apps';

import { FilterSideApps } from './FilterSideApps';
import { HeaderTable } from './HeaderTable';

// Chave de storage desta tela — paginação (`userPaginatedQuery`) deriva da
// MESMA expressão que qualquer futura personalização de grid usaria, para
// nunca divergir (mesmo racional de `HELP_STORAGE_KEY`/`CENTRO_CUSTO_STORAGE_KEY`).
const APPS_STORAGE_KEY = 'ConfiguracoesApps' + queryKey.configuracoes.apps;

export default function AppsList() {
  const { languageGB } = useLanguage();
  const navigate = useNavigate();
  const { can } = usePermissions();
  const text = languageGB.configuracoes.app;

  const canCreate = can('apps_create');

  const defaultQueryOptions = useMemo(
    () => ({
      pageSize: 10,
      storageKey: APPS_STORAGE_KEY,
    }),
    []
  );

  const { paginatedQuery, handlePaginatedQuery, handleFilterChange, handleResetFilter } =
    userPaginatedQuery<AppFilterForm>(defaultQueryOptions);

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
  const [toDelete, setToDelete] = useState<AppData | null>(null);
  const {
    open: isOpenDeleteDialog,
    onOpen: onOpenDeleteDialog,
    onClose: onCloseDeleteDialog,
  } = useDisclosure();

  // Catálogo GLOBAL (sem farm_id/tenant_id) — `useCustomGridQuery` SEM ID de
  // contexto (App-contrato.md Seção 4). NUNCA `useCustomGridQueryById`/
  // `useCustomGridQueryByGuid` aqui.
  const appsList = useCustomGridQuery<AppData, AppFilterForm>({
    asyncFunction: getAllApps,
    queryKey: queryKey.configuracoes.apps,
    paginatedQuery,
    setPaginatedQuery: handlePaginatedQuery,
    filterQuery: [],
    filter: {
      platform: paginatedQuery.filter?.platform,
      version: paginatedQuery.filter?.version,
    },
  });

  const deleteMutation = useRequest({
    asyncFunction: async ({ appUuid }: { appUuid: string }) => {
      return await deleteApp(appUuid);
    },
    queryKey: queryKey.configuracoes.apps,
    queryKey2: queryKey.configuracoes.app,
    // `useRequest` não tem variante "delete" (só update/create/apply/export/
    // revoke/restore) — "update" é a única opção compilável, mesmo padrão de
    // Help/CentroCusto para a mesma operação. `personalizedMessage` evita o
    // rótulo genérico associado a "update".
    typesRequest: 'update',
    entityName: text.singularLabel,
    personalizedMessage: text.list.deletedToast,
    actionSuccess: () => {
      onCloseDeleteDialog();
      setToDelete(null);
    },
  });

  const handleDeleteClick = (app: AppData) => {
    setToDelete(app);
    onOpenDeleteDialog();
  };

  const handleConfirmDelete = () => {
    if (toDelete) {
      deleteMutation.mutate({ appUuid: toDelete.uuid });
    }
  };

  const isDeleting = deleteMutation.isPending;

  const columnHelper = createColumnHelper<AppData>();
  const defaultColumns = useMemo(
    () => [
      columnHelper.accessor('platform', {
        header: text.list.table.platform,
        enableHiding: false,
        cell: ({ row }) => <Text fontSize="sm">{row.original.platform}</Text>,
        meta: { ...styleColumTable.sm, gridLabel: text.list.table.platform },
      }),
      columnHelper.accessor('version', {
        header: text.list.table.version,
        cell: ({ row }) => <Text fontSize="sm">{row.original.version}</Text>,
        meta: { ...styleColumTable.sm, gridLabel: text.list.table.version },
      }),
      columnHelper.accessor('release_date', {
        header: text.list.table.releaseDate,
        cell: ({ row }) => (
          <Text fontSize="sm" color="fg.muted">
            {row.original.release_date ? formatDate(row.original.release_date) : '—'}
          </Text>
        ),
        meta: { ...styleColumTable.date, gridLabel: text.list.table.releaseDate },
      }),
      columnHelper.accessor('deadline', {
        header: text.list.table.deadline,
        cell: ({ row }) => (
          <Text fontSize="sm" color="fg.muted">
            {row.original.deadline ? formatDate(row.original.deadline) : '—'}
          </Text>
        ),
        meta: { ...styleColumTable.date, gridLabel: text.list.table.deadline },
      }),
      columnHelper.display({
        id: 'acoes',
        header: '',
        enableHiding: false,
        cell: ({ row }) => (
          <Flex justify="flex-end">
            <Actions size="sm">
              {can('apps_edit') && (
                <Actions.Item
                  icon={<Icon as={FiEdit} />}
                  onClick={() => navigate(`/configuracoes/apps/${row.original.uuid}`)}
                >
                  {text.list.actions.edit}
                </Actions.Item>
              )}
              {can('apps_delete') && (
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
    [navigate, isDeleting, can, languageGB.defaltStrings.actions, text]
  );

  const isLoading = checkLoadingStatus([appsList]);
  const items = appsList.data?.data?.items;
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
              canCreate={canCreate}
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
            isError={appsList.isError}
            error={appsList.error}
            isEmpty={isEmpty}
            onRetry={() => appsList.refetch()}
            isRetrying={appsList.isFetching}
            emptyIcon={FiSmartphone as ElementType}
            emptyTitle={
              filtersApplied > 0 ? text.list.emptyState.titleFiltered : text.list.emptyState.title
            }
            emptyDescription={
              filtersApplied > 0
                ? text.list.emptyState.descriptionFiltered
                : text.list.emptyState.description
            }
            canCreate={filtersApplied === 0 && canCreate}
            createLabel={text.list.emptyState.cta}
            onCreate={() => navigate('/configuracoes/apps/create')}
          />
        </Box>
      </TableProvider>

      <FilterSideApps
        isOpen={isFilterOpen}
        onClose={onCloseFilter}
        handleFilterChange={handleFilterChange}
        handleReset={handleResetFilter}
        filter={paginatedQuery.filter}
        languageGB={languageGB}
        filtersApplied={filtersApplied}
      />

      <DeleteConfirmDialog
        isOpen={isOpenDeleteDialog}
        onClose={() => {
          onCloseDeleteDialog();
          setToDelete(null);
        }}
        onConfirm={handleConfirmDelete}
        isLoading={isDeleting}
        itemName={toDelete ? `${toDelete.platform} ${toDelete.version}` : undefined}
        tone="danger"
      />
    </ContainerGrid>
  );
}
