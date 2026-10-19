// src/pages/Operacional/CompraAnimais/index.tsx
// -----------------------------------------------------------------------------
// Tela de LISTAGEM (grid) de COMPRA DE ANIMAIS — Operacional > Pecuária
// (TASK-CP-05, item de menu NOVO `ope-pec-com` → `mov_purchase_view`).
//
// Rota: /operacional/compra-animais (guardada por `mov_purchase_view`,
// registrada em src/router/index.tsx).
//
// Referência UX (UX-GAP confirmado, contrato-frontend-compras-movimento.md
// §2 — precedente aceito do módulo irmão `MovementSale`, já em produção,
// sem página-molde própria no design system `cerne`):
//   Molde de código na SPA (sibling-first): src/pages/Operacional/VendaAnimais/index.tsx
//
// 9 colunas reais (contrato §5/§6, LST-01..09) — Código · Fornecedor · Data
// Compra · Valor Total · Data Cadastro · NFe (ícone condicional a `chave`
// setada) · Número NFe · GTA · Ações. Ordenação `code desc` — aplicada
// SEMPRE pelo servidor (`MovementPurchaseRepository::listWithFilters()`,
// `->latest('code')`), sem controle client-side. Paginação 20/página
// (CLM-43, mirror do default real do backend). SEM `rowSelection`/checkbox —
// Compras não tem finalização em lote (feature exclusiva de Vendas, sem
// claim equivalente no legado de Compras, roteiro TASK-CP-05).
// -----------------------------------------------------------------------------

import { useMemo, useState, type ElementType } from 'react';

import { Badge, Box, Flex, HStack, Icon, Text, useDisclosure, VStack } from '@chakra-ui/react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createColumnHelper } from '@tanstack/react-table';
import { isAxiosError } from 'axios';
import { FiFileText } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';

import { ContainerGrid } from '@/components/ContainerGrid';
import { DeleteConfirmDialog } from '@/components/DeleteConfirmDialog';
import { HeaderGrid } from '@/components/HeaderGrid';
import { Table } from '@/components/Table';
import { toaster } from '@/components/ui/toaster';

import { TableProvider } from '@/contexts/TableContext';

import { useLanguage } from '@/hooks/useLanguage';
import { userPaginatedQuery } from '@/hooks/usePaginatedQueryStorage';
import { usePermissions } from '@/hooks/usePermissions';

import { checkLoadingStatus } from '@/utils/checkLoadingStatus';
import { downloadBlob } from '@/utils/downloadBlob';
import { extractApiErrorMessage } from '@/utils/extractApiErrorMessage';
import formatDate from '@/utils/formatDate';
import { styleColumTable } from '@/utils/style-colum-table';

import { queryKey } from '@/constants/query-key';

import {
  deleteMovementPurchase,
  downloadMovementPurchaseReport,
  downloadMovementPurchaseSisbovReport,
} from '@/services/v2/MovementPurchases/movement-purchase-service';

import type {
  MovementPurchaseFilterForm,
  MovementPurchaseListItem,
} from '@/@types/v2/MovementPurchases';

import { CompraAnimaisActionsMenu } from './CompraAnimaisActionsMenu';
import { FilterSideCompraAnimais } from './FilterSideCompraAnimais';
import { HeaderTable } from './HeaderTable';
import { MovementPurchaseDocumentsModal } from './MovementPurchaseDocumentsModal';
import { isMovementPurchaseLocked } from './MovementPurchaseLockBanners';
import { useMovementPurchasesList } from './useMovementPurchases';

const PAGE_SIZE_OPTIONS = [20, 30, 50, 100];

