// src/pages/Administrativo/Requisition/index.tsx
// -----------------------------------------------------------------------------
// Tela de LISTAGEM (grid) de Requisição/Saída (Requisition — Estoque,
// 97-Esteiras/002, Tarefa 04). Rota `/administrativo/requisicao` — guardada
// por `<RequirePermission permission="requisitions_view">`. Item de menu
// (`adm-est-req`) e permissão de navegação JÁ EXISTIAM
// (`navigationTree.ts:468`) — esta Tarefa só conecta a rota real (hoje cai
// no `RoutePlaceholder`).
//
// Mirror estrutural DIRETO de `FarmTransfer/index.tsx`/
// `WarehouseTransfer/index.tsx` (mesmo domínio `StockMovement`). Colunas
// mirror `RequisitionListResource` (`LST-01..10`): código, produto,
// quantidade+unidade, armazém, centro de custo, usuário, status, data de
// emissão.
//
// Ações de linha "Ver"/"Excluir" (sem "Editar", `RT-06 NAO_APLICAVEL`, sem
// modo editar; ação "ver" abre `RequisitionDetalhe.tsx`,
// `GAP-REQUISICAO-FE-02`) + as 3 ações de assinatura da Tarefa 06
// (`GAP-REQUISICAO-FE-03`, Ponto C, arquitetura aprovada) — SEMPRE gateadas
// por `status.value` (numérico, NUNCA pela `label` traduzida):
//   - "Documento para Assinatura" (`status.value === REQUISITION_STATUS_PENDING`):
//     gera o PDF de MODELO (`getRequisitionDocument`, SEMPRE regenerado,
//     nunca o arquivo assinado real) e abre em nova aba (visualizar/assinar
//     fisicamente, não é para baixar) — sem modal.
//   - "Importar Documento Assinado" (`status.value === REQUISITION_STATUS_PENDING`):
//     abre `RequisitionImportDocumentModal` (single-step).
//   - "Documento Assinado" (`status.value === REQUISITION_STATUS_SIGNED`):
//     abre o arquivo REAL assinado (`getSignedRequisitionDocument`,
//     extensão aditiva `GAP-REQUISICAO-FE-03` Ponto B) em nova aba.
//
// `status` já vem `{ value, label }` (extensão aditiva
// `GAP-REQUISICAO-FE-03` Ponto A, já aplicada na API) — coluna de exibição
// usa `label`; o gate das 3 ações acima usa exclusivamente `value`.
//
// `product`/`warehouse`/`cost_center`/`user` podem vir `null` do Resource se
// a relação não carregar (`whenLoaded`) — optional chaining obrigatório em
// todo acesso (mesma defesa em profundidade dos irmãos).
// -----------------------------------------------------------------------------

import { useMemo, useState } from 'react';

import type { ElementType } from 'react';

import { Box, Flex, Icon, Text, useDisclosure, VStack } from '@chakra-ui/react';
import { createColumnHelper } from '@tanstack/react-table';
import { FiClipboard, FiDownload, FiEye, FiFileText, FiTrash2, FiUpload } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';

import { Actions } from '@/components/Action';
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
  deleteRequisition,
  getRequisitionDocument,
  getSignedRequisitionDocument,
  listRequisitions,
} from '@/services/v2/Requisitions/requisition-service';
import type { ListRequisitionsParams } from '@/services/v2/Requisitions/requisition-service';

import type { RequisitionFilterForm, RequisitionListItem } from '@/@types/v2/Requisitions';

import { FilterSideRequisition } from './FilterSideRequisition';
import { RequisitionImportDocumentModal } from './RequisitionImportDocumentModal';

// Mirror `App\Enums\StockMovementStatus` (backend, backed `int`) — `value`
// NUMÉRICO estável, nunca a `label` traduzida (`GAP-REQUISICAO-FE-03` Ponto A).
const REQUISITION_STATUS_PENDING = 1;
const REQUISITION_STATUS_SIGNED = 2;

// Chave de storage desta tela — NÃO colide com outras chaves de Estoque
// (prefixo próprio + `queryKey.requisitions.requisitions`).
const REQUISITION_STORAGE_KEY = 'AdministrativoRequisition' + queryKey.requisitions.requisitions;

