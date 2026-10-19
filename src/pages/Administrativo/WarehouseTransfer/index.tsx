// src/pages/Administrativo/WarehouseTransfer/index.tsx
// -----------------------------------------------------------------------------
// Tela de LISTAGEM (grid) de Trans. Armazém (WarehouseTransfer — Estoque,
// TASK-WT-FE-02). Rota `/administrativo/transf-armazens` — guardada por
// `<RequirePermission permission="warehouse-transfer_view">`. Item de menu
// (`adm-est-trm`) e permissão de navegação JÁ EXISTIAM
// (`navigationTree.ts`/`navigationPermissions.ts`) — esta Tarefa só conecta a
// rota real.
//
// UX-GAP confirmado (`## 11` do contrato WarehouseTransfer — nenhuma tela
// `*transfer*`/`*transferencia*` localizada em `GB.Cerne.UX`) — seguido pelo
// padrão de desenvolvimento (design system `cerne` + `src/_examples/`),
// sinalizado, não trava. Mirror direto de
// `src/pages/Administrativo/Fabrica/FoodBeat/index.tsx` (mesma família de
// grid — `useCustomGridQuery`/`userPaginatedQuery`/`useGridSettings`/
// `useGridStorageScope`).
//
// Ações de linha SOMENTE "Editar"/"Excluir" (Checklist global de UX item 1 —
// sem "Ver"/"Imprimir" aqui, diferente de Batida).
//
// Grid exibe AMBOS os armazéns (origem via `origin.warehouse.description` e
// destino via `destination_warehouse.description`) em colunas distintas, com
// fallback '—' — `origin`/`destination_warehouse` podem vir `null` do
// Resource se a relação não carregar (`whenLoaded`), optional chaining
// obrigatório em todo acesso (mesma defesa em profundidade de
// `CreateOrUpdateFoodBeat.tsx::fillForm`).
// -----------------------------------------------------------------------------

import { ElementType, useMemo, useState } from 'react';

import { Box, Flex, Icon, Text, useDisclosure, VStack } from '@chakra-ui/react';
import { createColumnHelper } from '@tanstack/react-table';
import { FiEdit, FiRepeat, FiTrash2 } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';

import { Actions } from '@/components/Action';
import { ButtonAdd } from '@/components/ButtonAdd';
import { ButtonFilter } from '@/components/ButtonFilter';
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

import { queryKey } from '@/constants/query-key';

import {
  deleteWarehouseTransfer,
  listWarehouseTransfers,
} from '@/services/v2/WarehouseTransfers/warehouse-transfer-service';
import type { ListWarehouseTransfersParams } from '@/services/v2/WarehouseTransfers/warehouse-transfer-service';

import type {
  WarehouseTransferFilterForm,
  WarehouseTransferListItem,
} from '@/@types/v2/WarehouseTransfers';

import { FilterSideWarehouseTransfer } from './FilterSideWarehouseTransfer';

// Chave de storage desta tela — NÃO colide com outras chaves de Estoque
// (prefixo próprio + `queryKey.warehouseTransfers.warehouseTransfers`).
const WAREHOUSE_TRANSFER_STORAGE_KEY =
  'AdministrativoWarehouseTransfer' + queryKey.warehouseTransfers.warehouseTransfers;

// Achatamento `WarehouseTransferFilterForm` (Option-based, TASK-WT-FE-01) →
// `ListWarehouseTransfersParams` (querystring real de `GET /warehouse-transfers`)
// — mirror `FoodBeatList::toRequestFilter`.
function toRequestFilter(
  filter?: WarehouseTransferFilterForm | null
): ListWarehouseTransfersParams {
  return {
    product_uuid: filter?.product_uuid?.value || undefined,
    warehouse_uuid: filter?.warehouse_uuid?.value || undefined, // DESTINO
    date_from: filter?.date_from || undefined,
    date_to: filter?.date_to || undefined,
  };
}