function formatCurrencyBRL(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export default function CompraAnimaisList() {
  const { languageGB } = useLanguage();
  const navigate = useNavigate();
  const { can } = usePermissions();
  const text = languageGB.movementPurchases.movementPurchase;

  const canView = can('mov_purchase_view');
  const canEdit = can('mov_purchase_edit');
  const canDelete = can('mov_purchase_delete');

  const defaultQueryOptions = useMemo(
    () => ({
      pageSize: 20,
      storageKey: 'OperacionalCompraAnimais' + queryKey.movementPurchases.movementPurchases,
    }),
    []
  );

  const { paginatedQuery, handlePaginatedQuery, handleFilterChange, handleResetFilter } =
    userPaginatedQuery<MovementPurchaseFilterForm>(defaultQueryOptions);

  const { open: isFilterOpen, onOpen: onOpenFilter, onClose: onCloseFilter } = useDisclosure();

  // `provider_label` é companion DISPLAY-ONLY de re-hidratação do
  // SelectAsyncPaginate — nunca conta como filtro aplicado (mirror
  // `Operacional/VendaAnimais/index.tsx`).
  const filtersApplied = useMemo(
    () =>
      Object.entries(paginatedQuery.filter ?? {})
        .filter(([key]) => !key.endsWith('_label'))
        .filter(([, v]) => v !== undefined && v !== null && v !== '').length,
    [paginatedQuery.filter]
  );

  const movementPurchasesList = useMovementPurchasesList({
    paginatedQuery,
    setPaginatedQuery: handlePaginatedQuery,
    filter: paginatedQuery.filter ?? undefined,
  });

  // ---- Estado de exclusão --------------------------------------------------
  const queryClient = useQueryClient();
  const [toDelete, setToDelete] = useState<MovementPurchaseListItem | null>(null);
  const {
    open: isOpenDeleteDialog,
    onOpen: onOpenDeleteDialog,
    onClose: onCloseDeleteDialog,
  } = useDisclosure();

  const deleteMutation = useMutation({
    mutationFn: async (uuid: string) => deleteMovementPurchase(uuid),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [queryKey.movementPurchases.movementPurchases],
      });

      toaster.success({
        title: text.singularLabel,
        description: text.list.deletedToast,
        duration: 7000,
      });

      onCloseDeleteDialog();
      setToDelete(null);
    },
    onError: (error) => {
      toaster.error({
        title: text.singularLabel,
        description: extractApiErrorMessage(error) ?? languageGB.common.errorLog.unknownError,
        duration: 7000,
      });
    },
  });

  const isDeleting = deleteMutation.isPending;

  function handleDeleteClick(item: MovementPurchaseListItem) {
    setToDelete(item);
    onOpenDeleteDialog();
  }

  function handleConfirmDelete() {
    if (toDelete) {
      deleteMutation.mutate(toDelete.uuid);
    }
  }

  // ---- Relatórios PDF (TASK-CP-05, DoD "download de relatório/SISBOV via
  // blob") — download síncrono via blob (mirror `VendaAnimaisList::
  // handleDownloadReport`), `useState` local por `uuid`, nunca mutation
  // TanStack para binário. -----------------------------------------------
  const [downloadingReportUuid, setDownloadingReportUuid] = useState<string | null>(null);
  const [downloadingSisbovUuid, setDownloadingSisbovUuid] = useState<string | null>(null);

  // ---- Documentos (TASK-CP-08, ACTION-DOCUMENTS) — mirror `VendaAnimaisList`:
  // gatilho por linha, modal único controlado por `uuid`/`code` alvo. -----
  const {
    open: isDocumentsModalOpen,
    onOpen: onOpenDocumentsModal,
    onClose: onCloseDocumentsModal,
  } = useDisclosure();
  const [documentsTarget, setDocumentsTarget] = useState<MovementPurchaseListItem | null>(null);

  function handleOpenDocuments(item: MovementPurchaseListItem) {
    setDocumentsTarget(item);
    onOpenDocumentsModal();
  }

  async function handleDownloadReport(item: MovementPurchaseListItem) {
    setDownloadingReportUuid(item.uuid);
    try {
      const blob = await downloadMovementPurchaseReport(item.uuid);
      downloadBlob(blob, `compra-${item.code}.pdf`);
    } catch {
      toaster.error({ title: text.singularLabel, description: text.reports.printError });
    } finally {
      setDownloadingReportUuid(null);
    }
  }

  // 404 é comportamento ESPERADO (compra válida sem animal SISBOV) — mensagem
  // própria, nunca o toast genérico de erro (mirror `VendaAnimaisList`).
  async function handleDownloadSisbovReport(item: MovementPurchaseListItem) {
    setDownloadingSisbovUuid(item.uuid);
    try {
      const blob = await downloadMovementPurchaseSisbovReport(item.uuid);
      downloadBlob(blob, `sisbov-compra-${item.code}.pdf`);
    } catch (error) {
      if (isAxiosError(error) && error.response?.status === 404) {
        toaster.error({ title: text.singularLabel, description: text.reports.sisbovNotFound });
      } else {
        toaster.error({ title: text.singularLabel, description: text.reports.printError });
      }
    } finally {
      setDownloadingSisbovUuid(null);
    }
  }

  const columnHelper = createColumnHelper<MovementPurchaseListItem>();
  const defaultColumns = useMemo(
    () => [
      columnHelper.accessor('code', {
        header: text.list.table.code,
        cell: ({ row }) => <Text fontWeight="medium">{row.original.code}</Text>,
        meta: styleColumTable.sm,
      }),
      columnHelper.display({
        id: 'provider',
        header: text.list.table.provider,
        cell: ({ row }) => <Text lineClamp="1">{row.original.provider?.name ?? '—'}</Text>,
      }),
      columnHelper.accessor('dt_sale', {
        header: text.list.table.dtSale,
        cell: ({ row }) => <Text fontSize="sm">{formatDate(row.original.dt_sale)}</Text>,
        meta: styleColumTable.date,
      }),
      columnHelper.accessor('total', {
        header: text.list.table.total,
        cell: ({ row }) => <Text fontSize="sm">{formatCurrencyBRL(row.original.total)}</Text>,
        meta: styleColumTable.sm,
      }),
      columnHelper.accessor('created_at', {
        header: text.list.table.createdAt,
        cell: ({ row }) => <Text fontSize="sm">{formatDate(row.original.created_at)}</Text>,
        meta: styleColumTable.date,
      }),
      // Coluna ícone (LST-06) — condicional a `chave` setada (compra veio de
      // import XML, `TASK-CP-08`). Sem MOCK: só reflete o dado real.
      columnHelper.display({
        id: 'nfe',
        header: text.list.table.nfe,
        cell: ({ row }) =>
          row.original.chave ? (
            <Badge colorPalette="green" variant="subtle">
              <Icon as={FiFileText} boxSize={3} mr={1} />
              {text.list.table.nfe}
            </Badge>
          ) : (
            <Text color="fg.muted">—</Text>
          ),
        meta: styleColumTable.sm,
      }),
      columnHelper.accessor('number', {
        header: text.list.table.number,
        cell: ({ row }) => <Text fontSize="sm">{row.original.number ?? '—'}</Text>,
        meta: styleColumTable.sm,
      }),
      columnHelper.accessor('gtas', {
        header: text.list.table.gtas,
        cell: ({ row }) => <Text fontSize="sm">{row.original.gtas ?? '—'}</Text>,
        meta: styleColumTable.sm,
      }),
      columnHelper.display({
        id: 'acoes',
        header: '',
        enableHiding: false,
        enableSorting: false,
        cell: ({ row }) => {
          const item = row.original;
          return (
            <Flex justify="flex-end">
              <CompraAnimaisActionsMenu
                canView={canView}
                canEdit={canEdit}
                canDelete={canDelete}
                isLocked={isMovementPurchaseLocked(item)}
                isDeleting={isDeleting}
                isDownloadingReport={downloadingReportUuid === item.uuid}
                isDownloadingSisbovReport={downloadingSisbovUuid === item.uuid}
                labels={{
                  view: text.list.actions.view,
                  report: text.list.actions.report,
                  documents: text.list.actions.documents,
                  sisbovReport: text.list.actions.sisbovReport,
                  edit: text.list.actions.edit,
                  delete: text.list.actions.delete,
                  editDisabledTooltip: text.list.actions.editDisabledTooltip,
                  deleteDisabledTooltip: text.list.actions.deleteDisabledTooltip,
                }}
                onView={() => navigate(`/operacional/compra-animais/${item.uuid}`)}
                onEdit={() => navigate(`/operacional/compra-animais/${item.uuid}/editar`)}
                onReport={() => handleDownloadReport(item)}
                onDocuments={() => handleOpenDocuments(item)}
                onSisbovReport={() => handleDownloadSisbovReport(item)}
                onDelete={() => handleDeleteClick(item)}
              />
            </Flex>
          );
        },
        meta: styleColumTable.sm,
      }),
    ],
    [
      navigate,
      isDeleting,
      text,
      canView,
      canEdit,
      canDelete,
      downloadingReportUuid,
      downloadingSisbovUuid,
    ]
  );

  const isLoading = checkLoadingStatus([movementPurchasesList]);
  const items = movementPurchasesList.data?.data?.items;
  const isEmpty = !isLoading && (items?.length ?? 0) === 0;

  return (
    <ContainerGrid>
      <TableProvider
        data={items}
        columns={defaultColumns}
        pagination={paginatedQuery}
        setPagination={handlePaginatedQuery}
      >
        <HeaderGrid
          header={
            <HeaderTable
              onOpenFilter={onOpenFilter}
              filtersApplied={filtersApplied}
              languageGB={languageGB}
            />
          }
        >
          <VStack align="flex-start" gap={1}>
            <HStack>
              <Text fontSize="2xl" fontWeight="bold" color="brandColorText">
                {text.list.pageTitle}
              </Text>
            </HStack>
            <Text fontSize="sm" color="fg.muted">
              {text.list.pageSubtitle}
            </Text>
          </VStack>
        </HeaderGrid>

        <Box mt={6}>
          <Table
            isLoading={isLoading}
            pageSizeOptions={PAGE_SIZE_OPTIONS}
            isError={movementPurchasesList.isError}
            error={movementPurchasesList.error}
            onRetry={() => movementPurchasesList.refetch()}
            isRetrying={movementPurchasesList.isFetching}
            retryLabel={text.list.error.retry}
            isEmpty={isEmpty}
            emptyIcon={FiFileText as ElementType}
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
          />
        </Box>
      </TableProvider>

      <FilterSideCompraAnimais
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
        title={text.deleteDialog.title}
        description={
          toDelete
            ? text.deleteDialog.descriptionTemplate.replace('{code}', String(toDelete.code))
            : undefined
        }
        hideQuestionMark
        tone="danger"
      />

      <MovementPurchaseDocumentsModal
        isOpen={isDocumentsModalOpen}
        onClose={() => {
          onCloseDocumentsModal();
          setDocumentsTarget(null);
        }}
        movementPurchaseUuid={documentsTarget?.uuid ?? null}
        movementPurchaseCode={documentsTarget ? String(documentsTarget.code) : undefined}
      />
    </ContainerGrid>
  );
}
