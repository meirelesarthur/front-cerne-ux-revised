// src/pages/Administrativo/FarmTransfer/index.tsx
// -----------------------------------------------------------------------------
// Tela de LISTAGEM (grid) de Trans. Fazendas (FarmTransfer — Estoque,
// Tarefa 01). Rota `/administrativo/transf-fazendas` — guardada por
// `<RequirePermission permission="warehouse-transfer-farm_view">`. Item de
// menu (`adm-est-trf`) e permissão de navegação JÁ EXISTIAM
// (`navigationTree.ts:472`) — esta Tarefa só conecta a rota real (hoje cai
// no `RoutePlaceholder`).
//
// Mirror estrutural DIRETO de `WarehouseTransfer/index.tsx` (mesmo domínio
// `StockMovement`, `between_farms=true`), com 2 colunas NOVAS vs. o irmão
// (`originFarm`/`destinationFarm`, mirror `LST-05`/`LST-07` do legado — a
// fazenda de origem e de destino DIVERGEM nesta feature, ao contrário do
// irmão onde é sempre a mesma fazenda).
//
// Ações de linha SOMENTE "Ver"/"Excluir" — NÃO há "Editar" (`RT-06
// NAO_APLICAVEL`, modo editar comprovadamente inexistente no legado; ação
// "ver" abre `FarmTransferDetalhe.tsx`, `GAP-FARMTRANSFER-FE-04`).
//
// Coluna "Unidade" do legado (`LST-04`) NÃO migra — `FarmTransferResource`
// não expõe `measurement` no bloco `origin` (DoD da Tarefa 01, sem N+1 para
// resolver isso).
//
// Grid exibe `origin`/`destination_warehouse` com fallback '—' —
// `origin`/`destination_warehouse` podem vir `null` do Resource se a
// relação não carregar (`whenLoaded`), optional chaining obrigatório em
// todo acesso (mesma defesa em profundidade do irmão).
// -----------------------------------------------------------------------------

import { ElementType, useMemo, useState } from 'react';

import { Box, Flex, Icon, Text, useDisclosure, VStack } from '@chakra-ui/react';
import { createColumnHelper } from '@tanstack/react-table';
import { FiEye, FiRepeat, FiTrash2 } from 'react-icons/fi';
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
  deleteFarmTransfer,
  listFarmTransfers,
} from '@/services/v2/FarmTransfers/farm-transfer-service';
import type { ListFarmTransfersParams } from '@/services/v2/FarmTransfers/farm-transfer-service';

import type { FarmTransferFilterForm, FarmTransferListItem } from '@/@types/v2/FarmTransfers';

import { FilterSideFarmTransfer } from './FilterSideFarmTransfer';

// Chave de storage desta tela — NÃO colide com outras chaves de Estoque
// (prefixo próprio + `queryKey.farmTransfers.farmTransfers`).
const FARM_TRANSFER_STORAGE_KEY =
  'AdministrativoFarmTransfer' + queryKey.farmTransfers.farmTransfers;

