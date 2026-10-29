// src/pages/Operacional/LoteFazenda/TransferBatchFarms/index.tsx
// -----------------------------------------------------------------------------
// Tela de LISTAGEM (grid) de Transferência de Lote entre Fazendas
// (TransferBatchFarm — Operacional > Pecuária > Transferências,
// 97-Esteiras/041, TASK-FE-041-LF-01). Rota
// `/operacional/lote-fazenda/transferencias`, guardada por
// `<RequirePermission permission="transfer_batch_farms_view">`.
//
// Mirror ESTRUTURAL de `Operacional/TransferAbcBatch/index.tsx` (grid SEM
// `FilterSide` — `TransferBatchFarmIndexRequest::rules()` só aceita
// `status`/`per_page`, nenhum campo de filtro real a expor — mirror do
// achado já documentado para o irmão `transfer_abc_batches`).
//
// ⚠️ NÃO confundir com `src/pages/Operacional/BatchTransfers/**` —
// domínio DIFERENTE (transferência de lote INTRA-fazenda), ver
// `plano-front-lote-fazenda.md §1.1. Nenhum arquivo daquela feature foi
// lido ou copiado para esta.
//
// Ações de linha (ACT-09, dropdown condicional): Cancelar (ACT-10, só
// `status=Em Aberto` E fazenda ativa = origem), Gerar Financeiro (ACT-11,
// só fazenda ativa = origem E `!has_financial`), Processar (ACT-12, só
// `status=Em Aberto` E fazenda ativa = destino). Sem "Editar" — a API nunca
// teve `update()` (R-02/edit `NAO_APLICAVEL`, FID-G1).
// -----------------------------------------------------------------------------

import { ElementType, useMemo, useState } from 'react';

import { Box, Flex, Icon, Text, useDisclosure, VStack } from '@chakra-ui/react';
import { createColumnHelper } from '@tanstack/react-table';
import { FiCheckCircle, FiDownload, FiRepeat, FiUpload } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';

import { Actions } from '@/components/Action';
import { Button } from '@/components/Button';
import { ButtonAdd } from '@/components/ButtonAdd';
import { ContainerGrid } from '@/components/ContainerGrid';
import { GridSettingsFloatingPanel } from '@/components/GridSettings/GridSettingsFloatingPanel';
import { HeaderGrid } from '@/components/HeaderGrid';
import { ModalAction } from '@/components/ModalAction';
import { Table } from '@/components/Table';
import { toaster } from '@/components/ui/toaster';
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
import { downloadBlob } from '@/utils/downloadBlob';
import formatDate from '@/utils/formatDate';
import { styleColumTable } from '@/utils/style-colum-table';

import {
  transferBatchFarmStatus,
  transferBatchFarmStatusColor,
} from '@/constants/loteFazenda/transferBatchFarm/transfer-batch-farm-status';
import { queryKey } from '@/constants/query-key';

import {
  cancelTransferBatchFarm,
  downloadTransferBatchFarmTemplate,
  listTransferBatchFarms,
  receiveTransferBatchFarm,
} from '@/services/v2/LoteFazenda/transferBatchFarm-service';
import type { ListTransferBatchFarmsParams } from '@/services/v2/LoteFazenda/transferBatchFarm-service';

import type { TransferBatchFarmListItem } from '@/@types/v2/LoteFazenda/transferBatchFarm';

import { ImportTransferBatchFarmModal } from './ImportTransferBatchFarmModal';

const TRANSFER_BATCH_FARM_STORAGE_KEY =
  'OperacionalLoteFazenda' + queryKey.loteFazenda.transferBatchFarms;

