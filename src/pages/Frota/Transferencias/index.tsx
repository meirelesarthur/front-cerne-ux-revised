// src/pages/Frota/Transferencias/index.tsx
// -----------------------------------------------------------------------------
// Tela de LISTAGEM (grid) de Transferência de Máquinas — TASK-ETR-FE-02.
// Clone estrutural de `src/pages/Frota/Abastecimentos/index.tsx`. 7 colunas
// (LM-01..LM-07), legenda de status CORRIGIDA (3 estados, OD-004), filtro de
// período (FE-10), linhas-filhas de máquina expansíveis (DEC-FE-ETR-05) e
// cancelamento (SE-03/CL-08 — vira status=3, o registro CONTINUA na lista).
//
// As 3 ações da coluna (`AC-02..AC-04`) são a ÚNICA barreira de
// Receber/Cancelar — a API NÃO as repete (OD-002, DEB-01). Comparação de
// fazenda SEMPRE por `uuid` (`useAuth().activeFarmUuid`, fonte reativa do
// mesmo `app-active-farm` que o interceptor injeta como `X-Farm-Id`).
// -----------------------------------------------------------------------------

import { useMemo, useState } from 'react';

import { Box, Flex, HStack, Icon, Table, Text, useDisclosure } from '@chakra-ui/react';
import { createColumnHelper } from '@tanstack/react-table';
import { FiCheckCircle, FiEye, FiXCircle } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';

import { Actions } from '@/components/Action';
import { ContainerGrid } from '@/components/ContainerGrid';
import { DeleteConfirmDialog } from '@/components/DeleteConfirmDialog';
import { EmptyState } from '@/components/EmptyState';
import { HeaderGrid } from '@/components/HeaderGrid';
import { Status } from '@/components/Status';
import { Table as GridTable } from '@/components/Table';

import { TableProvider } from '@/contexts/TableContext';

import { useAuth } from '@/hooks/useAuth';
import { useGridSettings } from '@/hooks/useGridSettings';
import { useGridStorageScope } from '@/hooks/useGridStorageScope';
import { useLanguage } from '@/hooks/useLanguage';
import { userPaginatedQuery } from '@/hooks/usePaginatedQueryStorage';
import { usePermissions } from '@/hooks/usePermissions';
import { useRequest } from '@/hooks/useRequest';

import { checkLoadingStatus } from '@/utils/checkLoadingStatus';
import formatDate from '@/utils/formatDate';
import { styleColumTable } from '@/utils/style-colum-table';

import { EQUIPMENT_TRANSFER_STATUS_LEGEND } from '@/constants/frota/equipment-transfer-status';
import { queryKey } from '@/constants/query-key';

import { cancelEquipmentTransfer } from '@/services/v2/EquipmentTransfers/equipment-transfer-service';

import type {
  EquipmentTransferEquipmentRef,
  EquipmentTransferFilterForm,
  EquipmentTransferListItem,
} from '@/@types/v2/EquipmentTransfers';

import { FilterSideTransferencias } from './FilterSideTransferencias';
import { HeaderTable } from './HeaderTable';
import { useEquipmentTransfersList } from './useTransferencias';

const TRANSFERENCIAS_STORAGE_KEY =
  'FrotaTransferencias' + queryKey.equipmentTransfers.equipmentTransfers;

// Linhas-filhas de máquina (LM-08, DEC-FE-ETR-05) — mirror
// `SupplyItemsSubRow.tsx`, mas com uma única coluna (descrição da máquina):
// o payload da própria linha (`equipments[]`) já traz tudo, SEM request
// extra por linha.
function TransferEquipmentsSubRow({ equipments }: { equipments: EquipmentTransferEquipmentRef[] }) {
  const { languageGB } = useLanguage();
  const text = languageGB.equipmentTransfers.equipmentTransfer.list.table;

  return (
    <Box overflowX="auto">
      <Table.Root size="sm">
        <Table.Header>
          <Table.Row>
            <Table.ColumnHeader>{text.equipments}</Table.ColumnHeader>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {equipments.map((equipment) => (
            <Table.Row key={equipment.uuid}>
              <Table.Cell>{equipment.description}</Table.Cell>
            </Table.Row>
          ))}
        </Table.Body>
      </Table.Root>
    </Box>
  );
}

