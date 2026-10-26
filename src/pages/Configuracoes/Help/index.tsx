// src/pages/Configuracoes/Help/index.tsx
// -----------------------------------------------------------------------------
// Tela de LISTAGEM (grid) de TUTORIAIS (Help) — módulo Configurações
// (TASK-HP-06). Rota: /configuracoes/helps (guardada por `helpers_view`,
// registrada em `src/router/index.tsx`).
//
// `Help` é catálogo GLOBAL (Help-contrato §6, sem `farm_id`/`tenant_id`) —
// listagem usa `useCustomGridQuery` (SEM ID de contexto), NUNCA
// `useCustomGridQueryById` (armadilha explícita da ficha desta Tarefa: não
// copiar o hook de um módulo tenant-scoped vizinho por hábito).
//
// UX-GAP: seguir-pelo-padrão (sem desenho em GB.Cerne.UX para esta tela) —
// estrutura mirror de `CadastrosBase/CentroCusto/index.tsx` (grid+filtro+
// exclusão via TableProvider/HeaderGrid/DeleteConfirmDialog), adaptada ao
// contrato real de 2 campos (sem KPI, sem colunas condicionais por item).
// -----------------------------------------------------------------------------

import { ElementType, useMemo, useState } from 'react';

import { Badge, Box, Flex, Icon, Text, useDisclosure } from '@chakra-ui/react';
import { createColumnHelper } from '@tanstack/react-table';
import { FiEdit, FiHelpCircle, FiTrash2 } from 'react-icons/fi';
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

import { deleteHelp, getAllHelps } from '@/services/v2/Configuracoes/Help/help-service';

import type { HelpData, HelpFilterForm } from '@/@types/v2/Configuracoes/help';

import { FilterSideHelp } from './FilterSideHelp';
import { HeaderTable } from './HeaderTable';

import { PageHeader } from '@/components/ui/PageHeader';

// Chave de storage desta tela — paginação (`userPaginatedQuery`) deriva da
// MESMA expressão que qualquer futura personalização de grid usaria, para
// nunca divergir (mesmo racional de `CENTRO_CUSTO_STORAGE_KEY`).
const HELP_STORAGE_KEY = 'ConfiguracoesHelp' + queryKey.configuracoes.helps;

export default function HelpsList() {
  const { languageGB } = useLanguage();
  const navigate = useNavigate();
  const { can } = usePermissions();
  const text = languageGB.configuracoes.help;

  const canCreate = can('helpers_create');

  const defaultQueryOptions = useMemo(
    () => ({
      pageSize: 10,
      storageKey: HELP_STORAGE_KEY,
    }),
    []
  );

  const { paginatedQuery, handlePaginatedQuery, handleFilterChange, handleResetFilter } =
    userPaginatedQuery<HelpFilterForm>(defaultQueryOptions);

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
  const [toDelete, setToDelete] = useState<HelpData | null>(null);
  const {
    open: isOpenDeleteDialog,
    onOpen: onOpenDeleteDialog,
    onClose: onCloseDeleteDialog,
  } = useDisclosure();

  // Catálogo GLOBAL (sem farm_id/tenant_id) — `useCustomGridQuery` SEM ID de
  // contexto (Help-contrato §6). NUNCA `useCustomGridQueryById` aqui.
  const helpsList = useCustomGridQuery<HelpData, HelpFilterForm>({
    asyncFunction: getAllHelps,
    queryKey: queryKey.configuracoes.helps,
    paginatedQuery,
    setPaginatedQuery: handlePaginatedQuery,
    filterQuery: [],
    filter: {
      permission_uuid: paginatedQuery.filter?.permission_uuid,
    },
  });

  const deleteMutation = useRequest({
    asyncFunction: async ({ helpUuid }: { helpUuid: string }) => {
      return await deleteHelp(helpUuid);
    },
    queryKey: queryKey.configuracoes.helps,
    queryKey2: queryKey.configuracoes.help,
    // `useRequest` não tem variante "delete" (só update/create/apply/export/
    // revoke/restore) — "update" é a única opção compilável, mesmo padrão de
    // CentroCusto/Perfil para a mesma operação. `personalizedMessage` evita
    // o rótulo genérico associado a "update".
    typesRequest: 'update',
    entityName: text.singularLabel,
    personalizedMessage: text.list.deletedToast,
    actionSuccess: () => {
      onCloseDeleteDialog();
      setToDelete(null);
    },
  });

  const handleDeleteClick = (help: HelpData) => {
    setToDelete(help);
    onOpenDeleteDialog();
  };

  const handleConfirmDelete = () => {
    if (toDelete) {
      deleteMutation.mutate({ helpUuid: toDelete.uuid });
    }
  };

  const isDeleting = deleteMutation.isPending;

  const columnHelper = createColumnHelper<HelpData>();
  const defaultColumns = useMemo(
    () => [
      columnHelper.accessor('url', {
        header: text.list.table.url,
        enableHiding: false,
        cell: ({ row }) => (
          <Text fontSize="sm" lineClamp="1" title={row.original.url}>
            {row.original.url}
          </Text>
        ),
        meta: { gridLabel: text.list.table.url },
      }),
      columnHelper.accessor((row) => row.permission?.group_title ?? row.permission?.name ?? '', {
        id: 'screen',
        header: text.list.table.screen,
        cell: ({ row }) => (
          <Badge colorPalette="blue" variant="subtle">
            {row.original.permission?.group_title ?? row.original.permission?.name ?? '—'}
          </Badge>
        ),
        meta: { ...styleColumTable.sm, gridLabel: text.list.table.screen },
      }),
      columnHelper.accessor('created_at', {
        header: text.list.table.createdAt,
        cell: ({ row }) => (
          <Text fontSize="sm" color="fg.muted">
            {row.original.created_at ? formatDate(row.original.created_at) : '—'}
          </Text>
        ),
        meta: { ...styleColumTable.date, gridLabel: text.list.table.createdAt },
      }),
      columnHelper.display({
        id: 'acoes',
        header: '',
        enableHiding: false,
        cell: ({ row }) => (
          <Flex justify="flex-end">
            <Actions size="sm">
              {can('helpers_edit') && (
                <Actions.Item
                  icon={<Icon as={FiEdit} />}
                  onClick={() => navigate(`/configuracoes/helps/${row.original.uuid}`)}
                >
                  {text.list.actions.edit}
                </Actions.Item>
              )}
              {can('helpers_delete') && (
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

  const isLoading = checkLoadingStatus([helpsList]);
  const items = helpsList.data?.data?.items;
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
          <PageHeader title={text.list.pageTitle} description={text.list.pageSubtitle} />
        </HeaderGrid>

        <Box mt={6}>
          <Table
            isLoading={isLoading}
            isError={helpsList.isError}
            error={helpsList.error}
            isEmpty={isEmpty}
            onRetry={() => helpsList.refetch()}
            isRetrying={helpsList.isFetching}
            emptyIcon={FiHelpCircle as ElementType}
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
            onCreate={() => navigate('/configuracoes/helps/create')}
          />
        </Box>
      </TableProvider>

      <FilterSideHelp
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
        itemName={toDelete?.url}
        tone="danger"
      />
    </ContainerGrid>
  );
}
