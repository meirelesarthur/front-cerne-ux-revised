// src/pages/BaseRegistrations/IssueDfeSyncTimes/index.tsx
// -----------------------------------------------------------------------------
// Tela de LISTAGEM (grid FLAT — sem hierarquia, SEM filtro) de SINCRONIZAÇÃO
// DFE (IssueDfeSyncTime) — Cadastros Base / Fiscais (TASK-DFE-FE-01).
//
// Rota: /cadastros-base/sincronizacao-dfe (guardada por
// `issue-dfe-sync-time_view`, registrada em src/router/index.tsx — este
// arquivo não mexe em rota/menu; item de menu "Fiscais → Sincronização DFe" e
// permissão de navegação JÁ EXISTIAM, navigationTree.ts:175/
// navigationPermissions.ts:78).
//
// Referência UX: UX-GAP declarado na ficha (nenhuma tela oficial "Sincronização
// DFe" no design system `cerne`) — precedente INTERNO
// CadastrosBase/MotivosBaixa (grid flat sem filtro, exclusão simples) +
// CadastrosBase/Contador (coluna com dado aninhado do relacionamento —
// `issuer.razao_social` aqui, `cidade.description` lá). Estrutura:
//   - grid via useCustomGridQuery inline (paginação REAL server-side, SEM
//     filtro — achado #3 da Tarefa: o contrato não documenta parâmetro de
//     busca em `index()`);
//   - HeaderTable → só ButtonAdd (SEM ButtonFilter, mesmo achado #3);
//   - delete via useRequest + DeleteConfirmDialog (SEM guarda de dependência
//     — DA-DFE-08, nenhuma tabela filha real; `onError` GENÉRICO do
//     useRequest fica de pé como defesa em profundidade).
// -----------------------------------------------------------------------------

import { ElementType, useMemo, useState } from 'react';

import { Box, Icon, Text, useDisclosure, VStack } from '@chakra-ui/react';
import { createColumnHelper } from '@tanstack/react-table';
import { FiCalendar, FiEdit, FiTrash2 } from 'react-icons/fi';
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
  deleteIssueDfeSyncTime,
  listIssueDfeSyncTimes,
} from '@/services/v2/BaseRegistrations/issueDfeSyncTimes-service';

import type { IssueDfeSyncTimeListItem } from '@/@types/v2/BaseRegistrations/issueDfeSyncTimes';

import { HeaderTable } from './HeaderTable';

// Chave de storage desta tela. Paginação (`userPaginatedQuery`) e
// personalização de grid (`useGridSettings`) derivam da MESMA expressão para
// nunca divergirem (DEC-007 §12), mesmo padrão de CadastrosBase/CentroCusto.
const ISSUE_DFE_SYNC_TIMES_STORAGE_KEY =
  'BaseRegistrationsIssueDfeSyncTimes' + queryKey.baseRegistrations.issueDfeSyncTimes;