// Achatamento `FarmTransferFilterForm` (Option-based) →
// `ListFarmTransfersParams` (querystring real de `GET /farm-transfers`) —
// mirror `WarehouseTransferList::toRequestFilter`.
function toRequestFilter(filter?: FarmTransferFilterForm | null): ListFarmTransfersParams {
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

export default function FarmTransferList() {
  const { languageGB } = useLanguage();
  const navigate = useNavigate();
  const { can } = usePermissions();
  const text = languageGB.farmTransfers.farmTransfer;

  const canCreate = can('warehouse-transfer-farm_create');
  const canView = can('warehouse-transfer-farm_view');
  const canDelete = can('warehouse-transfer-farm_delete');

  const defaultQueryOptions = useMemo(
    () => ({
      pageSize: 10,
      storageKey: FARM_TRANSFER_STORAGE_KEY,
    }),
    []
  );

  const { paginatedQuery, handlePaginatedQuery, handleFilterChange, handleResetFilter } =
    userPaginatedQuery<FarmTransferFilterForm>(defaultQueryOptions);

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

  const farmTransfersList = useCustomGridQuery<FarmTransferListItem, ListFarmTransfersParams>({
    asyncFunction: listFarmTransfers,
    queryKey: queryKey.farmTransfers.farmTransfers,
    paginatedQuery,
    setPaginatedQuery: handlePaginatedQuery,
    filterQuery: [],
    filter: requestFilter,
  });

  // ---- Estado de exclusão ---------------------------------------------------
  const [toDelete, setToDelete] = useState<FarmTransferListItem | null>(null);
  const {
    open: isOpenDeleteDialog,
    onOpen: onOpenDeleteDialog,
    onClose: onCloseDeleteDialog,
  } = useDisclosure();

  const deleteMutation = useRequest({
    asyncFunction: async ({ farmTransferUuid }: { farmTransferUuid: string }) => {
      // `deleteFarmTransfer` retorna `Promise<void>` (204 sem body) —
      // `undefined` explícito satisfaz o contrato `Promise<Response<any> | undefined>`
      // de `useRequest` sem alterar o service já travado pela fundação.
      await deleteFarmTransfer(farmTransferUuid);
      return undefined;
    },
    queryKey: queryKey.farmTransfers.farmTransfers,
    typesRequest: 'apply',
    entityName: text.singularLabel,
    personalizedMessage: text.list.deletedToast,
    actionSuccess: () => {
      onCloseDeleteDialog();
      setToDelete(null);
    },
  });

  const handleDeleteClick = (farmTransfer: FarmTransferListItem) => {
    setToDelete(farmTransfer);
    onOpenDeleteDialog();
  };

  const handleConfirmDelete = () => {
    if (toDelete) {
      deleteMutation.mutate({ farmTransferUuid: toDelete.uuid });
    }
  };

  const isDeleting = deleteMutation.isPending;

  const columnHelper = createColumnHelper<FarmTransferListItem>();
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
      columnHelper.accessor((row) => row.origin?.farm?.description ?? '', {
        id: 'originFarm',
        header: text.list.columns.originFarm,
        cell: ({ row }) => (
          <Text fontSize="sm">{row.original.origin?.farm?.description ?? '—'}</Text>
        ),
        meta: { gridLabel: text.list.columns.originFarm },
      }),
      columnHelper.accessor((row) => row.origin?.warehouse?.description ?? '', {
        id: 'originWarehouse',
        header: text.list.columns.originWarehouse,
        cell: ({ row }) => (
          <Text fontSize="sm">{row.original.origin?.warehouse?.description ?? '—'}</Text>
        ),
        meta: { gridLabel: text.list.columns.originWarehouse },
      }),
      // Coluna NOVA vs. o irmão `WarehouseTransfer` — a fazenda de destino
      // é uma capacidade nova desta feature (mirror `LST-07` do legado).
      columnHelper.accessor((row) => row.destination_warehouse?.farm?.description ?? '', {
        id: 'destinationFarm',
        header: text.list.columns.destinationFarm,
        cell: ({ row }) => (
          <Text fontSize="sm">{row.original.destination_warehouse?.farm?.description ?? '—'}</Text>
        ),
        meta: { gridLabel: text.list.columns.destinationFarm },
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
              {canView && (
                <Actions.Item
                  icon={<Icon as={FiEye} />}
                  onClick={() => navigate(`/administrativo/transf-fazendas/${row.original.uuid}`)}
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
    [navigate, isDeleting, text, canView, canDelete, languageGB.defaltStrings.actions]
  );

  const gridSettings = useGridSettings<FarmTransferListItem>({
    storageKey: FARM_TRANSFER_STORAGE_KEY,
    storageScope: useGridStorageScope(),
    columns: defaultColumns,
  });
  const { columnOrder, setColumnOrder, columnVisibility, setColumnVisibility } = gridSettings;

  const isLoading = checkLoadingStatus([farmTransfersList]);
  const items = farmTransfersList.data?.data?.items;
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
                  onClick={() => navigate('/administrativo/transf-fazendas/novo')}
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
            isError={farmTransfersList.isError}
            error={farmTransfersList.error}
            isEmpty={isEmpty}
            onRetry={() => farmTransfersList.refetch()}
            isRetrying={farmTransfersList.isFetching}
            emptyIcon={FiRepeat as ElementType}
            emptyTitle={
              filtersApplied > 0
                ? text.list.emptyState.titleFiltered
                : text.list.emptyState.titleEmpty
            }
            emptyDescription={
              filtersApplied > 0
                ? text.list.emptyState.descriptionFiltered
                : text.list.emptyState.descriptionEmpty
            }
            canCreate={filtersApplied === 0 && canCreate}
            createLabel={text.list.emptyState.cta}
            onCreate={() => navigate('/administrativo/transf-fazendas/novo')}
          />
        </Box>
      </TableProvider>

      <FilterSideFarmTransfer
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
