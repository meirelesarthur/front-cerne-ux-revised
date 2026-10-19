// src/pages/Administrativo/Devolucao/index.tsx
// -----------------------------------------------------------------------------
// Tela de LISTAGEM (grid) de Devolução/Entrada (Devolution — Estoque,
// 97-Esteiras/037, Tarefas 05/07). Rota `/administrativo/devolucao` —
// guardada por `<RequirePermission permission="devolution_view">`
// (permissões SINGULAR — `devolution_*`, diferente do plural `requisitions_*`
// do mirror). Item de menu (`adm-est-dev`) e permissão de navegação JÁ
// EXISTEM.
//
// Mirror estrutural DIRETO de `Requisition/index.tsx`. Colunas mirror
// `DevolutionListResource`: código, produto, quantidade+unidade, armazém,
// centro de custo, usuário, status, **Data** (`date`) E **Data de Emissão**
// (`created_at`) — as DUAS colunas (divergência #d do roteiro, diferente do
// mirror que só tem `created_at`).
//
// Ações de linha: "Ver/Editar" (navega para `/administrativo/devolucao/:uuid`
// — tela única mescla ver+editar, `FID-11`) + "Excluir" + as 3 ações de
// assinatura (mirror `Requisition` Tarefa 06), TODAS gateadas por
// `devolution_view`/`devolution_delete` (singular) e por `status.value`
// NUMÉRICO.
//
// Botão "Importar planilha" (Tarefa 07, mirror `CorrecaoEstoque/HeaderTable`)
// no header da grid, gate `devolution_create` — abre `DevolucaoImportModal`.
// -----------------------------------------------------------------------------

import { ElementType, useMemo, useState } from 'react';

import { Box, Flex, Icon, Text, useDisclosure, VStack } from '@chakra-ui/react';
import { createColumnHelper } from '@tanstack/react-table';
import { FiClipboard, FiDownload, FiEye, FiFileText, FiTrash2, FiUpload } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';

import { Actions } from '@/components/Action';
import { Button } from '@/components/Button';
import { ButtonAdd } from '@/components/ButtonAdd';
import { ButtonFilter } from '@/components/ButtonFilter';
import { ContainerGrid } from '@/components/ContainerGrid';
import { DeleteConfirmDialog } from '@/components/DeleteConfirmDialog';
import { GridSettingsFloatingPanel } from '@/components/GridSettings/GridSettingsFloatingPanel';
import { HeaderGrid } from '@/components/HeaderGrid';
import { Table } from '@/components/Table';
import { toaster } from '@/components/ui/toaster';

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
  deleteDevolution,
  getDevolutionDocument,
  getSignedDevolutionDocument,
  listDevolutions,
} from '@/services/v2/Devolutions/devolution-service';
import type { ListDevolutionsParams } from '@/services/v2/Devolutions/devolution-service';

import type { DevolutionFilterForm, DevolutionListItem } from '@/@types/v2/Devolutions';

import { DevolucaoImportDocumentModal } from './DevolucaoImportDocumentModal';
import { DevolucaoImportModal } from './DevolucaoImportModal';
import { FilterSideDevolucao } from './FilterSideDevolucao';

// Mirror `App\Enums\StockMovementStatus` (backend, backed `int`) — `value`
// NUMÉRICO estável, nunca a `label` traduzida.
const DEVOLUTION_STATUS_PENDING = 1;
const DEVOLUTION_STATUS_SIGNED = 2;

// Chave de storage desta tela — NÃO colide com outras chaves de Estoque.
const DEVOLUTION_STORAGE_KEY = 'AdministrativoDevolucao' + queryKey.devolutions.devolutions;

// Achatamento `DevolutionFilterForm` (Option-based) →
// `ListDevolutionsParams` (querystring real de `GET /devolutions`) —
// mirror `RequisitionList::toRequestFilter`.
function toRequestFilter(filter?: DevolutionFilterForm | null): ListDevolutionsParams {
  return {
    product_uuid: filter?.product_uuid?.value || undefined,
    warehouse_uuid: filter?.warehouse_uuid?.value || undefined,
    cost_center_uuid: filter?.cost_center_uuid?.value || undefined,
    date_from: filter?.date_from || undefined,
    date_to: filter?.date_to || undefined,
  };
}

