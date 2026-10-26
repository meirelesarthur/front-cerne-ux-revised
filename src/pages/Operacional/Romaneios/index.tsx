// src/pages/Operacional/Romaneios/index.tsx
// -----------------------------------------------------------------------------
// Tela de LISTAGEM (grid) de ROMANEIOS — Operacional (menu já existente,
// `ope-agr-rom` → `transfers_view`).
//
// Rota: /operacional/romaneios (guardada por `transfers_view`, registrada em
// src/router/index.tsx — este arquivo não mexe em rota/menu).
//
// Referência UX (GAP-TRF-FE-01 — UX-GAP, tela ausente no design system
// `cerne`, derivada por composição canônica + análogos nomeados):
//   GB.Cerne.UX @ 24bd91603a6ee4e19b58fa5efe2221835c83e306
//   Análogo estrutural: src/pages/cadastros/centros-custo/CentrosCustoLista.tsx
//   Molde de código na SPA (sibling-first): src/pages/Invoices/index.tsx +
//   src/pages/Administrativo/Equipes/index.tsx
//
// 10 colunas (front-contract-romaneios.md §4.2, GAP-TRF-FE-03/09) — Status ·
// Nº · Dt. Remessa · Dt. Venda · NF-e · Total · Responsável · Tipo ·
// Origem/Trava · Ações. SEM coluna Cliente (`TransferResource` só devolve
// `client:{uuid}`, sem rótulo — FE-03) e SEM coluna `sortable` — ordenação
// fixa `latest('id')` imposta pelo servidor.
//
// Sem Zustand — fazenda ativa já vem do AuthContext via interceptor;
// paginação/filtro por `userPaginatedQuery`.
// -----------------------------------------------------------------------------

import { useMemo, useState } from 'react';

import type { ElementType } from 'react';

import { Badge, Box, Flex, Text, useDisclosure } from '@chakra-ui/react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createColumnHelper } from '@tanstack/react-table';
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
import { extractApiErrorMessage } from '@/utils/extractApiErrorMessage';
import formatDate from '@/utils/formatDate';
import { styleColumTable } from '@/utils/style-colum-table';

import { queryKey } from '@/constants/query-key';

import { deleteTransfer } from '@/services/v2/Transfers/transfer-service';

import type { TransferFilterForm, TransferListItem } from '@/@types/v2/Transfers';

import { FilterSideRomaneios } from './FilterSideRomaneios';
import { HeaderTable } from './HeaderTable';
import { RomaneioActionsMenu } from './RomaneioActionsMenu';
import { useTransfersList } from './useRomaneios';

import { PageHeader } from '@/components/ui/PageHeader';

// Seletor de itens por página — 10/30/50/100 (GAP-TRF-FE-15). NUNCA 200: o
// servidor valida `per_page` como `max:100`.
const PAGE_SIZE_OPTIONS = [10, 30, 50, 100];

