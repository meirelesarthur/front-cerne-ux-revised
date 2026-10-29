// src/pages/Operacional/AnimalFazenda/TransferAnimalFarm/index.tsx
// -----------------------------------------------------------------------------
// Tela de LISTAGEM (grid) de Transferência de Animal entre Fazendas
// (TransferAnimalFarm — Operacional > Pecuária > Transferências,
// 97-Esteiras/042, TASK-FE-042-103). Rota
// `/operacional/animal-fazenda/transferencias`, guardada por
// `<RequirePermission permission="transfer_animal_farms_view">`.
//
// Mirror ESTRUTURAL de `Operacional/LoteFazenda/TransferBatchFarms/index.tsx`
// (grid SEM `FilterSide` — `TransferAnimalFarmIndexRequest::rules()` só
// aceita `status`/`per_page`, fiel ao legado, FILTER-001 `NAO_APLICAVEL`),
// SEM os botões de Download/Importar (fora de escopo — esta feature não tem
// planilha no legado, §3.6 do contrato-frontend) e SEM a coluna `batch`
// (Animal/Fazenda não tem lote de origem único — transfere uma seleção de
// animais).
//
// Ações de linha (dropdown condicional): Visualizar (sempre disponível),
// Gerar Financeiro (`canCreate && isOriginFarm && !has_financial`), Processar
// (`canCreate && status===pending && isDestinationFarm`), Cancelar
// (`canDelete && status===pending && isOriginFarm` — ◈ §7.2 do
// contrato-frontend: condição de EXIBIÇÃO do legado, o servidor aceita
// cancelar em QUALQUER status, DIV-011/decisão do dono, mas a UI só OFERECE
// o botão nesta condição, mirror exato da irmã).
// -----------------------------------------------------------------------------

import { useMemo, useState } from 'react';

import { Box, Flex, Icon, Text, useDisclosure, VStack } from '@chakra-ui/react';
import { createColumnHelper } from '@tanstack/react-table';
import { FiCheckCircle, FiRepeat, FiUpload } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';

import type { ElementType } from 'react';

import { Actions } from '@/components/Action';
import { ButtonAdd } from '@/components/ButtonAdd';
import { ContainerGrid } from '@/components/ContainerGrid';
import { GridSettingsFloatingPanel } from '@/components/GridSettings/GridSettingsFloatingPanel';
import { HeaderGrid } from '@/components/HeaderGrid';
import { ModalAction } from '@/components/ModalAction';
import { Table } from '@/components/Table';
import { StatusTag } from '@/components/ui/StatusTag';

import { TableProvider } from '@/contexts/TableContext';

import { useCurrentFarm } from '@/hooks/useCurrentFarm';
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

import {
  transferAnimalFarmStatus,
  transferAnimalFarmStatusColor,
} from '@/constants/animalFazenda/transferAnimalFarm/transfer-animal-farm-status';
import { queryKey } from '@/constants/query-key';

import {
  cancelTransferAnimalFarm,
  listTransferAnimalFarms,
  receiveTransferAnimalFarm,
} from '@/services/v2/Operacional/AnimalFazenda/transferAnimalFarm-service';
import type { ListTransferAnimalFarmsParams } from '@/services/v2/Operacional/AnimalFazenda/transferAnimalFarm-service';

import type { TransferAnimalFarmListItem } from '@/@types/v2/Operacional/AnimalFazenda/transferAnimalFarm';

const TRANSFER_ANIMAL_FARM_STORAGE_KEY =
  'OperacionalAnimalFazenda' + queryKey.animalFazenda.transferAnimalFarms;

