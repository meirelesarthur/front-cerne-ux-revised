// src/pages/Operacional/VendaAnimais/index.tsx
// -----------------------------------------------------------------------------
// Tela de LISTAGEM (grid) de VENDA DE ANIMAIS — Operacional > Pecuária
// (TASK-VD-FE-01, item de menu NOVO `ope-pec-ven` → `mov_sale_view`).
//
// Rota: /operacional/venda-animais (guardada por `mov_sale_view`,
// registrada em src/router/index.tsx).
//
// Referência UX (UX-GAP confirmado, `GAP-VENDAS-FE-01` — tela ausente no
// design system `cerne`, decisão do dono: mirror estrutural do módulo
// Romaneios, já migrado):
//   GB.Cerne.UX @ 24bd91603a6ee4e19b58fa5efe2221835c83e306
//   Molde de código na SPA (sibling-first): src/pages/Operacional/Romaneios/index.tsx
//
// 10 colunas reais (frontend-contract-vendas.md §5.1, LM1-LM10) — VD-FE-04
// (`GAP-API-FE-02` FECHADO pela api): "Financeiro"/LM8 e "N. NFe"/LM9 agora
// têm dado real (`MovementSaleRepository::listWithFilters()` passa a
// eager-carregar `nfe` + `withCount('incomes')`; `MovementSaleResource`
// expõe `has_financial`/`nfe` na listagem) — RESTAURADAS. Status · Código ·
// Cliente · Data Venda · Valor Total · Data Cadastro · Venda (type_sale) ·
// Financeiro · N. NFe · Ações.
// -----------------------------------------------------------------------------

import { useMemo, useState } from 'react';

import type { ElementType } from 'react';

import { Badge, Box, Flex, Text, useDisclosure } from '@chakra-ui/react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createColumnHelper, type OnChangeFn, type RowSelectionState } from '@tanstack/react-table';
import { isAxiosError } from 'axios';
import { FiShoppingBag } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';

import { ContainerGrid } from '@/components/ContainerGrid';
import { DeleteConfirmDialog } from '@/components/DeleteConfirmDialog';
import { HeaderGrid } from '@/components/HeaderGrid';
import { Table } from '@/components/Table';
import { Checkbox } from '@/components/ui/checkbox';
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
  deleteMovementSale,
  downloadMovementSaleReport,
  downloadMovementSaleSisbovRearingReport,
  downloadMovementSaleSisbovSlaughterReport,
} from '@/services/v2/MovementSales/movement-sale-service';

import type { MovementSaleFilterForm, MovementSaleListItem } from '@/@types/v2/MovementSales';

import { FilterSideVendaAnimais } from './FilterSideVendaAnimais';
import { HeaderTable } from './HeaderTable';
import { MovementSaleDocumentsModal } from './MovementSaleDocumentsModal';
import { MovementSaleEmitNfeDialog } from './MovementSaleEmitNfeDialog';
import { isMovementSaleLocked } from './MovementSaleLockBanners';
import { useMovementSalesList } from './useMovementSales';
import { VendaAnimaisActionsMenu } from './VendaAnimaisActionsMenu';

import { PageHeader } from '@/components/ui/PageHeader';

import { ListToolbar } from '@/components/ui/ListToolbar';
import { useListSearch } from '@/hooks/useListSearch';

const PAGE_SIZE_OPTIONS = [10, 30, 50, 100];

