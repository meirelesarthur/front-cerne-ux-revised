// src/pages/Operacional/TransferAbcBatch/index.tsx
// -----------------------------------------------------------------------------
// Tela de LISTAGEM (grid) de Transferência ABC de Animais entre Lotes
// (TransferAbcBatch — Operacional > Pecuária > Transferências,
// 97-Esteiras/039, TASK-FE-039-ABC-02). Rota `/operacional/transferencias`,
// guardada por `<RequirePermission permission="transfer_abc_batch_view">`.
// Item de menu (`ope-pec-tra`, "Transferências") e permissão de navegação
// (`anyOf` já inclui `transfer_abc_batch_{view,create,delete}`) JÁ EXISTIAM
// (`navigationTree.ts`/`navigationPermissions.ts`) — esta Tarefa só conecta
// a rota real (hoje cai no `RoutePlaceholder` de `/operacional/*`).
//
// Mirror ESTRUTURAL DIRETO de `FarmTransfer/index.tsx` (mesma classe de
// tela: grid simples + delete, sem update).
//
// ⚠️ SEM drawer de filtro (achado confirmado por leitura direta de
// `TransferAbcBatchIndexRequest::rules()`, GB.Cerne.Api): a listagem só
// aceita `per_page` — nenhum campo é filtrável no servidor. Fabricar um
// filtro cujos campos o backend ignoraria violaria "SEM MOCK mascarando
// integração" — por isso esta tela NÃO monta `<Form formFilter>`/
// `FilterSide` (Contrato B fica sem superfície real para aplicar).
//
// Ações de linha SOMENTE "Ver"/"Excluir" — NÃO há "Editar" (D3, parity: a
// API nunca teve `update()`).
// -----------------------------------------------------------------------------

import { useMemo, useState } from 'react';

import type { ElementType } from 'react';

import { Badge, Box, Flex, Icon, Text, useDisclosure, VStack } from '@chakra-ui/react';
import { createColumnHelper } from '@tanstack/react-table';
import { FiEye, FiRepeat, FiTrash2 } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';

import { Actions } from '@/components/Action';
import { ButtonAdd } from '@/components/ButtonAdd';
import { ContainerGrid } from '@/components/ContainerGrid';
import { DeleteConfirmDialog } from '@/components/DeleteConfirmDialog';
import { GridSettingsFloatingPanel } from '@/components/GridSettings/GridSettingsFloatingPanel';
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
import { styleColumTable } from '@/utils/style-colum-table';

import { transferAbcTypeColor } from '@/constants/livestock/transferAbcBatch/transferAbcBatch-status';
import { queryKey } from '@/constants/query-key';

import {
  deleteTransferAbcBatch,
  listTransferAbcBatches,
} from '@/services/v2/Livestock/transferAbcBatch-service';
import type { ListTransferAbcBatchesParams } from '@/services/v2/Livestock/transferAbcBatch-service';

import type { TransferAbcBatchListItem } from '@/@types/v2/Livestock/transferAbcBatch';

const TRANSFER_ABC_BATCH_STORAGE_KEY =
  'OperacionalTransferAbcBatch' + queryKey.livestock.transferAbcBatches;