export default function RomaneiosList() {
  const { languageGB } = useLanguage();
  const navigate = useNavigate();
  const { can } = usePermissions();
  const text = languageGB.transfers.transfer;

  const canCreate = can('transfers_create');
  const canView = can('transfers_view');
  const canEdit = can('transfers_edit');
  const canDelete = can('transfers_delete');

  const defaultQueryOptions = useMemo(
    () => ({
      pageSize: 10,
      storageKey: 'OperacionalRomaneios' + queryKey.transfers.transfers,
    }),
    []
  );

  const { paginatedQuery, handlePaginatedQuery, handleFilterChange, handleResetFilter } =
    userPaginatedQuery<TransferFilterForm>(defaultQueryOptions);

  // ---- Estado de filtro (drawer) ------------------------------------------
  const { open: isFilterOpen, onOpen: onOpenFilter, onClose: onCloseFilter } = useDisclosure();

  // `search` fica de fora da contagem — vive no toolbar do header, não no
  // drawer (GAP-TRF-FE-06); `*_label` são companions DISPLAY-ONLY de
  // re-hidratação dos SelectAsyncPaginate, nunca contam como filtro aplicado
  // (mesma regra de `Inventario/index.tsx`).
  const filtersApplied = useMemo(
    () =>
      Object.entries(paginatedQuery.filter ?? {})
        .filter(([key]) => key !== 'search' && !key.endsWith('_label'))
        .filter(([, v]) => v !== undefined && v !== null && v !== '').length,
    [paginatedQuery.filter]
  );

  const transfersList = useTransfersList({
    paginatedQuery,
    setPaginatedQuery: handlePaginatedQuery,
    filter: paginatedQuery.filter ?? undefined,
  });

  // Busca "Nº do romaneio" — o `HeaderTable` já garante que só chega aqui
  // valor `undefined` (limpo) ou um inteiro válido (armadilha #2 da Tarefa).
  function handleSearchChange(value: number | undefined) {
    handleFilterChange({
      ...(paginatedQuery.filter ?? {}),
      search: value,
    });
  }

  // ---- Estado de exclusão --------------------------------------------------
  const queryClient = useQueryClient();
  const [toDelete, setToDelete] = useState<TransferListItem | null>(null);
  const {
    open: isOpenDeleteDialog,
    onOpen: onOpenDeleteDialog,
    onClose: onCloseDeleteDialog,
  } = useDisclosure();

  // Pode falhar com 422 de negócio mesmo com o botão habilitado (o dado pode
  // mudar entre o carregamento da lista e o clique, armadilha #8 da Tarefa)
  // — `extractApiErrorMessage` já lê a `message` real do servidor.
  const deleteMutation = useMutation({
    mutationFn: async (uuid: string) => deleteTransfer(uuid),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [queryKey.transfers.transfers] });

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

  function handleDeleteClick(item: TransferListItem) {
    setToDelete(item);
    onOpenDeleteDialog();
  }

  function handleConfirmDelete() {
    if (toDelete) {
      deleteMutation.mutate(toDelete.uuid);
    }
  }

  const columnHelper = createColumnHelper<TransferListItem>();
  const defaultColumns = useMemo(
    () => [
      columnHelper.accessor('status', {
        header: text.list.table.status,
        cell: ({ row }) => (
          <Badge colorPalette={row.original.status === 'F' ? 'green' : 'red'} variant="subtle">
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
      columnHelper.accessor('dt_shipping', {
        header: text.list.table.dtShipping,
        cell: ({ row }) => <Text fontSize="sm">{formatDate(row.original.dt_shipping)}</Text>,
        meta: styleColumTable.date,
      }),
      columnHelper.accessor('dt_sale', {
        header: text.list.table.dtSale,
        cell: ({ row }) => <Text fontSize="sm">{formatDate(row.original.dt_sale)}</Text>,
        meta: styleColumTable.date,
      }),
      columnHelper.accessor('nfe', {
        header: text.list.table.nfe,
        cell: ({ row }) => (
          <Text fontSize="sm" lineClamp="1">
            {row.original.nfe || text.list.table.nfeEmpty}
          </Text>
        ),
        meta: styleColumTable.sm,
      }),
      // ⚠️ NÃO é o `total_geral` da grid legada (GAP-TRF-FE-09) — divergência
      // documentada, não recalculado no cliente (a listagem não eager-carrega
      // `expenses`).
      columnHelper.accessor('total', {
        header: text.list.table.total,
        cell: ({ row }) => (
          <Text fontSize="sm">
            {row.original.total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          </Text>
        ),
        meta: styleColumTable.sm,
      }),
      columnHelper.display({
        id: 'responsible',
        header: text.list.table.responsible,
        cell: ({ row }) => <Text lineClamp="1">{row.original.user?.label ?? '—'}</Text>,
      }),
      columnHelper.accessor('type', {
        header: text.list.table.type,
        cell: ({ row }) => (
          <Badge colorPalette="blue" variant="subtle">
            {row.original.type_label}
          </Badge>
        ),
        meta: styleColumTable.sm,
      }),
      // Coluna NOVA (GAP-TRF-FE-05) — badges compactos de origem/trava,
      // derivados dos 4 campos presentes tanto no `index` quanto no `show`
      // (`withDerivedFlags()`), sem request extra.
      columnHelper.display({
        id: 'origin-lock',
        header: text.list.table.originLock,
        cell: ({ row }) => {
          const item = row.original;
          return (
            <Flex gap={1} wrap="wrap">
              {item.has_fiscal_document && (
                <Badge colorPalette="blue" variant="subtle">
                  {text.badges.fiscalDocument}
                </Badge>
              )}
              {item.has_financial_posting && (
                <Badge colorPalette="orange" variant="subtle">
                  {text.badges.financialPosting}
                </Badge>
              )}
              {item.is_from_charge && (
                <Badge colorPalette="gray" variant="subtle">
                  {text.badges.fromCharge}
                </Badge>
              )}
              {item.is_from_weighing && (
                <Badge colorPalette="gray" variant="subtle">
                  {text.badges.fromWeighing}
                </Badge>
              )}
            </Flex>
          );
        },
        meta: styleColumTable.md,
      }),
      columnHelper.display({
        id: 'acoes',
        header: '',
        enableHiding: false,
        enableSorting: false,
        cell: ({ row }) => {
          const item = row.original;
          const isLocked = item.has_fiscal_document || item.has_financial_posting;
          return (
            <Flex justify="flex-end">
              <RomaneioActionsMenu
                canView={canView}
                canEdit={canEdit}
                canDelete={canDelete}
                isLocked={isLocked}
                isFinishable={item.status === 'P'}
                isDeleting={isDeleting}
                labels={{
                  view: text.list.actions.view,
                  edit: text.list.actions.edit,
                  delete: text.list.actions.delete,
                  finish: text.list.actions.finish,
                  finishDisabledTooltip: text.list.actions.finishDisabledTooltip,
                  editDisabledTooltip: text.list.actions.editDisabledTooltip,
                  deleteDisabledTooltip: text.list.actions.deleteDisabledTooltip,
                }}
                onView={() => navigate(`/operacional/romaneios/${item.uuid}/detalhe`)}
                onEdit={() => navigate(`/operacional/romaneios/${item.uuid}`)}
                onFinish={() => navigate(`/operacional/romaneios/${item.uuid}/finalizar`)}
                onDelete={() => handleDeleteClick(item)}
              />
            </Flex>
          );
        },
        meta: styleColumTable.sm,
      }),
    ],
    [navigate, isDeleting, text, canView, canEdit, canDelete]
  );

  const isLoading = checkLoadingStatus([transfersList]);
  const items = transfersList.data?.data?.items;
  const isEmpty = !isLoading && (items?.length ?? 0) === 0;

  return (
    <ContainerGrid>
      <TableProvider
        data={items}
        columns={defaultColumns}
        pagination={paginatedQuery}
        setPagination={handlePaginatedQuery}
        enableMultiRowSelection={false}
      >
        <HeaderGrid
          header={
            <HeaderTable
              onOpenFilter={onOpenFilter}
              filtersApplied={filtersApplied}
              languageGB={languageGB}
              searchValue={paginatedQuery.filter?.search}
              onSearchChange={handleSearchChange}
            />
          }
        >
          <PageHeader title={text.list.pageTitle} description={text.list.pageSubtitle} />
        </HeaderGrid>

        <Box mt={6}>
          <Table
            isLoading={isLoading}
            pageSizeOptions={PAGE_SIZE_OPTIONS}
            isError={transfersList.isError}
            error={transfersList.error}
            isEmpty={isEmpty}
            onRetry={() => transfersList.refetch()}
            isRetrying={transfersList.isFetching}
            retryLabel={text.list.error.retry}
            emptyIcon={FiFileText as ElementType}
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
            onCreate={() => navigate('/operacional/romaneios/novo')}
          />
        </Box>
      </TableProvider>

      <FilterSideRomaneios
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
    </ContainerGrid>
  );
}
