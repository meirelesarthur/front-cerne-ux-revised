// src/pages/BaseRegistrations/SystemUpdates/index.tsx
// -----------------------------------------------------------------------------
// Tela de LISTAGEM (grid) de ATUALIZAÇÕES DO SISTEMA — Cadastros Base,
// execução 031, TASK-FE-1101. Rota: /cadastros-base/atualizacoes-sistema
// (guardada por `system_updates_view`, wiring real da rota é TASK-FE-1104).
//
// Molde: `BaseRegistrations/Warehouses/index.tsx` (mesma tenancy GLOBAL,
// mesma paginação real de servidor) — SEM filtro lateral (contrato de tela
// §1.1: o legado nunca teve busca/filtro nesta tela, "não inventar filtro"),
// COM a 3ª ação "Visualizar" (contrato §3, divergência declarada: precedente
// real `CentroCusto`/`Parameters` já adiciona Visualizar quando existe rota
// de detalhe própria).
//
// Coluna "Descrição": truncada em TEXTO PLANO (`stripHtmlAndTruncate`, regra
// de negócio 5 da Doc Bruta do legado) — NUNCA renderiza o HTML cru aqui
// (isso só acontece na Visualização, sempre sanitizado, ver
// `SystemUpdateDetalhe.tsx`/`sanitizeHtml.ts`, §7.2).
// -----------------------------------------------------------------------------

import { useMemo, useState, type ElementType } from 'react';

import { Box, Flex, Icon, Text, useDisclosure } from '@chakra-ui/react';
import { createColumnHelper } from '@tanstack/react-table';
import { FiBell, FiEdit, FiEye, FiTrash2 } from 'react-icons/fi';
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
import formatDate from '@/utils/formatDate';
import { stripHtmlAndTruncate } from '@/utils/stripHtmlTags';
import { styleColumTable } from '@/utils/style-colum-table';

import { queryKey } from '@/constants/query-key';

import {
  deleteSystemUpdate,
  listSystemUpdates,
} from '@/services/v2/BaseRegistrations/systemUpdate-service';

import type { SystemUpdateListItem } from '@/@types/v2/BaseRegistrations/systemUpdate';

import { HeaderTable } from './HeaderTable';

import { PageHeader } from '@/components/ui/PageHeader';

// Sem filtro nesta tela (contrato §1.1) — `filterQuery: []` fixo. Chave de
// storage desta tela: paginação (`userPaginatedQuery`) e personalização de
// grid (`useGridSettings`) derivam da MESMA expressão para nunca divergirem
// (mesmo padrão de `WAREHOUSE_STORAGE_KEY`).
const SYSTEM_UPDATES_STORAGE_KEY =
  'BaseRegistrationsSystemUpdates' + queryKey.baseRegistrations.systemUpdates;