export default function TransferAbcBatchList() {
  const { languageGB } = useLanguage();
  const navigate = useNavigate();
  const { can } = usePermissions();
  const text = languageGB.livestock.transferAbcBatch;
  const typeText = text.type;

  const canCreate = can('transfer_abc_batch_create');
  const canView = can('transfer_abc_batch_view');
  const canDelete = can('transfer_abc_batch_delete');

  const defaultQueryOptions = useMemo(
    () => ({
      pageSize: 10,
      storageKey: TRANSFER_ABC_BATCH_STORAGE_KEY,
    }),
    []
  );

  const { paginatedQuery, handlePaginatedQuery } =
    userPaginatedQuery<Record<string, never>>(defaultQueryOptions);

  const transferAbcBatchesList = useCustomGridQuery<
    TransferAbcBatchListItem,
    ListTransferAbcBatchesParams
  >({
    asyncFunction: listTransferAbcBatches,
    queryKey: queryKey.livestock.transferAbcBatches,
    paginatedQuery,
    setPaginatedQuery: handlePaginatedQuery,
    filterQuery: [],
    filter: {},
  });

  // ---- Estado de exclusão ---------------------------------------------------
  const [toDelete, setToDelete] = useState<TransferAbcBatchListItem | null>(null);
  const {
    open: isOpenDeleteDialog,
    onOpen: onOpenDeleteDialog,
    onClose: onCloseDeleteDialog,
  } = useDisclosure();

  const deleteMutation = useRequest({
    asyncFunction: async ({ transferAbcBatchUuid }: { transferAbcBatchUuid: string }) => {
      await deleteTransferAbcBatch(transferAbcBatchUuid);
      return undefined;
    },
    queryKey: queryKey.livestock.transferAbcBatches,
    typesRequest: 'apply',
    entityName: text.singularLabel,
    personalizedMessage: text.list.deletedToast,
    actionSuccess: () => {
      onCloseDeleteDialog();
      setToDelete(null);
    },
  });

  const handleDeleteClick = (transferAbcBatch: TransferAbcBatchListItem) => {
    setToDelete(transferAbcBatch);
    onOpenDeleteDialog();
  };

  const handleConfirmDelete = () => {
    if (toDelete) {
      deleteMutation.mutate({ transferAbcBatchUuid: toDelete.uuid });
    }
  };

  const isDeleting = deleteMutation.isPending;

  const columnHelper = createColumnHelper<TransferAbcBatchListItem>();
  const defaultColumns = useMemo(
    () => [
      columnHelper.accessor('code', {
        header: text.list.columns.code,
        cell: ({ row }) => (
          <Text fontFamily="mono" fontSize="sm" fontWeight="medium">
            {row.original.code}
          </Text>
        ),
        meta: { ...styleColumTable.sm, gridLabel: text.list.columns.code },
      }),
      columnHelper.accessor('date', {
        header: text.list.columns.date,
        cell: ({ row }) => (
          <Text fontSize="sm" color="fg.muted">
            {row.original.date ? formatDate(row.original.date, 'dd/MM/yyyy') : '—'}
          </Text>
        ),
        meta: { ...styleColumTable.date, gridLabel: text.list.columns.date },
      }),
      columnHelper.accessor('description', {
        header: text.list.columns.description,
        enableHiding: false,
        cell: ({ row }) => (
          <Text fontWeight="medium" lineClamp="1">
            {row.original.description}
          </Text>
        ),
        meta: { gridLabel: text.list.columns.description },
      }),
      columnHelper.accessor('type', {
        header: text.list.columns.type,
        cell: ({ row }) => (
          <Badge colorPalette={transferAbcTypeColor[row.original.type] ?? 'gray'} variant="subtle">
            {row.original.type === 1 ? typeText.entrada : typeText.saida}
          </Badge>
        ),
        meta: { ...styleColumTable.sm, gridLabel: text.list.columns.type },
      }),
      columnHelper.accessor((row) => row.user?.label ?? '', {
        id: 'user',
        header: text.list.columns.user,
        cell: ({ row }) => <Text fontSize="sm">{row.original.user?.label ?? '—'}</Text>,
        meta: { gridLabel: text.list.columns.user },
      }),
      columnHelper.display({
        id: 'acoes',
        header: '',
        enableHiding: false,
        cell: ({ row }) => (
          <Flex justify="flex-end">
            <Actions size="sm">
              {canView && (
                <Actions.Item
                  icon={<Icon as={FiEye} />}
                  onClick={() => navigate(`/operacional/transferencias/${row.original.uuid}`)}
                >
                  {text.list.actions.view}
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
    [navigate, isDeleting, text, typeText, canView, canDelete, languageGB.defaltStrings.actions]
  );

  const gridSettings = useGridSettings<TransferAbcBatchListItem>({
    storageKey: TRANSFER_ABC_BATCH_STORAGE_KEY,
    storageScope: useGridStorageScope(),
    columns: defaultColumns,
  });
  const { columnOrder, setColumnOrder, columnVisibility, setColumnVisibility } = gridSettings;

  const isLoading = checkLoadingStatus([transferAbcBatchesList]);
  const items = transferAbcBatchesList.data?.data?.items;
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
            <>
              {canCreate && (
                <ButtonAdd
                  onClick={() => navigate('/operacional/transferencias/novo')}
                  languageGB={languageGB}
                />
              )}
              <GridSettingsFloatingPanel
                gridSettings={gridSettings}
                triggerLabel={languageGB.defaltStrings.gridSettings.trigger}
              />
            </>
          }
        >
          <VStack align="flex-start" gap={1}>
            <Text fontSize="2xl" fontWeight="bold" color="brandColorText">
              {text.pluralLabel}
            </Text>
          </VStack>
        </HeaderGrid>

        <Box mt={6}>
          <Table
            isLoading={isLoading}
            isError={transferAbcBatchesList.isError}
            error={transferAbcBatchesList.error}
            isEmpty={isEmpty}
            onRetry={() => transferAbcBatchesList.refetch()}
            isRetrying={transferAbcBatchesList.isFetching}
            emptyIcon={FiRepeat as ElementType}
            emptyTitle={text.list.emptyState.titleEmpty}
            emptyDescription={text.list.emptyState.descriptionEmpty}
            canCreate={false}
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
        itemName={toDelete?.code}
        warningText={text.list.deleteConfirmMessage}
        tone="danger"
      />
    </ContainerGrid>
  );
}