function formatCurrencyBRL(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export default function VendaAnimaisList() {
  const { languageGB } = useLanguage();
  const navigate = useNavigate();
  const { can } = usePermissions();
  const text = languageGB.movementSales.movementSale;

  const canView = can('mov_sale_view');
  const canEdit = can('mov_sale_edit');
  const canDelete = can('mov_sale_delete');
  // Gate DUPLO da ação "Emitir NFe" (Tarefa 17.c, task-packet §2.5) —
  // `canEdit`/`mov_sale_edit` (mesmo gate do endpoint `nfe-issue`,
  // oculta o item) + `nfe_create` (rota de destino responde 403 sem ela,
  // item aparece desabilitado com Tooltip, nunca oculto).
  const canIssueNfe = can('nfe_create');

  // ---- Seleção múltipla para Finalização em lote (TASK-VD-FE-03, contrato
  // §8.2) — controlada (chaves = `uuid`, via `getRowId`), mirror
  // `SaldoEstoque/index.tsx`. Só linhas `status==='P'` são selecionáveis —
  // o checkbox da linha vem desabilitado para `status==='F'` (ver coluna
  // `select` abaixo), então `handleRowSelectionChange` só precisa filtrar
  // seleção "herdada" de uma mudança de página/filtro.
  const canBatchFinish = canEdit;
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});

  const handleRowSelectionChange: OnChangeFn<RowSelectionState> = (updater) => {
    const next = typeof updater === 'function' ? updater(rowSelection) : updater;
    setRowSelection(next);
  };

  const selectedUuids = useMemo(
    () => Object.keys(rowSelection).filter((uuid) => rowSelection[uuid]),
    [rowSelection]
  );

  function handleClickFinishBatch() {
    if (selectedUuids.length === 0) return;
    navigate(`/operacional/venda-animais/finalizar-lote?ids=${selectedUuids.join(',')}`);
  }

  const defaultQueryOptions = useMemo(
    () => ({
      pageSize: 10,
      storageKey: 'OperacionalVendaAnimais' + queryKey.movementSales.movementSales,
    }),
    []
  );

  const { paginatedQuery, handlePaginatedQuery, handleFilterChange, handleResetFilter } =
    userPaginatedQuery<MovementSaleFilterForm>(defaultQueryOptions);
  const listSearch = useListSearch(paginatedQuery.filter, handleFilterChange);

  const { open: isFilterOpen, onOpen: onOpenFilter, onClose: onCloseFilter } = useDisclosure();

  // `*_label` são companions DISPLAY-ONLY de re-hidratação do
  // SelectAsyncPaginate — nunca contam como filtro aplicado (mesma regra de
  // `Operacional/Romaneios/index.tsx`).
  const filtersApplied = useMemo(
    () =>
      Object.entries(paginatedQuery.filter ?? {})
        .filter(([key]) => !key.endsWith('_label'))
        .filter(([, v]) => v !== undefined && v !== null && v !== '').length,
    [paginatedQuery.filter]
  );

  const movementSalesList = useMovementSalesList({
    paginatedQuery,
    setPaginatedQuery: handlePaginatedQuery,
    filter: paginatedQuery.filter ?? undefined,
  });

  // ---- Estado de exclusão --------------------------------------------------
  const queryClient = useQueryClient();
  const [toDelete, setToDelete] = useState<MovementSaleListItem | null>(null);
  const {
    open: isOpenDeleteDialog,
    onOpen: onOpenDeleteDialog,
    onClose: onCloseDeleteDialog,
  } = useDisclosure();

  const deleteMutation = useMutation({
    mutationFn: async (uuid: string) => deleteMovementSale(uuid),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [queryKey.movementSales.movementSales] });

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

  function handleDeleteClick(item: MovementSaleListItem) {
    setToDelete(item);
    onOpenDeleteDialog();
  }

  function handleConfirmDelete() {
    if (toDelete) {
      deleteMutation.mutate(toDelete.uuid);
    }
  }

  // ---- Relatórios PDF (Tarefa 17.a, task-packet §3/§6 — fatia "Relatórios")
  // --------------------------------------------------------------------------
  // Download síncrono via blob (mirror `NfeDetalhe.tsx::handleDownloadDanfe`
  // — `useState` local + `try/catch` + `toaster`, NUNCA `useRequest`/mutation
  // TanStack para binário). Estado de download rastreado por `uuid` (não um
  // booleano global da listagem) para travar só o item da PRÓPRIA linha.
  const [downloadingReportUuid, setDownloadingReportUuid] = useState<string | null>(null);
  const [downloadingSisbovRearingUuid, setDownloadingSisbovRearingUuid] = useState<string | null>(
    null
  );
  const [downloadingSisbovSlaughterUuid, setDownloadingSisbovSlaughterUuid] = useState<
    string | null
  >(null);

  async function handleDownloadReport(item: MovementSaleListItem) {
    setDownloadingReportUuid(item.uuid);
    try {
      const blob = await downloadMovementSaleReport(item.uuid);
      downloadBlob(blob, `venda-${item.code}.pdf`);
    } catch {
      toaster.error({ title: text.singularLabel, description: text.reports.printError });
    } finally {
      setDownloadingReportUuid(null);
    }
  }

  // SISBOV Recria/Abate — 404 é comportamento ESPERADO (venda válida sem
  // animal SISBOV, `findWithSisbovItems()` do servidor) e recebe mensagem
  // própria (`reports.sisbovNotFound`), nunca o toast genérico de erro.
  async function handleDownloadSisbovRearing(item: MovementSaleListItem) {
    setDownloadingSisbovRearingUuid(item.uuid);
    try {
      const blob = await downloadMovementSaleSisbovRearingReport(item.uuid);
      downloadBlob(blob, `sisbov-recria-${item.code}.pdf`);
    } catch (error) {
      if (isAxiosError(error) && error.response?.status === 404) {
        toaster.error({ title: text.singularLabel, description: text.reports.sisbovNotFound });
      } else {
        toaster.error({ title: text.singularLabel, description: text.reports.printError });
      }
    } finally {
      setDownloadingSisbovRearingUuid(null);
    }
  }

  async function handleDownloadSisbovSlaughter(item: MovementSaleListItem) {
    setDownloadingSisbovSlaughterUuid(item.uuid);
    try {
      const blob = await downloadMovementSaleSisbovSlaughterReport(item.uuid);
      downloadBlob(blob, `sisbov-abate-${item.code}.pdf`);
    } catch (error) {
      if (isAxiosError(error) && error.response?.status === 404) {
        toaster.error({ title: text.singularLabel, description: text.reports.sisbovNotFound });
      } else {
        toaster.error({ title: text.singularLabel, description: text.reports.printError });
      }
    } finally {
      setDownloadingSisbovSlaughterUuid(null);
    }
  }

  // ---- Documentos (Tarefa 17.b, task-packet §3/§6 — fatia "Documentos") ---
  // Modal próprio (`MovementSaleDocumentsModal`) carrega o detalhe da venda
  // por si (`useMovementSaleDetail`, ver docblock do componente) — a
  // listagem só guarda qual venda está sendo editada (uuid + code, para o
  // título do modal).
  const [documentsTarget, setDocumentsTarget] = useState<MovementSaleListItem | null>(null);
  const {
    open: isOpenDocuments,
    onOpen: onOpenDocuments,
    onClose: onCloseDocuments,
  } = useDisclosure();

  function handleOpenDocuments(item: MovementSaleListItem) {
    setDocumentsTarget(item);
    onOpenDocuments();
  }

  // ---- Emitir NFe (Tarefa 17.c, task-packet §3/§6 — fatia "Emitir NFe",
  // ÚLTIMA fatia da Tarefa 17) ------------------------------------------
  // Mesmo racional de `documentsTarget` — o diálogo consulta o detalhe da
  // venda por si (`MovementSaleEmitNfeDialog`, `useMovementSaleDetail`); a
  // listagem só guarda uuid + code (título/mensagens do diálogo).
  const [emitNfeTarget, setEmitNfeTarget] = useState<MovementSaleListItem | null>(null);
  const { open: isOpenEmitNfe, onOpen: onOpenEmitNfe, onClose: onCloseEmitNfe } = useDisclosure();

  function handleOpenEmitNfe(item: MovementSaleListItem) {
    setEmitNfeTarget(item);
    onOpenEmitNfe();
  }

  const columnHelper = createColumnHelper<MovementSaleListItem>();
  const defaultColumns = useMemo(
    () => [
      // Coluna de checkbox de seleção múltipla (TASK-VD-FE-03, contrato
      // §8.2) — só quando `canBatchFinish`. Mirror `SaldoEstoque/index.tsx`
      // (`id: 'select'`, `gridOrder: 'fixed-start'`, largura estreita vinda
      // do ternário aditivo de `Table.tsx`). Checkbox desabilitado para
      // vendas `status!=='P'` — só Pendentes entram no lote de finalização.
      ...(canBatchFinish
        ? [
            columnHelper.display({
              id: 'select',
              header: '',
              enableHiding: false,
              cell: ({ row }) => (
                <Checkbox
                  checked={row.getIsSelected()}
                  onCheckedChange={() => row.toggleSelected()}
                  disabled={row.original.status !== 'P'}
                  aria-label={row.original.code}
                />
              ),
              meta: { gridOrder: 'fixed-start' },
            }),
          ]
        : []),
      columnHelper.accessor('status', {
        header: text.list.table.status,
        cell: ({ row }) => (
          <Badge colorPalette={row.original.status === 'F' ? 'green' : 'orange'} variant="subtle">
            {row.original.status_label}
          </Badge>
        ),
        meta: styleColumTable.sm,
      }),
      columnHelper.accessor('code', {
        header: text.list.table.code,
        cell: ({ row }) => <Text fontWeight="medium">{row.original.code}</Text>,
        meta: styleColumTable.sm,
      }),
      columnHelper.display({
        id: 'client',
        header: text.list.table.client,
        cell: ({ row }) => <Text lineClamp="1">{row.original.client?.name ?? '—'}</Text>,
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
      // `type_sale` via mapper `movementSaleTypeOptions.getLabel` — nunca
      // literal inline duplicado (corrige por construção o
      // `POSSIVEL_LEGACY_DEFECT` LM7/C41 do legado, sem mudar o VALOR
      // exibido — o backend já devolve `type_sale_label`, usado direto).
      columnHelper.accessor('type_sale', {
        header: text.list.table.typeSale,
        cell: ({ row }) => (
          <Badge colorPalette="blue" variant="subtle">
            {row.original.type_sale_label}
          </Badge>
        ),
        meta: styleColumTable.sm,
      }),
      // VD-FE-04 (`GAP-API-FE-02` FECHADO) — coluna "Financeiro"
      // (`has_financial`, agora sempre presente na listagem).
      columnHelper.accessor('has_financial', {
        header: text.list.table.financial,
        cell: ({ row }) => (
          <Badge colorPalette={row.original.has_financial ? 'green' : 'gray'} variant="subtle">
            {row.original.has_financial
              ? languageGB.defaltStrings.yes
              : languageGB.defaltStrings.no}
          </Badge>
        ),
        meta: styleColumTable.sm,
      }),
      // VD-FE-04 (`GAP-API-FE-02` FECHADO) — coluna "N. NFe" (`nfe.number`,
      // agora eager-carregado também na listagem); `—` quando a venda não
      // tem NFe vinculada (SEM MOCK).
      columnHelper.display({
        id: 'nfe',
        header: text.list.table.nfe,
        cell: ({ row }) => <Text fontSize="sm">{row.original.nfe?.number ?? '—'}</Text>,
        meta: styleColumTable.sm,
      }),
      columnHelper.display({
        id: 'acoes',
        header: '',
        enableHiding: false,
        enableSorting: false,
        cell: ({ row }) => {
          const item = row.original;
          const isLocked = isMovementSaleLocked(item);
          return (
            <Flex justify="flex-end">
              <VendaAnimaisActionsMenu
                canView={canView}
                canEdit={canEdit}
                canDelete={canDelete}
                isLocked={isLocked}
                canFinish={item.status === 'P'}
                canIssueNfe={canIssueNfe}
                typeSale={item.type_sale}
                isDeleting={isDeleting}
                isDownloadingReport={downloadingReportUuid === item.uuid}
                isDownloadingSisbovRearing={downloadingSisbovRearingUuid === item.uuid}
                isDownloadingSisbovSlaughter={downloadingSisbovSlaughterUuid === item.uuid}
                labels={{
                  view: text.list.actions.view,
                  print: text.list.actions.print,
                  documents: text.list.actions.documents,
                  sisbovRearing: text.list.actions.sisbovRearing,
                  sisbovSlaughter: text.list.actions.sisbovSlaughter,
                  emitNfe: text.list.actions.emitNfe,
                  emitNfeDisabledTooltip: text.list.actions.emitNfeDisabledTooltip,
                  edit: text.list.actions.edit,
                  finish: text.list.actions.finish,
                  delete: text.list.actions.delete,
                  editDisabledTooltip: text.list.actions.editDisabledTooltip,
                }}
                onView={() => navigate(`/operacional/venda-animais/${item.uuid}`)}
                onEdit={() => navigate(`/operacional/venda-animais/${item.uuid}/editar`)}
                onFinish={() => navigate(`/operacional/venda-animais/${item.uuid}/finalizar`)}
                onPrint={() => handleDownloadReport(item)}
                onDocuments={() => handleOpenDocuments(item)}
                onSisbovRearing={() => handleDownloadSisbovRearing(item)}
                onSisbovSlaughter={() => handleDownloadSisbovSlaughter(item)}
                onEmitNfe={() => handleOpenEmitNfe(item)}
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
      languageGB,
      canView,
      canEdit,
      canDelete,
      canIssueNfe,
      downloadingReportUuid,
      downloadingSisbovRearingUuid,
      downloadingSisbovSlaughterUuid,
    ]
  );

  const isLoading = checkLoadingStatus([movementSalesList]);
  const items = movementSalesList.data?.data?.items;
  const isEmpty = !isLoading && (items?.length ?? 0) === 0;

  return (
    <ContainerGrid>
      <TableProvider
        data={items}
        columns={defaultColumns}
        pagination={paginatedQuery}
        setPagination={handlePaginatedQuery}
        enableMultiRowSelection={canBatchFinish}
        getRowId={(row) => row.uuid}
        rowSelection={rowSelection}
        onRowSelectionChange={handleRowSelectionChange}
      >
        <HeaderGrid
          header={
            <HeaderTable
              onOpenFilter={onOpenFilter}
              filtersApplied={filtersApplied}
              languageGB={languageGB}
              batchFinish={
                canBatchFinish
                  ? { selectedCount: selectedUuids.length, onClick: handleClickFinishBatch }
                  : undefined
              }
            />
          }
        >
          <PageHeader title={text.list.pageTitle} description={text.list.pageSubtitle} />
        </HeaderGrid>

        <ListToolbar
          search={listSearch.value}
          onSearch={listSearch.onChange}
          searchPlaceholder={languageGB.defaltStrings.searchList}
          onOpenFilter={onOpenFilter}
          filtersApplied={filtersApplied - (paginatedQuery.filter?.search ? 1 : 0)}
        />

        <Box>
          <Table
            isLoading={isLoading}
            pageSizeOptions={PAGE_SIZE_OPTIONS}
            isError={movementSalesList.isError}
            error={movementSalesList.error}
            isEmpty={isEmpty}
            onRetry={() => movementSalesList.refetch()}
            isRetrying={movementSalesList.isFetching}
            retryLabel={text.list.error.retry}
            emptyIcon={FiShoppingBag as ElementType}
            emptyTitle={
              filtersApplied > 0 ? text.list.emptyState.titleFiltered : text.list.emptyState.titleEmpty
            }
            emptyDescription={
              filtersApplied > 0
                ? text.list.emptyState.descriptionFiltered
                : text.list.emptyState.descriptionEmpty
            }
            canCreate={false}
          />
        </Box>
      </TableProvider>

      <FilterSideVendaAnimais
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

      <MovementSaleDocumentsModal
        isOpen={isOpenDocuments}
        onClose={() => {
          onCloseDocuments();
          setDocumentsTarget(null);
        }}
        movementSaleUuid={documentsTarget?.uuid ?? null}
        movementSaleCode={documentsTarget?.code}
      />

      <MovementSaleEmitNfeDialog
        isOpen={isOpenEmitNfe}
        onClose={() => {
          onCloseEmitNfe();
          setEmitNfeTarget(null);
        }}
        movementSaleUuid={emitNfeTarget?.uuid ?? null}
        movementSaleCode={emitNfeTarget?.code}
      />
    </ContainerGrid>
  );
}