export default function SystemUpdatesList() {
  const { languageGB } = useLanguage();
  const navigate = useNavigate();
  const { can } = usePermissions();
  const text = languageGB.baseRegistrations.systemUpdate;

  const canCreate = can('system_updates_create');

  const defaultQueryOptions = useMemo(
    () => ({
      pageSize: 10, // per_page default 10 — contrato de API §4.
      // orderBy explícito — já é o default do backend (`release_date desc`,
      // contrato de API §4), mandado mesmo assim (explícito > implícito).
      orderBy: { name: 'release_date', ascOrDesc: 'desc' },
      storageKey: SYSTEM_UPDATES_STORAGE_KEY,
    }),
    []
  );

  const { paginatedQuery, handlePaginatedQuery } = userPaginatedQuery(defaultQueryOptions);

  // ---- Estado de exclusão --------------------------------------------------
  const [toDelete, setToDelete] = useState<SystemUpdateListItem | null>(null);
  const {
    open: isOpenDeleteDialog,
    onOpen: onOpenDeleteDialog,
    onClose: onCloseDeleteDialog,
  } = useDisclosure();

  const systemUpdatesList = useCustomGridQuery<SystemUpdateListItem, any>({
    asyncFunction: listSystemUpdates,
    queryKey: queryKey.baseRegistrations.systemUpdates,
    paginatedQuery,
    setPaginatedQuery: handlePaginatedQuery,
    filterQuery: [],
  });

  const deleteMutation = useRequest({
    asyncFunction: async ({ systemUpdateUuid }: { systemUpdateUuid: string }) => {
      return await deleteSystemUpdate(systemUpdateUuid);
    },
    queryKey: queryKey.baseRegistrations.systemUpdates,
    queryKey2: queryKey.baseRegistrations.systemUpdate,
    typesRequest: 'update',
    entityName: text.singularLabel,
    personalizedMessage: text.list.deletedToast,
    actionSuccess: () => {
      onCloseDeleteDialog();
      setToDelete(null);
    },
  });

  const handleDeleteClick = (systemUpdate: SystemUpdateListItem) => {
    setToDelete(systemUpdate);
    onOpenDeleteDialog();
  };

  const handleConfirmDelete = () => {
    if (toDelete) {
      deleteMutation.mutate({ systemUpdateUuid: toDelete.uuid });
    }
  };

  const isDeleting = deleteMutation.isPending;

  const columnHelper = createColumnHelper<SystemUpdateListItem>();
  const defaultColumns = useMemo(
    () => [
      columnHelper.accessor('release_date', {
        header: text.list.table.releaseDate,
        meta: { ...styleColumTable.sm, gridLabel: text.list.table.releaseDate },
        cell: ({ row }) => (
          <Text fontSize="sm" fontWeight="medium">
            {formatDate(row.original.release_date)}
          </Text>
        ),
      }),
      columnHelper.accessor('description', {
        header: text.list.table.description,
        enableHiding: false,
        meta: { gridLabel: text.list.table.description },
        cell: ({ row }) => (
          <Text fontSize="sm" color="fg.muted" lineClamp="1">
            {stripHtmlAndTruncate(row.original.description)}
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
                onClick={() =>
                  navigate(`/cadastros-base/atualizacoes-sistema/${row.original.uuid}/detalhe`)
                }
              >
                {text.list.actions.view}
              </Actions.Item>
              {can('system_updates_edit') && (
                <Actions.Item
                  icon={<Icon as={FiEdit} />}
                  onClick={() =>
                    navigate(`/cadastros-base/atualizacoes-sistema/${row.original.uuid}`)
                  }
                >
                  {text.list.actions.edit}
                </Actions.Item>
              )}
              {can('system_updates_delete') && (
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
    [navigate, isDeleting, languageGB.defaltStrings.actions, text, can]
  );

  const gridSettings = useGridSettings<SystemUpdateListItem>({
    storageKey: SYSTEM_UPDATES_STORAGE_KEY,
    storageScope: useGridStorageScope(),
    columns: defaultColumns,
  });
  const { columnOrder, setColumnOrder, columnVisibility, setColumnVisibility } = gridSettings;

  const isLoading = checkLoadingStatus([systemUpdatesList]);
  const items = systemUpdatesList.data?.data?.items;
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
        <HeaderGrid header={<HeaderTable languageGB={languageGB} gridSettings={gridSettings} />}>
          <PageHeader title={text.list.pageTitle} description={text.list.pageSubtitle} />
        </HeaderGrid>

        <Box mt={6}>
          <Table
            isLoading={isLoading}
            isError={systemUpdatesList.isError}
            error={systemUpdatesList.error}
            isEmpty={isEmpty}
            onRetry={() => systemUpdatesList.refetch()}
            isRetrying={systemUpdatesList.isFetching}
            emptyIcon={FiBell as ElementType}
            emptyTitle={text.list.emptyState.titleEmpty}
            emptyDescription={text.list.emptyState.descriptionEmpty}
            canCreate={canCreate}
            createLabel={text.list.emptyState.cta}
            onCreate={() => navigate('/cadastros-base/atualizacoes-sistema/novo')}
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
        itemName={toDelete ? formatDate(toDelete.release_date) : undefined}
        tone="danger"
      />
    </ContainerGrid>
  );
}