export default function TransferAnimalFarmList() {
  const { languageGB } = useLanguage();
  const navigate = useNavigate();
  const { can } = usePermissions();
  const text = languageGB.animalFazenda.transferAnimalFarm;
  const { data: currentFarm } = useCurrentFarm();

  const canCreate = can('transfer_animal_farms_create');
  const canDelete = can('transfer_animal_farms_delete');

  const defaultQueryOptions = useMemo(
    () => ({ pageSize: 10, storageKey: TRANSFER_ANIMAL_FARM_STORAGE_KEY }),
    []
  );

  const { paginatedQuery, handlePaginatedQuery } =
    userPaginatedQuery<Record<string, never>>(defaultQueryOptions);

  const transferAnimalFarmsList = useCustomGridQuery<
    TransferAnimalFarmListItem,
    ListTransferAnimalFarmsParams
  >({
    asyncFunction: listTransferAnimalFarms,
    queryKey: queryKey.animalFazenda.transferAnimalFarms,
    paginatedQuery,
    setPaginatedQuery: handlePaginatedQuery,
    filterQuery: [],
    filter: {},
  });

  // ---- Cancelar (ModalAction Pattern 6, ◈ §7.2 do contrato-frontend) --------
  const [toCancel, setToCancel] = useState<TransferAnimalFarmListItem | null>(null);
  const {
    open: isOpenCancelDialog,
    onOpen: onOpenCancelDialog,
    onClose: onCloseCancelDialog,
  } = useDisclosure();

  const cancelMutation = useRequest({
    asyncFunction: async ({ uuid }: { uuid: string }) => {
      await cancelTransferAnimalFarm(uuid);
      return undefined;
    },
    queryKey: queryKey.animalFazenda.transferAnimalFarms,
    typesRequest: 'apply',
    entityName: text.singularLabel,
    personalizedMessage: text.list.canceledToast,
    actionSuccess: () => {
      onCloseCancelDialog();
      setToCancel(null);
    },
  });

  function handleCancelClick(item: TransferAnimalFarmListItem) {
    setToCancel(item);
    onOpenCancelDialog();
  }

  // ---- Processar → Processing (receive) --------------------------------------
  const [toReceive, setToReceive] = useState<TransferAnimalFarmListItem | null>(null);
  const {
    open: isOpenReceiveDialog,
    onOpen: onOpenReceiveDialog,
    onClose: onCloseReceiveDialog,
  } = useDisclosure();

  const receiveMutation = useRequest({
    asyncFunction: async ({ uuid }: { uuid: string }) => receiveTransferAnimalFarm(uuid),
    queryKey: queryKey.animalFazenda.transferAnimalFarms,
    typesRequest: 'apply',
    entityName: text.singularLabel,
    personalizedMessage: text.list.receivedToast,
    actionSuccess: (data: { uuid?: string } | undefined) => {
      onCloseReceiveDialog();
      setToReceive(null);
      if (data?.uuid) {
        navigate(`/operacional/processamentos/${data.uuid}`);
      }
    },
  });

  function handleReceiveClick(item: TransferAnimalFarmListItem) {
    setToReceive(item);
    onOpenReceiveDialog();
  }

  const columnHelper = createColumnHelper<TransferAnimalFarmListItem>();
  const defaultColumns = useMemo(
    () => [
      columnHelper.accessor('status', {
        header: languageGB.defaltStrings.statusColumn,
        cell: ({ row }) => {
          const status = row.original.status;
          const statusText = languageGB.animalFazenda.transferAnimalFarm.status;
          const labelByStatus: Record<number, string> = {
            [transferAnimalFarmStatus.pending]: statusText.pending,
            [transferAnimalFarmStatus.processing]: statusText.processing,
            [transferAnimalFarmStatus.finished]: statusText.finished,
            [transferAnimalFarmStatus.canceled]: statusText.canceled,
          };
          return (
            <StatusTag label={labelByStatus[status] ?? '—'} color={transferAnimalFarmStatusColor[status]} />
          );
        },
        meta: { ...styleColumTable.md, gridLabel: languageGB.defaltStrings.statusColumn },
      }),
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
      columnHelper.accessor((row) => row.employee?.name ?? '', {
        id: 'employee',
        header: text.list.columns.employee,
        cell: ({ row }) => <Text fontSize="sm">{row.original.employee?.name ?? '—'}</Text>,
        meta: { gridLabel: text.list.columns.employee },
      }),
      columnHelper.accessor((row) => row.farm_from?.description ?? '', {
        id: 'farmFrom',
        header: text.list.columns.farmFrom,
        cell: ({ row }) => <Text fontSize="sm">{row.original.farm_from?.description ?? '—'}</Text>,
        meta: { gridLabel: text.list.columns.farmFrom },
      }),
      columnHelper.accessor((row) => row.farm_to?.description ?? '', {
        id: 'farmTo',
        header: text.list.columns.farmTo,
        cell: ({ row }) => <Text fontSize="sm">{row.original.farm_to?.description ?? '—'}</Text>,
        meta: { gridLabel: text.list.columns.farmTo },
      }),
      columnHelper.accessor('has_financial', {
        header: text.list.columns.financial,
        cell: ({ row }) => (
          <Icon
            as={row.original.has_financial ? FiCheckCircle : FiUpload}
            color={row.original.has_financial ? 'green.500' : 'red.500'}
            boxSize={4}
          />
        ),
        meta: { ...styleColumTable.sm, gridLabel: text.list.columns.financial },
      }),
      columnHelper.display({
        id: 'acoes',
        header: '',
        enableHiding: false,
        cell: ({ row }) => {
          const item = row.original;
          const isOriginFarm = item.farm_from?.uuid === currentFarm?.uuid;
          const isDestinationFarm = item.farm_to?.uuid === currentFarm?.uuid;
          const canCancelRow =
            canDelete && item.status === transferAnimalFarmStatus.pending && isOriginFarm;
          const canGenerateFinancial = canCreate && isOriginFarm && !item.has_financial;
          const canProcessRow =
            canCreate && item.status === transferAnimalFarmStatus.pending && isDestinationFarm;

          return (
            <Flex justify="flex-end">
              <Actions size="sm">
                <Actions.Item
                  onClick={() =>
                    navigate(`/operacional/animal-fazenda/transferencias/${item.uuid}`)
                  }
                >
                  {text.list.actions.view}
                </Actions.Item>
                {canGenerateFinancial && (
                  <Actions.Item
                    onClick={() =>
                      navigate(`/operacional/animal-fazenda/transferencias/${item.uuid}/financeiro`)
                    }
                  >
                    {text.list.actions.generateFinancial}
                  </Actions.Item>
                )}
                {canProcessRow && (
                  <Actions.Item onClick={() => handleReceiveClick(item)}>
                    {text.list.actions.process}
                  </Actions.Item>
                )}
                {canCancelRow && (
                  <Actions.Item onClick={() => handleCancelClick(item)} tone="danger">
                    {text.list.actions.cancel}
                  </Actions.Item>
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
    [navigate, text, languageGB, canCreate, canDelete, currentFarm?.uuid]
  );

  const gridSettings = useGridSettings<TransferAnimalFarmListItem>({
    storageKey: TRANSFER_ANIMAL_FARM_STORAGE_KEY,
    storageScope: useGridStorageScope(),
    columns: defaultColumns,
  });
  const { columnOrder, setColumnOrder, columnVisibility, setColumnVisibility } = gridSettings;

  const isLoading = checkLoadingStatus([transferAnimalFarmsList]);
  const items = transferAnimalFarmsList.data?.data?.items;
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
                  onClick={() => navigate('/operacional/animal-fazenda/transferencias/novo')}
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
            isError={transferAnimalFarmsList.isError}
            error={transferAnimalFarmsList.error}
            isEmpty={isEmpty}
            onRetry={() => transferAnimalFarmsList.refetch()}
            isRetrying={transferAnimalFarmsList.isFetching}
            emptyIcon={FiRepeat as ElementType}
            emptyTitle={text.list.emptyState.titleEmpty}
            emptyDescription={text.list.emptyState.descriptionEmpty}
            canCreate={false}
          />
        </Box>
      </TableProvider>

      <ModalAction
        isOpen={isOpenCancelDialog}
        onClose={onCloseCancelDialog}
        clearData={() => setToCancel(null)}
        asyncFunction={() => toCancel && cancelMutation.mutate({ uuid: toCancel.uuid })}
        languageGB={languageGB}
        header={text.list.cancelConfirmTitle}
        body={text.list.cancelConfirmMessage}
      />

      <ModalAction
        isOpen={isOpenReceiveDialog}
        onClose={onCloseReceiveDialog}
        clearData={() => setToReceive(null)}
        asyncFunction={() => toReceive && receiveMutation.mutate({ uuid: toReceive.uuid })}
        languageGB={languageGB}
        header={text.list.receiveConfirmTitle}
        body={text.list.receiveConfirmMessage}
      />
    </ContainerGrid>
  );
}