export default function TransferenciasList() {
  const { languageGB } = useLanguage();
  const navigate = useNavigate();
  const { can } = usePermissions();
  const { activeFarmUuid } = useAuth();
  const text = languageGB.equipmentTransfers.equipmentTransfer;

  const canCreate = can('equipment-transfer_create');
  const canView = can('equipment-transfer_view');
  const canDelete = can('equipment-transfer_delete');

  const defaultQueryOptions = useMemo(
    () => ({ pageSize: 10, storageKey: TRANSFERENCIAS_STORAGE_KEY }),
    []
  );

  const { paginatedQuery, handlePaginatedQuery, handleFilterChange, handleResetFilter } =
    userPaginatedQuery<EquipmentTransferFilterForm>(defaultQueryOptions);

  const { open: isFilterOpen, onOpen: onOpenFilter, onClose: onCloseFilter } = useDisclosure();

  const filtersApplied = useMemo(
    () =>
      Object.values(paginatedQuery.filter ?? {}).filter(
        (v) => v !== undefined && v !== null && v !== ''
      ).length,
    [paginatedQuery.filter]
  );

  const [toCancel, setToCancel] = useState<EquipmentTransferListItem | null>(null);
  const {
    open: isOpenCancelDialog,
    onOpen: onOpenCancelDialog,
    onClose: onCloseCancelDialog,
  } = useDisclosure();

  const transfersList = useEquipmentTransfersList({
    paginatedQuery,
    setPaginatedQuery: handlePaginatedQuery,
  });

  // SE-03/CL-08 — "Cancelar", NUNCA "Excluir": vira status=3, o registro
  // CONTINUA na listagem. V3 não tem `useDeleted` — `useRequest` com
  // `typesRequest:'apply'` (mirror `get_pwa_mutation_query_pattern`
  // §"Substituição V3"). `DELETE` responde 204 — a asyncFunction não lê
  // corpo. NÃO invalida Máquinas (o cancelamento não move nada — SE-03).
  const cancelMutation = useRequest({
    asyncFunction: async ({ uuid }: { uuid: string }) => {
      await cancelEquipmentTransfer(uuid);
      return undefined;
    },
    queryKey: queryKey.equipmentTransfers.equipmentTransfers,
    queryKey2: queryKey.equipmentTransfers.equipmentTransfer,
    typesRequest: 'apply',
    entityName: text.singularLabel,
    personalizedMessage: text.cancel.successMessage,
    actionSuccess: () => {
      onCloseCancelDialog();
      setToCancel(null);
    },
  });

  const isCanceling = cancelMutation.isPending;

  function handleCancelClick(transfer: EquipmentTransferListItem) {
    setToCancel(transfer);
    onOpenCancelDialog();
  }

  function handleConfirmCancel() {
    if (toCancel) {
      cancelMutation.mutate({ uuid: toCancel.uuid });
    }
  }

  const columnHelper = createColumnHelper<EquipmentTransferListItem>();
  const defaultColumns = useMemo(
    () => [
      // LM-01 — cor e rótulo vêm da API, ZERO mapa local na célula.
      columnHelper.accessor('status', {
        header: text.list.table.status,
        cell: ({ row }) => (
          <Status text={row.original.status.label} backgroundColor={row.original.status.color} />
        ),
        meta: { ...styleColumTable.md, gridLabel: text.list.table.status },
      }),
      // LM-02
      columnHelper.accessor('code', {
        header: text.list.table.code,
        enableHiding: false,
        cell: ({ row }) => <Text fontSize="sm">{row.original.code}</Text>,
        meta: { ...styleColumTable.sm, gridLabel: text.list.table.code },
      }),
      // LM-03
      columnHelper.accessor((row) => row.user?.name ?? '', {
        id: 'user',
        header: text.list.table.responsible,
        cell: ({ row }) => <Text fontSize="sm">{row.original.user?.name ?? '—'}</Text>,
        meta: { gridLabel: text.list.table.responsible },
      }),
      // LM-04
      columnHelper.accessor('date', {
        header: text.list.table.date,
        cell: ({ row }) => (
          <Text fontSize="sm">{row.original.date ? formatDate(row.original.date) : '—'}</Text>
        ),
        meta: { ...styleColumTable.date, gridLabel: text.list.table.date },
      }),
      // LM-05
      columnHelper.accessor((row) => row.farm?.description ?? '', {
        id: 'farm',
        header: text.list.table.farmOrigin,
        cell: ({ row }) => <Text fontSize="sm">{row.original.farm?.description ?? '—'}</Text>,
        meta: { gridLabel: text.list.table.farmOrigin },
      }),
      // LM-06
      columnHelper.accessor((row) => row.farm_out?.description ?? '', {
        id: 'farm_out',
        header: text.list.table.farmDestination,
        cell: ({ row }) => <Text fontSize="sm">{row.original.farm_out?.description ?? '—'}</Text>,
        meta: { gridLabel: text.list.table.farmDestination },
      }),
      // LM-07 — três ações condicionais; a API não repete estas condições
      // (OD-002/DEB-01) — errar aqui é errar sem rede.
      columnHelper.display({
        id: 'acoes',
        header: '',
        enableHiding: false,
        cell: ({ row }) => {
          const canReceive =
            can('equipment-transfer_create') &&
            row.original.status.value === 1 &&
            !!activeFarmUuid &&
            row.original.farm_out?.uuid === activeFarmUuid;
          const canCancelRow =
            canDelete &&
            row.original.status.value === 1 &&
            !!activeFarmUuid &&
            row.original.farm?.uuid === activeFarmUuid;

          return (
            <Flex justify="flex-end">
              <Actions size="sm">
                {canView && (
                  <Actions.Item
                    icon={<Icon as={FiEye} />}
                    onClick={() => navigate(`/frota/transferencias/${row.original.uuid}/detalhe`)}
                  >
                    {text.list.actions.view}
                  </Actions.Item>
                )}
                {canReceive && (
                  <Actions.Item
                    icon={<Icon as={FiCheckCircle} />}
                    onClick={() => navigate(`/frota/transferencias/${row.original.uuid}/receber`)}
                  >
                    {text.list.actions.receive}
                  </Actions.Item>
                )}
                {canCancelRow && (
                  <>
                    <Actions.Separator />
                    <Actions.Item
                      icon={<Icon as={FiXCircle} />}
                      onClick={() => handleCancelClick(row.original)}
                      tone="danger"
                      disabled={isCanceling}
                    >
                      {text.list.actions.cancel}
                    </Actions.Item>
                  </>
                )}
              </Actions>
            </Flex>
          );
        },
        meta: {
          ...styleColumTable.sm,
          gridLabel: languageGB.defaltStrings.actions,
          gridOrder: 'fixed-end',
          gridDataColumn: false,
        },
      }),
    ],
    [navigate, isCanceling, canView, canDelete, can, activeFarmUuid, text, languageGB]
  );

  const gridSettings = useGridSettings<EquipmentTransferListItem>({
    storageKey: TRANSFERENCIAS_STORAGE_KEY,
    storageScope: useGridStorageScope(),
    columns: defaultColumns,
  });
  const { columnOrder, setColumnOrder, columnVisibility, setColumnVisibility } = gridSettings;

  const isLoading = checkLoadingStatus([transfersList]);
  const items = transfersList.data?.data?.items;
  const isEmpty = !isLoading && !transfersList.isError && (items?.length ?? 0) === 0;
  const isErrorState = !isLoading && transfersList.isError;

  return (
    <ContainerGrid>
      <TableProvider
        data={items}
        columns={defaultColumns}
        pagination={paginatedQuery}
        setPagination={handlePaginatedQuery}
        enableMultiRowSelection={false}
        getRowCanExpand={(row) => (row.original.equipments?.length ?? 0) > 0}
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
              canCreate={canCreate}
              onCreate={() => navigate('/frota/transferencias/novo')}
              gridSettings={gridSettings}
            />
          }
        >
          <Text fontSize="2xl" fontWeight="bold" color="brandColorText">
            {text.list.pageTitle}
          </Text>
          <Text fontSize="sm" color="fg.muted">
            {text.list.pageSubtitle}
          </Text>
        </HeaderGrid>

        {/* Legenda — EXATAMENTE 3 entradas (OD-004). PROIBIDO um 4º estado
            "Em Processamento"/#ff9900 — 2 significa "Finalizado". */}
        <HStack gap={4} mt={2} mb={2} flexWrap="wrap">
          <Status
            text={text.list.legend.open}
            backgroundColor={EQUIPMENT_TRANSFER_STATUS_LEGEND[0].color}
            fontSize="xs"
          />
          <Status
            text={text.list.legend.finished}
            backgroundColor={EQUIPMENT_TRANSFER_STATUS_LEGEND[1].color}
            fontSize="xs"
          />
          <Status
            text={text.list.legend.canceled}
            backgroundColor={EQUIPMENT_TRANSFER_STATUS_LEGEND[2].color}
            fontSize="xs"
          />
        </HStack>

        <Box mt={4}>
          {isErrorState ? (
            <EmptyState
              variant="error"
              message={text.list.emptyState.titleError}
              description={text.list.emptyState.descriptionError}
              onRetry={() => transfersList.refetch()}
              retryLabel={text.list.emptyState.retry}
            />
          ) : isEmpty ? (
            <EmptyState
              variant="empty"
              message={
                filtersApplied > 0
                  ? text.list.emptyState.titleFiltered
                  : text.list.emptyState.titleEmpty
              }
              description={
                filtersApplied > 0
                  ? text.list.emptyState.descriptionFiltered
                  : text.list.emptyState.descriptionEmpty
              }
            />
          ) : (
            <GridTable
              isLoading={isLoading}
              rowSubComponent={({ row }) => (
                <TransferEquipmentsSubRow equipments={row.original.equipments} />
              )}
            />
          )}
        </Box>
      </TableProvider>

      <FilterSideTransferencias
        isOpen={isFilterOpen}
        onClose={onCloseFilter}
        handleFilterChange={handleFilterChange}
        handleReset={handleResetFilter}
        filter={paginatedQuery.filter}
        languageGB={languageGB}
        filtersApplied={filtersApplied}
      />

      <DeleteConfirmDialog
        isOpen={isOpenCancelDialog}
        onClose={() => {
          onCloseCancelDialog();
          setToCancel(null);
        }}
        onConfirm={handleConfirmCancel}
        isLoading={isCanceling}
        title={text.cancel.dialogTitle}
        description={text.cancel.dialogDescription}
        warningText={text.cancel.dialogWarning}
        confirmButtonText={text.cancel.confirmLabel}
        itemName={toCancel?.code}
        tone="danger"
      />
    </ContainerGrid>
  );
}