function formatQuantity(value: number | string): string {
  const numeric = Number(value) || 0;
  return numeric.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function DevolucaoList() {
  const { languageGB } = useLanguage();
  const navigate = useNavigate();
  const { can } = usePermissions();
  const text = languageGB.devolutions.devolution;

  const canCreate = can('devolution_create');
  const canView = can('devolution_view');
  const canDelete = can('devolution_delete');

  const defaultQueryOptions = useMemo(
    () => ({
      pageSize: 10,
      storageKey: DEVOLUTION_STORAGE_KEY,
    }),
    []
  );

  const { paginatedQuery, handlePaginatedQuery, handleFilterChange, handleResetFilter } =
    userPaginatedQuery<DevolutionFilterForm>(defaultQueryOptions);

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

  const devolutionsList = useCustomGridQuery<DevolutionListItem, ListDevolutionsParams>({
    asyncFunction: listDevolutions,
    queryKey: queryKey.devolutions.devolutions,
    paginatedQuery,
    setPaginatedQuery: handlePaginatedQuery,
    filterQuery: [],
    filter: requestFilter,
  });

  // ---- Estado de exclusão ---------------------------------------------------
  const [toDelete, setToDelete] = useState<DevolutionListItem | null>(null);
  const {
    open: isOpenDeleteDialog,
    onOpen: onOpenDeleteDialog,
    onClose: onCloseDeleteDialog,
  } = useDisclosure();

  const deleteMutation = useRequest({
    asyncFunction: async ({ devolutionUuid }: { devolutionUuid: string }) => {
      await deleteDevolution(devolutionUuid);
      return undefined;
    },
    queryKey: queryKey.devolutions.devolutions,
    typesRequest: 'apply',
    entityName: text.singularLabel,
    personalizedMessage: text.list.deletedToast,
    actionSuccess: () => {
      onCloseDeleteDialog();
      setToDelete(null);
    },
  });

  const handleDeleteClick = (devolution: DevolutionListItem) => {
    setToDelete(devolution);
    onOpenDeleteDialog();
  };

  const handleConfirmDelete = () => {
    if (toDelete) {
      deleteMutation.mutate({ devolutionUuid: toDelete.uuid });
    }
  };

  const isDeleting = deleteMutation.isPending;

  // ---- Documento para Assinatura / Documento Assinado ----------------------
  const [openingDocumentUuid, setOpeningDocumentUuid] = useState<string | null>(null);

  async function handleOpenBlobInNewTab(blob: Blob) {
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
    setTimeout(() => URL.revokeObjectURL(url), 10_000);
  }

  async function handleGenerateDocument(devolution: DevolutionListItem) {
    setOpeningDocumentUuid(devolution.uuid);
    try {
      const blob = await getDevolutionDocument(devolution.uuid);
      await handleOpenBlobInNewTab(blob);
    } catch {
      toaster.error({ title: text.singularLabel, description: text.list.documentErrorToast });
    } finally {
      setOpeningDocumentUuid(null);
    }
  }

  async function handleViewSignedDocument(devolution: DevolutionListItem) {
    setOpeningDocumentUuid(devolution.uuid);
    try {
      const blob = await getSignedDevolutionDocument(devolution.uuid);
      await handleOpenBlobInNewTab(blob);
    } catch {
      toaster.error({ title: text.singularLabel, description: text.list.documentErrorToast });
    } finally {
      setOpeningDocumentUuid(null);
    }
  }

  // ---- Importar Documento Assinado (modal single-step) --------------------
  const [importDocumentUuid, setImportDocumentUuid] = useState<string | null>(null);
  const {
    open: isImportDocumentOpen,
    onOpen: onOpenImportDocument,
    onClose: onCloseImportDocument,
  } = useDisclosure();

  function handleImportDocumentClick(devolution: DevolutionListItem) {
    setImportDocumentUuid(devolution.uuid);
    onOpenImportDocument();
  }

  // ---- Importar Planilha XLSX (Tarefa 07) ----------------------------------
  const {
    open: isImportModalOpen,
    onOpen: onOpenImportModal,
    onClose: onCloseImportModal,
  } = useDisclosure();

  const columnHelper = createColumnHelper<DevolutionListItem>();
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
      columnHelper.accessor((row) => row.product?.description ?? '', {
        id: 'product',
        header: text.list.columns.product,
        enableHiding: false, // coluna-âncora — nunca ocultável
        cell: ({ row }) => (
          <Text fontWeight="medium" lineClamp="1">
            {row.original.product?.description ?? '—'}
          </Text>
        ),
        meta: { gridLabel: text.list.columns.product },
      }),
      columnHelper.accessor('quantity', {
        header: text.list.columns.quantity,
        cell: ({ row }) => (
          <Text fontSize="sm" textAlign="right" fontVariantNumeric="tabular-nums">
            {formatQuantity(row.original.quantity)}
            {row.original.unit ? ` ${row.original.unit}` : ''}
          </Text>
        ),
        meta: { ...styleColumTable.sm, gridLabel: text.list.columns.quantity },
      }),
      columnHelper.accessor((row) => row.warehouse?.description ?? '', {
        id: 'warehouse',
        header: text.list.columns.warehouse,
        cell: ({ row }) => <Text fontSize="sm">{row.original.warehouse?.description ?? '—'}</Text>,
        meta: { gridLabel: text.list.columns.warehouse },
      }),
      columnHelper.accessor((row) => row.cost_center?.description ?? '', {
        id: 'costCenter',
        header: text.list.columns.costCenter,
        cell: ({ row }) => (
          <Text fontSize="sm">{row.original.cost_center?.description ?? '—'}</Text>
        ),
        meta: { gridLabel: text.list.columns.costCenter },
      }),
      columnHelper.accessor((row) => row.user?.name ?? '', {
        id: 'user',
        header: text.list.columns.user,
        cell: ({ row }) => <Text fontSize="sm">{row.original.user?.name ?? '—'}</Text>,
        meta: { gridLabel: text.list.columns.user },
      }),
      columnHelper.accessor((row) => row.status?.label ?? '', {
        id: 'status',
        header: text.list.columns.status,
        cell: ({ row }) => <Text fontSize="sm">{row.original.status?.label ?? '—'}</Text>,
        meta: { gridLabel: text.list.columns.status },
      }),
      // `date` — divergência #d do roteiro: coluna ADICIONAL, não substitui `createdAt`.
      columnHelper.accessor('date', {
        header: text.list.columns.date,
        cell: ({ row }) => (
          <Text fontSize="sm">
            {row.original.date ? formatDate(row.original.date, 'dd/MM/yyyy') : '—'}
          </Text>
        ),
        meta: { ...styleColumTable.date, gridLabel: text.list.columns.date },
      }),
      columnHelper.accessor('created_at', {
        header: text.list.columns.createdAt,
        cell: ({ row }) => (
          <Text fontSize="sm" color="fg.muted">
            {row.original.created_at ? formatDate(row.original.created_at, 'dd/MM/yyyy') : '—'}
          </Text>
        ),
        meta: { ...styleColumTable.date, gridLabel: text.list.columns.createdAt },
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
                  onClick={() => navigate(`/administrativo/devolucao/${row.original.uuid}`)}
                >
                  {text.list.actions.view}
                </Actions.Item>
              )}
              {canView && row.original.status?.value === DEVOLUTION_STATUS_PENDING && (
                <Actions.Item
                  icon={<Icon as={FiFileText} />}
                  onClick={() => handleGenerateDocument(row.original)}
                  disabled={openingDocumentUuid === row.original.uuid}
                >
                  {text.list.actions.generateDocument}
                </Actions.Item>
              )}
              {canView && row.original.status?.value === DEVOLUTION_STATUS_PENDING && (
                <Actions.Item
                  icon={<Icon as={FiUpload} />}
                  onClick={() => handleImportDocumentClick(row.original)}
                >
                  {text.list.actions.importDocument}
                </Actions.Item>
              )}
              {canView && row.original.status?.value === DEVOLUTION_STATUS_SIGNED && (
                <Actions.Item
                  icon={<Icon as={FiDownload} />}
                  onClick={() => handleViewSignedDocument(row.original)}
                  disabled={openingDocumentUuid === row.original.uuid}
                >
                  {text.list.actions.viewSignedDocument}
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
    [
      navigate,
      isDeleting,
      text,
      canView,
      canDelete,
      languageGB.defaltStrings.actions,
      openingDocumentUuid,
    ]
  );

  const gridSettings = useGridSettings<DevolutionListItem>({
    storageKey: DEVOLUTION_STORAGE_KEY,
    storageScope: useGridStorageScope(),
    columns: defaultColumns,
  });
  const { columnOrder, setColumnOrder, columnVisibility, setColumnVisibility } = gridSettings;

  const isLoading = checkLoadingStatus([devolutionsList]);
  const items = devolutionsList.data?.data?.items;
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
                  onClick={() => navigate('/administrativo/devolucao/novo')}
                  languageGB={languageGB}
                />
              )}
              {canCreate && (
                <Button
                  title={text.importModal.menuButtonLabel}
                  variant="outline"
                  icon={FiUpload as ElementType}
                  onClick={onOpenImportModal}
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
            isError={devolutionsList.isError}
            error={devolutionsList.error}
            isEmpty={isEmpty}
            onRetry={() => devolutionsList.refetch()}
            isRetrying={devolutionsList.isFetching}
            emptyIcon={FiClipboard as ElementType}
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
            onCreate={() => navigate('/administrativo/devolucao/novo')}
          />
        </Box>
      </TableProvider>

      <FilterSideDevolucao
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

      <DevolucaoImportDocumentModal
        isOpen={isImportDocumentOpen}
        onClose={() => {
          onCloseImportDocument();
          setImportDocumentUuid(null);
        }}
        devolutionUuid={importDocumentUuid}
      />

      <DevolucaoImportModal isOpen={isImportModalOpen} onClose={onCloseImportModal} />
    </ContainerGrid>
  );
}