export default function IssueDfeSyncTimesList() {
  const { languageGB } = useLanguage();
  const navigate = useNavigate();
  const { can } = usePermissions();
  const text = languageGB.baseRegistrations.issueDfeSyncTime;

  const canCreate = can('issue-dfe-sync-time_create');
  const canEdit = can('issue-dfe-sync-time_edit');
  const canDelete = can('issue-dfe-sync-time_delete');

  const defaultQueryOptions = useMemo(
    () => ({
      pageSize: 10,
      storageKey: ISSUE_DFE_SYNC_TIMES_STORAGE_KEY,
    }),
    []
  );

  // Sem filtro nesta tela (achado #3) — `handleFilterChange`/`handleResetFilter`
  // não são usados; só paginação real.
  const { paginatedQuery, handlePaginatedQuery } =
    userPaginatedQuery<Record<string, never>>(defaultQueryOptions);

  // ---- Estado de exclusão --------------------------------------------------
  const [toDelete, setToDelete] = useState<IssueDfeSyncTimeListItem | null>(null);
  const {
    open: isOpenDeleteDialog,
    onOpen: onOpenDeleteDialog,
    onClose: onCloseDeleteDialog,
  } = useDisclosure();

  const issueDfeSyncTimesList = useCustomGridQuery<IssueDfeSyncTimeListItem, Record<string, never>>(
    {
      asyncFunction: listIssueDfeSyncTimes,
      queryKey: queryKey.baseRegistrations.issueDfeSyncTimes,
      paginatedQuery,
      setPaginatedQuery: handlePaginatedQuery,
      filterQuery: [],
      filter: {},
    }
  );

  const deleteMutation = useRequest({
    asyncFunction: async ({ issueDfeSyncTimeUuid }: { issueDfeSyncTimeUuid: string }) => {
      return await deleteIssueDfeSyncTime(issueDfeSyncTimeUuid);
    },
    queryKey: queryKey.baseRegistrations.issueDfeSyncTimes,
    queryKey2: queryKey.baseRegistrations.issueDfeSyncTime,
    // `useRequest`'s TypesRequest não tem variante "delete" (só update/create/
    // apply/export/revoke/restore) — "update" é a mesma convenção usada por
    // MotivosBaixa/CategoryProduct para a mesma operação. O texto exibido no
    // toast vem de `personalizedMessage`, então o rótulo genérico associado a
    // "update" nunca aparece ao usuário.
    //
    // onError: NÃO customizado — usa o tratamento genérico interno do
    // useRequest (lê `message`/`error` do envelope). Sem guarda de
    // dependência nesta exclusão (DA-DFE-08 — nenhuma tabela filha real), o
    // onError genérico fica de pé só como defesa em profundidade.
    typesRequest: 'update',
    entityName: text.singularLabel,
    personalizedMessage: text.list.deletedToast,
    actionSuccess: () => {
      onCloseDeleteDialog();
      setToDelete(null);
    },
  });

  const handleDeleteClick = (issueDfeSyncTime: IssueDfeSyncTimeListItem) => {
    setToDelete(issueDfeSyncTime);
    onOpenDeleteDialog();
  };

  const handleConfirmDelete = () => {
    if (toDelete) {
      deleteMutation.mutate({ issueDfeSyncTimeUuid: toDelete.uuid });
    }
  };

  const isDeleting = deleteMutation.isPending;

  const columnHelper = createColumnHelper<IssueDfeSyncTimeListItem>();
  const defaultColumns = useMemo(
    () => [
      columnHelper.accessor((row) => row.issuer?.razao_social ?? '', {
        id: 'issuer',
        header: text.list.table.issuer,
        cell: ({ row }) => (
          <Text fontWeight="medium" lineClamp="1">
            {row.original.issuer?.razao_social ?? '—'}
          </Text>
        ),
        meta: { gridLabel: text.list.table.issuer },
      }),
      columnHelper.accessor('sync_hour_label', {
        header: text.list.table.syncHour,
        cell: ({ row }) => (
          <Text fontFamily="mono" fontSize="sm" fontWeight="medium">
            {row.original.sync_hour_label}
          </Text>
        ),
        meta: { ...styleColumTable.sm, gridLabel: text.list.table.syncHour },
      }),
      columnHelper.display({
        id: 'acoes',
        header: '',
        enableHiding: false,
        cell: ({ row }) => (
          <Actions size="sm">
            {canEdit && (
              <Actions.Item
                icon={<Icon as={FiEdit} />}
                onClick={() => navigate(`/cadastros-base/sincronizacao-dfe/${row.original.uuid}`)}
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

  const gridSettings = useGridSettings<IssueDfeSyncTimeListItem>({
    storageKey: ISSUE_DFE_SYNC_TIMES_STORAGE_KEY,
    storageScope: useGridStorageScope(),
    columns: defaultColumns,
  });
  const { columnOrder, setColumnOrder, columnVisibility, setColumnVisibility } = gridSettings;

  const isLoading = checkLoadingStatus([issueDfeSyncTimesList]);
  const items = issueDfeSyncTimesList.data?.data?.items;
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
            isError={issueDfeSyncTimesList.isError}
            error={issueDfeSyncTimesList.error}
            isEmpty={isEmpty}
            onRetry={() => issueDfeSyncTimesList.refetch()}
            isRetrying={issueDfeSyncTimesList.isFetching}
            retryLabel={text.list.error.retry}
            emptyIcon={FiCalendar as ElementType}
            emptyTitle={
              canCreate ? text.list.emptyState.titleEmpty : text.list.emptyState.titleEmptyNoCreate
            }
            emptyDescription={
              canCreate
                ? text.list.emptyState.descriptionEmpty
                : text.list.emptyState.descriptionEmptyNoCreate
            }
            canCreate={canCreate}
            createLabel={text.list.emptyState.cta}
            onCreate={() => navigate('/cadastros-base/sincronizacao-dfe/novo')}
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
        itemName={toDelete?.issuer?.razao_social}
      />
    </ContainerGrid>
  );
}