export default function TransferBatchFarmList() {
  const { languageGB } = useLanguage();
  const navigate = useNavigate();
  const { can } = usePermissions();
  const text = languageGB.loteFazenda.transferBatchFarm;
  const { data: currentFarm } = useCurrentFarm();

  const canCreate = can('transfer_batch_farms_create');
  const canDelete = can('transfer_batch_farms_delete');

  const defaultQueryOptions = useMemo(
    () => ({ pageSize: 10, storageKey: TRANSFER_BATCH_FARM_STORAGE_KEY }),
    []
  );

  const { paginatedQuery, handlePaginatedQuery } =
    userPaginatedQuery<Record<string, never>>(defaultQueryOptions);

  const transferBatchFarmsList = useCustomGridQuery<
    TransferBatchFarmListItem,
    ListTransferBatchFarmsParams
  >({
    asyncFunction: listTransferBatchFarms,
    queryKey: queryKey.loteFazenda.transferBatchFarms,
    paginatedQuery,
    setPaginatedQuery: handlePaginatedQuery,
    filterQuery: [],
    filter: {},
  });

  // ---- Cancelar (ACT-10, ModalAction Pattern 6) ------------------------------
  const [toCancel, setToCancel] = useState<TransferBatchFarmListItem | null>(null);
  const {
    open: isOpenCancelDialog,
    onOpen: onOpenCancelDialog,
    onClose: onCloseCancelDialog,
  } = useDisclosure();

  const cancelMutation = useRequest({
    asyncFunction: async ({ uuid }: { uuid: string }) => {
      await cancelTransferBatchFarm(uuid);
      return undefined;
    },
    queryKey: queryKey.loteFazenda.transferBatchFarms,
    typesRequest: 'apply',
    entityName: text.singularLabel,
    personalizedMessage: text.list.canceledToast,
    actionSuccess: () => {
      onCloseCancelDialog();
      setToCancel(null);
    },
  });

  function handleCancelClick(item: TransferBatchFarmListItem) {
    setToCancel(item);
    onOpenCancelDialog();
  }

  // ---- Processar → Processing (ACT-12, receive) ------------------------------
  const [toReceive, setToReceive] = useState<TransferBatchFarmListItem | null>(null);
  const {
    open: isOpenReceiveDialog,
    onOpen: onOpenReceiveDialog,
    onClose: onCloseReceiveDialog,
  } = useDisclosure();

  const receiveMutation = useRequest({
    asyncFunction: async ({ uuid }: { uuid: string }) => receiveTransferBatchFarm(uuid),
    queryKey: queryKey.loteFazenda.transferBatchFarms,
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

  function handleReceiveClick(item: TransferBatchFarmListItem) {
    setToReceive(item);
    onOpenReceiveDialog();
  }

  // ---- Importar (ACT-02) + Download modelo (ACT-04, atalho fora do modal) ---
  const {
    open: isOpenImportModal,
    onOpen: onOpenImportModal,
    onClose: onCloseImportModal,
  } = useDisclosure();
  const [isDownloadingTemplate, setIsDownloadingTemplate] = useState(false);

  async function handleDownloadTemplate() {
    setIsDownloadingTemplate(true);
    try {
      const blob = await downloadTransferBatchFarmTemplate();
      downloadBlob(blob, 'modelo-transferencia-lote-fazenda.xlsx');
    } catch {
      toaster.error({ title: text.singularLabel, description: text.import.downloadTemplateError });
    } finally {
      setIsDownloadingTemplate(false);
    }
  }

  const columnHelper = createColumnHelper<TransferBatchFarmListItem>();
  const defaultColumns = useMemo(
    () => [
      columnHelper.accessor('status', {
        header: languageGB.defaltStrings.statusColumn,
        cell: ({ row }) => {
          const status = row.original.status;
          const statusText = languageGB.loteFazenda.transferBatchFarm.status;
          const labelByStatus: Record<number, string> = {
            [transferBatchFarmStatus.pending]: statusText.pending,
            [transferBatchFarmStatus.processing]: statusText.processing,
            [transferBatchFarmStatus.finished]: statusText.finished,
            [transferBatchFarmStatus.canceled]: statusText.canceled,
          };
          return (
            <StatusTag label={labelByStatus[status] ?? '—'} color={transferBatchFarmStatusColor[status]} />
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
      columnHelper.accessor((row) => row.batch?.description ?? '', {
        id: 'batch',
        header: text.list.columns.batch,
        cell: ({ row }) => <Text fontSize="sm">{row.original.batch?.description ?? '—'}</Text>,
        meta: { gridLabel: text.list.columns.batch },
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
            canDelete && item.status === transferBatchFarmStatus.pending && isOriginFarm;
          const canGenerateFinancial = canCreate && isOriginFarm && !item.has_financial;
          const canProcessRow =
            canCreate && item.status === transferBatchFarmStatus.pending && isDestinationFarm;

          if (!canCancelRow && !canGenerateFinancial && !canProcessRow) return null;

          return (
            <Flex justify="flex-end">
              <Actions size="sm">
                {canGenerateFinancial && (
                  <Actions.Item
                    onClick={() =>
                      navigate(`/operacional/lote-fazenda/transferencias/${item.uuid}/financeiro`)
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

  const gridSettings = useGridSettings<TransferBatchFarmListItem>({
    storageKey: TRANSFER_BATCH_FARM_STORAGE_KEY,
    storageScope: useGridStorageScope(),
    columns: defaultColumns,
  });
  const { columnOrder, setColumnOrder, columnVisibility, setColumnVisibility } = gridSettings;

  const isLoading = checkLoadingStatus([transferBatchFarmsList]);
  const items = transferBatchFarmsList.data?.data?.items;
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
                <Button
                  title={text.import.downloadShortcut}
                  variant="outline"
                  icon={FiDownload as ElementType}
                  onClick={handleDownloadTemplate}
                  loading={isDownloadingTemplate}
                  disabled={isDownloadingTemplate}
                />
              )}
              {canCreate && (
                <Button
                  title={text.importButton}
                  variant="outline"
                  icon={FiUpload as ElementType}
                  onClick={onOpenImportModal}
                />
              )}
              {canCreate && (
                <ButtonAdd
                  onClick={() => navigate('/operacional/lote-fazenda/transferencias/novo')}
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
            isError={transferBatchFarmsList.isError}
            error={transferBatchFarmsList.error}
            isEmpty={isEmpty}
            onRetry={() => transferBatchFarmsList.refetch()}
            isRetrying={transferBatchFarmsList.isFetching}
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

      <ImportTransferBatchFarmModal isOpen={isOpenImportModal} onClose={onCloseImportModal} />
    </ContainerGrid>
  );
}