// Achatamento `RequisitionFilterForm` (Option-based) →
// `ListRequisitionsParams` (querystring real de `GET /requisitions`) —
// mirror `FarmTransferList::toRequestFilter`.
function toRequestFilter(filter?: RequisitionFilterForm | null): ListRequisitionsParams {
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

export default function RequisitionList() {
  const { languageGB } = useLanguage();
  const navigate = useNavigate();
  const { can } = usePermissions();
  const text = languageGB.requisitions.requisition;

  const canCreate = can('requisitions_create');
  const canView = can('requisitions_view');
  const canDelete = can('requisitions_delete');

  const defaultQueryOptions = useMemo(
    () => ({
      pageSize: 10,
      storageKey: REQUISITION_STORAGE_KEY,
    }),
    []
  );

  const { paginatedQuery, handlePaginatedQuery, handleFilterChange, handleResetFilter } =
    userPaginatedQuery<RequisitionFilterForm>(defaultQueryOptions);

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

  const requisitionsList = useCustomGridQuery<RequisitionListItem, ListRequisitionsParams>({
    asyncFunction: listRequisitions,
    queryKey: queryKey.requisitions.requisitions,
    paginatedQuery,
    setPaginatedQuery: handlePaginatedQuery,
    filterQuery: [],
    filter: requestFilter,
  });

  // ---- Estado de exclusão ---------------------------------------------------
  const [toDelete, setToDelete] = useState<RequisitionListItem | null>(null);
  const {
    open: isOpenDeleteDialog,
    onOpen: onOpenDeleteDialog,
    onClose: onCloseDeleteDialog,
  } = useDisclosure();

  const deleteMutation = useRequest({
    asyncFunction: async ({ requisitionUuid }: { requisitionUuid: string }) => {
      // `deleteRequisition` retorna `Promise<void>` (204 sem body) —
      // `undefined` explícito satisfaz o contrato `Promise<Response<any> |
      // undefined>` de `useRequest` sem alterar o service já travado pela
      // fundação.
      await deleteRequisition(requisitionUuid);
      return undefined;
    },
    queryKey: queryKey.requisitions.requisitions,
    typesRequest: 'apply',
    entityName: text.singularLabel,
    personalizedMessage: text.list.deletedToast,
    actionSuccess: () => {
      onCloseDeleteDialog();
      setToDelete(null);
    },
  });

  const handleDeleteClick = (requisition: RequisitionListItem) => {
    setToDelete(requisition);
    onOpenDeleteDialog();
  };

  const handleConfirmDelete = () => {
    if (toDelete) {
      deleteMutation.mutate({ requisitionUuid: toDelete.uuid });
    }
  };

  const isDeleting = deleteMutation.isPending;

  // ---- Tarefa 06 — Documento para Assinatura / Documento Assinado ----------
  // Download síncrono via blob, abre em NOVA ABA (não é para baixar — é para
  // visualizar/assinar fisicamente) — mirror `FoodBeat::handlePrintReport`,
  // adaptado de `downloadBlob` para `window.open` (Ponto C do Gap:
  // `URL.createObjectURL`+`window.open`, sem modal). Estado local por uuid
  // (mesmo padrão do irmão) — nenhuma mutation TanStack, é leitura pura.
  const [openingDocumentUuid, setOpeningDocumentUuid] = useState<string | null>(null);

  async function handleOpenBlobInNewTab(blob: Blob) {
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
    // Revoga em seguida (a nova aba já carregou o Object URL) — mirror
    // `downloadBlob`, evita vazar memória do Blob URL.
    setTimeout(() => URL.revokeObjectURL(url), 10_000);
  }

  async function handleGenerateDocument(requisition: RequisitionListItem) {
    setOpeningDocumentUuid(requisition.uuid);
    try {
      const blob = await getRequisitionDocument(requisition.uuid);
      await handleOpenBlobInNewTab(blob);
    } catch {
      toaster.error({ title: text.singularLabel, description: text.list.documentErrorToast });
    } finally {
      setOpeningDocumentUuid(null);
    }
  }

  async function handleViewSignedDocument(requisition: RequisitionListItem) {
    setOpeningDocumentUuid(requisition.uuid);
    try {
      const blob = await getSignedRequisitionDocument(requisition.uuid);
      await handleOpenBlobInNewTab(blob);
    } catch {
      toaster.error({ title: text.singularLabel, description: text.list.documentErrorToast });
    } finally {
      setOpeningDocumentUuid(null);
    }
  }

  // ---- Tarefa 06 — Importar Documento Assinado (modal single-step) --------
  const [importDocumentUuid, setImportDocumentUuid] = useState<string | null>(null);
  const {
    open: isImportDocumentOpen,
    onOpen: onOpenImportDocument,
    onClose: onCloseImportDocument,
  } = useDisclosure();

  function handleImportDocumentClick(requisition: RequisitionListItem) {
    setImportDocumentUuid(requisition.uuid);
    onOpenImportDocument();
  }

  const columnHelper = createColumnHelper<RequisitionListItem>();
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
                  onClick={() => navigate(`/administrativo/requisicao/${row.original.uuid}`)}
                >
                  {text.list.actions.view}
                </Actions.Item>
              )}
              {canView && row.original.status?.value === REQUISITION_STATUS_PENDING && (
                <Actions.Item
                  icon={<Icon as={FiFileText} />}
                  onClick={() => handleGenerateDocument(row.original)}
                  disabled={openingDocumentUuid === row.original.uuid}
                >
                  {text.list.actions.generateDocument}
                </Actions.Item>
              )}
              {canView && row.original.status?.value === REQUISITION_STATUS_PENDING && (
                <Actions.Item
                  icon={<Icon as={FiUpload} />}
                  onClick={() => handleImportDocumentClick(row.original)}
                >
                  {text.list.actions.importDocument}
                </Actions.Item>
              )}
              {canView && row.original.status?.value === REQUISITION_STATUS_SIGNED && (
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

  const gridSettings = useGridSettings<RequisitionListItem>({
    storageKey: REQUISITION_STORAGE_KEY,
    storageScope: useGridStorageScope(),
    columns: defaultColumns,
  });
  const { columnOrder, setColumnOrder, columnVisibility, setColumnVisibility } = gridSettings;

  const isLoading = checkLoadingStatus([requisitionsList]);
  const items = requisitionsList.data?.data?.items;
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
                  onClick={() => navigate('/administrativo/requisicao/novo')}
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
            isError={requisitionsList.isError}
            error={requisitionsList.error}
            isEmpty={isEmpty}
            onRetry={() => requisitionsList.refetch()}
            isRetrying={requisitionsList.isFetching}
            emptyIcon={FiClipboard as ElementType}
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
            onCreate={() => navigate('/administrativo/requisicao/novo')}
          />
        </Box>
      </TableProvider>

      <FilterSideRequisition
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

      <RequisitionImportDocumentModal
        isOpen={isImportDocumentOpen}
        onClose={() => {
          onCloseImportDocument();
          setImportDocumentUuid(null);
        }}
        requisitionUuid={importDocumentUuid}
      />
    </ContainerGrid>
  );
}