function formatQuantity(value: number | string): string {
  const numeric = Number(value) || 0;
  return numeric.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function WarehouseTransferList() {
  const { languageGB } = useLanguage();
  const navigate = useNavigate();
  const { can } = usePermissions();
  const text = languageGB.warehouseTransfers.warehouseTransfer;

  const canCreate = can('warehouse-transfer_create');
  const canEdit = can('warehouse-transfer_view');

  const defaultQueryOptions = useMemo(
    () => ({
      pageSize: 10,
      storageKey: WAREHOUSE_TRANSFER_STORAGE_KEY,
    }),
    []
  );

  const { paginatedQuery, handlePaginatedQuery, handleFilterChange, handleResetFilter } =
    userPaginatedQuery<WarehouseTransferFilterForm>(defaultQueryOptions);

  // ---- Estado de filtro (drawer) ------------------------------------------
  const { open: isFilterOpen, onOpen: onOpenFilter, onClose: onCloseFilter } = useDisclosure();

  const filtersApplied = useMemo(
    () =>
      Object.values(paginatedQuery.filter ?? {}).filter(
        (v) => v !== undefined && v !== null && v !== ''
      ).length,
    [paginatedQuery.filter]
  );

  const requestFilter = useMemo(
    () => toRequestFilter(paginatedQuery.filter),
    [paginatedQuery.filter]
  );

  const warehouseTransfersList = useCustomGridQuery<
    WarehouseTransferListItem,
    ListWarehouseTransfersParams
  >({
    asyncFunction: listWarehouseTransfers,
    queryKey: queryKey.warehouseTransfers.warehouseTransfers,
    paginatedQuery,
    setPaginatedQuery: handlePaginatedQuery,
    filterQuery: [],
    filter: requestFilter,
  });

  // ---- Estado de exclusão ---------------------------------------------------
  const [toDelete, setToDelete] = useState<WarehouseTransferListItem | null>(null);
  const {
    open: isOpenDeleteDialog,
    onOpen: onOpenDeleteDialog,
    onClose: onCloseDeleteDialog,
  } = useDisclosure();

  // `typesRequest: 'apply'` — V3 não tem variante "delete" própria
  // (`personalizedMessage` sempre vence o rótulo genérico). O 422 de
  // constraint (`23503`, "em uso") já é tratado pelo backend e chega aqui
  // como mensagem amigável via `extractApiFieldErrorMessage` (dentro de
  // `useRequest`) — sem crash, sem tratamento adicional necessário nesta tela.
  const deleteMutation = useRequest({
    asyncFunction: async ({ warehouseTransferUuid }: { warehouseTransferUuid: string }) => {
      // `deleteWarehouseTransfer` retorna `Promise<void>` (204 sem body, TASK-WT-FE-01) —
      // `undefined` explícito satisfaz o contrato `Promise<Response<any> | undefined>`
      // de `useRequest` sem alterar o service já travado pela fundação.
      await deleteWarehouseTransfer(warehouseTransferUuid);
      return undefined;
    },
    queryKey: queryKey.warehouseTransfers.warehouseTransfers,
    typesRequest: 'apply',
    entityName: text.singularLabel,
    personalizedMessage: text.list.deletedToast,
    actionSuccess: () => {
      onCloseDeleteDialog();
      setToDelete(null);
    },
  });

  const handleDeleteClick = (warehouseTransfer: WarehouseTransferListItem) => {
    setToDelete(warehouseTransfer);
    onOpenDeleteDialog();
  };

  const handleConfirmDelete = () => {
    if (toDelete) {
      deleteMutation.mutate({ warehouseTransferUuid: toDelete.uuid });
    }
  };

  const isDeleting = deleteMutation.isPending;

  const columnHelper = createColumnHelper<WarehouseTransferListItem>();
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
      columnHelper.accessor((row) => row.origin?.product?.description ?? '', {
        id: 'product',
        header: text.list.columns.product,
        enableHiding: false, // coluna-âncora — nunca ocultável
        cell: ({ row }) => (
          <Text fontWeight="medium" lineClamp="1">
            {row.original.origin?.product?.description ?? '—'}
          </Text>
        ),
        meta: { gridLabel: text.list.columns.product },
      }),
      columnHelper.accessor((row) => row.origin?.warehouse?.description ?? '', {
        id: 'originWarehouse',
        header: text.list.columns.originWarehouse,
        cell: ({ row }) => (
          <Text fontSize="sm">{row.original.origin?.warehouse?.description ?? '—'}</Text>
        ),
        meta: { gridLabel: text.list.columns.originWarehouse },
      }),
      columnHelper.accessor((row) => row.destination_warehouse?.description ?? '', {
        id: 'destinationWarehouse',
        header: text.list.columns.destinationWarehouse,
        cell: ({ row }) => (
          <Text fontSize="sm">{row.original.destination_warehouse?.description ?? '—'}</Text>
        ),
        meta: { gridLabel: text.list.columns.destinationWarehouse },
      }),
      columnHelper.accessor('quantity', {
        header: text.list.columns.quantity,
        cell: ({ row }) => (
          <Text fontSize="sm" textAlign="right" fontVariantNumeric="tabular-nums">
            {formatQuantity(row.original.quantity)}
          </Text>
        ),
        meta: { ...styleColumTable.sm, gridLabel: text.list.columns.quantity },
      }),
      columnHelper.accessor((row) => row.user?.name ?? '', {
        id: 'user',
        header: text.list.columns.user,
        cell: ({ row }) => <Text fontSize="sm">{row.original.user?.name ?? '—'}</Text>,
        meta: { gridLabel: text.list.columns.user },
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
                  onClick={() => navigate(`/administrativo/transf-armazens/${row.original.uuid}`)}
                >
                  {text.list.actions.edit}
                </Actions.Item>
              )}
              {can('warehouse-transfer_delete') && (
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
    [navigate, isDeleting, text, can, canEdit, languageGB.defaltStrings.actions]
  );

  const gridSettings = useGridSettings<WarehouseTransferListItem>({
    storageKey: WAREHOUSE_TRANSFER_STORAGE_KEY,
    storageScope: useGridStorageScope(),
    columns: defaultColumns,
  });
  const { columnOrder, setColumnOrder, columnVisibility, setColumnVisibility } = gridSettings;

  const isLoading = checkLoadingStatus([warehouseTransfersList]);
  const items = warehouseTransfersList.data?.data?.items;
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
                  onClick={() => navigate('/administrativo/transf-armazens/novo')}
                  languageGB={languageGB}
                />
              )}
              <GridSettingsFloatingPanel
                gridSettings={gridSettings}
                triggerLabel={languageGB.defaltStrings.gridSettings.trigger}
              />
              <ButtonFilter filtersApplied={filtersApplied} onClick={onOpenFilter} />
            </>
          }
        >
          <VStack align="flex-start" gap={1}>
            <Text fontSize="2xl" fontWeight="bold" color="brandColorText">
              {text.singularLabel}
            </Text>
          </VStack>
        </HeaderGrid>

        <Box mt={6}>
          <Table
            isLoading={isLoading}
            isError={warehouseTransfersList.isError}
            error={warehouseTransfersList.error}
            isEmpty={isEmpty}
            onRetry={() => warehouseTransfersList.refetch()}
            isRetrying={warehouseTransfersList.isFetching}
            emptyIcon={FiRepeat as ElementType}
            emptyTitle={
              filtersApplied > 0 ? text.list.emptyState.titleFiltered : text.list.emptyState.titleEmpty
            }
            emptyDescription={
              filtersApplied > 0
                ? text.list.emptyState.descriptionFiltered
                : text.list.emptyState.descriptionEmpty
            }
            canCreate={filtersApplied === 0 && canCreate}
            createLabel={text.list.emptyState.cta}
            onCreate={() => navigate('/administrativo/transf-armazens/novo')}
          />
        </Box>
      </TableProvider>

      <FilterSideWarehouseTransfer
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
        itemName={toDelete?.code}
        tone="danger"
      />
    </ContainerGrid>
  );
}
