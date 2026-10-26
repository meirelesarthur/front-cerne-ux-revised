// src/pages/BaseRegistrations/Ibpts/index.tsx
// -----------------------------------------------------------------------------
// Tela de LISTAGEM (grid) de IBPT (Tabela Fiscal de Incidência Tributária) —
// Cadastros Base, execução 032, TASK-FE-2411. Rota:
// /cadastros-base/ibpt (guardada por `ibpts_view`).
//
// Molde: `SystemUpdates/index.tsx` (mesma tenancy GLOBAL, `useCustomGridQuery`
// + `useGridSettings`), SEM ação de Editar (contrato de API §10, sem
// `update` — reimportar a UF já é o mecanismo de atualização) e SEM filtro
// (contrato de tela §7.1, default omitir: dataset estruturalmente pequeno,
// no máximo 27 linhas, 1 por UF).
// -----------------------------------------------------------------------------

import { ElementType, useMemo, useState } from 'react';

import { Box, Flex, Icon, Text, useDisclosure } from '@chakra-ui/react';
import { createColumnHelper } from '@tanstack/react-table';
import { FiEye, FiFileText, FiTrash2 } from 'react-icons/fi';
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

import { deleteIbptTable, listIbpts } from '@/services/v2/BaseRegistrations/ibpt-service';

import type { IbptListItem } from '@/@types/v2/BaseRegistrations/ibpt';

import { HeaderTable } from './HeaderTable';

import { PageHeader } from '@/components/ui/PageHeader';

// Sem filtro nesta tela (contrato de tela §7.1) — `filterQuery: []` fixo.
// Chave de storage: paginação (`userPaginatedQuery`) e personalização de
// grid (`useGridSettings`) derivam da MESMA expressão para nunca divergirem
// (mesmo padrão de `SYSTEM_UPDATES_STORAGE_KEY`).
const IBPTS_STORAGE_KEY = 'BaseRegistrationsIbpts' + queryKey.baseRegistrations.ibpts;

export default function IbptsList() {
  const { languageGB } = useLanguage();
  const navigate = useNavigate();
  const { can } = usePermissions();
  const text = languageGB.baseRegistrations.ibpt;

  const canCreate = can('ibpts_create');

  const defaultQueryOptions = useMemo(
    () => ({
      pageSize: 10, // per_page default 10 — contrato de API §6, teto 100.
      // orderBy explícito — já é o default do backend (`orderBy('uf')`,
      // contrato de API §8 `listAll`), mandado mesmo assim.
      orderBy: { name: 'uf', ascOrDesc: 'asc' },
      storageKey: IBPTS_STORAGE_KEY,
    }),
    []
  );

  const { paginatedQuery, handlePaginatedQuery } = userPaginatedQuery(defaultQueryOptions);

  // ---- Estado de exclusão --------------------------------------------------
  const [toDelete, setToDelete] = useState<IbptListItem | null>(null);
  const {
    open: isOpenDeleteDialog,
    onOpen: onOpenDeleteDialog,
    onClose: onCloseDeleteDialog,
  } = useDisclosure();

  const ibptsList = useCustomGridQuery<IbptListItem, any>({
    asyncFunction: listIbpts,
    queryKey: queryKey.baseRegistrations.ibpts,
    paginatedQuery,
    setPaginatedQuery: handlePaginatedQuery,
    filterQuery: [],
  });

  const deleteMutation = useRequest({
    asyncFunction: async ({ ibptUuid }: { ibptUuid: string }) => {
      return await deleteIbptTable(ibptUuid);
    },
    queryKey: queryKey.baseRegistrations.ibpts,
    queryKey2: queryKey.baseRegistrations.ibpt,
    typesRequest: 'update',
    entityName: text.singularLabel,
    personalizedMessage: text.list.deletedToast,
    actionSuccess: () => {
      onCloseDeleteDialog();
      setToDelete(null);
    },
  });

  const handleDeleteClick = (ibpt: IbptListItem) => {
    setToDelete(ibpt);
    onOpenDeleteDialog();
  };

  const handleConfirmDelete = () => {
    if (toDelete) {
      deleteMutation.mutate({ ibptUuid: toDelete.uuid });
    }
  };

  const isDeleting = deleteMutation.isPending;

  const columnHelper = createColumnHelper<IbptListItem>();
  const defaultColumns = useMemo(
    () => [
      columnHelper.accessor('uf', {
        header: text.list.table.uf,
        enableHiding: false,
        meta: { ...styleColumTable.sm, gridLabel: text.list.table.uf },
        cell: ({ row }) => (
          <Text fontSize="sm" fontWeight="medium">
            {row.original.uf}
          </Text>
        ),
      }),
      columnHelper.accessor('versao', {
        header: text.list.table.versao,
        meta: { ...styleColumTable.sm, gridLabel: text.list.table.versao },
        cell: ({ row }) => (
          <Text fontSize="sm" color="fg.muted">
            {row.original.versao}
          </Text>
        ),
      }),
      columnHelper.accessor('items_count', {
        header: text.list.table.itemsCount,
        meta: { ...styleColumTable.sm, gridLabel: text.list.table.itemsCount },
        cell: ({ row }) => (
          <Text fontSize="sm" color="fg.muted" textAlign="right">
            {row.original.items_count}
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
                onClick={() => navigate(`/cadastros-base/ibpt/${row.original.uuid}`)}
              >
                {text.list.actions.view}
              </Actions.Item>
              {can('ibpts_delete') && (
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

  const gridSettings = useGridSettings<IbptListItem>({
    storageKey: IBPTS_STORAGE_KEY,
    storageScope: useGridStorageScope(),
    columns: defaultColumns,
  });
  const { columnOrder, setColumnOrder, columnVisibility, setColumnVisibility } = gridSettings;

  const isLoading = checkLoadingStatus([ibptsList]);
  const items = ibptsList.data?.data?.items;
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
            isError={ibptsList.isError}
            error={ibptsList.error}
            isEmpty={isEmpty}
            onRetry={() => ibptsList.refetch()}
            isRetrying={ibptsList.isFetching}
            emptyIcon={FiFileText as ElementType}
            emptyTitle={text.list.emptyState.titleEmpty}
            emptyDescription={text.list.emptyState.descriptionEmpty}
            canCreate={canCreate}
            createLabel={text.list.emptyState.cta}
            onCreate={() => navigate('/cadastros-base/ibpt/novo')}
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
        itemName={toDelete ? `${toDelete.uf} — ${toDelete.versao}` : undefined}
        tone="danger"
      />
    </ContainerGrid>
  );
}
