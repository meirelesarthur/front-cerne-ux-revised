// src/pages/Operacional/Carregamento/index.tsx
// -----------------------------------------------------------------------------
// Tela de LISTAGEM (grid) de CARREGAMENTOS — Operacional > Agricultura (menu
// já existente, `ope-agr-car` → path `/operacional/carregamento`, singular).
//
// Rota: `/operacional/carregamento` (guardada por `charge_view`, registrada
// em `src/router/index.tsx` — este arquivo não mexe em rota/menu, só as
// RECONCILIA).
//
// Colunas (`list_manifest` LM-01..10, leitura direta do backend) — Status ·
// Nº · Data · Responsável · Motorista · Qtd. Prevista · Qtd. Realizada ·
// Total · Ações.
//
// ⚠️ DIVERGÊNCIA DOCUMENTADA (mirror precedente já aceito em `Romaneios`,
// GAP-TRF-FE-03): `ChargeResource::client` só devolve `{uuid}` (sem
// `.people`, sem rótulo) e `transfer_id`/`transfer()` existem no Model
// `Charge` mas NÃO são expostos por `ChargeResource::toArray()` (LM-04/LM-05
// do contrato legado). Mirror da resolução já adotada para o mesmo problema
// em `TransferResource`/`RomaneiosList`: as colunas "Cliente"/"Nº Romaneio"
// são OMITIDAS da grid (mostrar só o uuid cru não ajudaria o usuário) — sem
// bloquear a Tarefa, já que a matriz FID-G3F reconciliou LM-01..10 como
// PRESERVAR sem `BLOQUEADO`. Resolver satélite com rótulo é responsabilidade
// de uma Tarefa de API futura, fora do escopo desta Tarefa (não toca API).
//
// Sem Zustand — fazenda ativa já vem do AuthContext via interceptor;
// paginação/filtro por `userPaginatedQuery`.
// -----------------------------------------------------------------------------

import { useMemo, useState } from 'react';

import { Badge, Box, Flex, Text, useDisclosure } from '@chakra-ui/react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createColumnHelper } from '@tanstack/react-table';
import { FiTruck } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';

import type { ElementType } from 'react';

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

import { chargeStatusColorPalette } from '@/constants/carregamentos/charge/options';
import { queryKey } from '@/constants/query-key';

import { deleteCharge } from '@/services/v2/Carregamentos/charge-service';

import type { ChargeFilterForm, ChargeListItem } from '@/@types/v2/Carregamentos';

import { ChargeActionsMenu } from './ChargeActionsMenu';
import { ChargeDocumentsModal } from './ChargeDocumentsModal';
import { FilterSideCharge } from './FilterSideCharge';
import { GenerateTransferDialog } from './GenerateTransferDialog';
import { HeaderTable } from './HeaderTable';
import { useChargesList } from './useCarregamentos';

import { PageHeader } from '@/components/ui/PageHeader';

// Seletor de itens por página — 10/30/50/100, mirror `Romaneios/index.tsx`.
// NUNCA 200: o servidor valida `per_page` como `max:100`.
const PAGE_SIZE_OPTIONS = [10, 30, 50, 100];

export default function CarregamentoList() {
  const { languageGB } = useLanguage();
  const navigate = useNavigate();
  const { can } = usePermissions();
  const text = languageGB.carregamentos.charge;

  const canView = can('charge_view');
  const canEdit = can('charge_edit');
  const canDelete = can('charge_delete');

  const defaultQueryOptions = useMemo(
    () => ({
      pageSize: 10,
      storageKey: 'OperacionalCarregamento' + queryKey.carregamentos.charges,
    }),
    []
  );

  const { paginatedQuery, handlePaginatedQuery, handleFilterChange, handleResetFilter } =
    userPaginatedQuery<ChargeFilterForm>(defaultQueryOptions);

  // ---- Estado de filtro (drawer) ------------------------------------------
  const { open: isFilterOpen, onOpen: onOpenFilter, onClose: onCloseFilter } = useDisclosure();

  // `*_label` são companions DISPLAY-ONLY de re-hidratação dos
  // `SelectAsyncPaginate`, nunca contam como filtro aplicado (mesma regra de
  // `Romaneios/index.tsx`).
  const filtersApplied = useMemo(
    () =>
      Object.entries(paginatedQuery.filter ?? {})
        .filter(([key]) => !key.endsWith('_label'))
        .filter(([, v]) => v !== undefined && v !== null && v !== '').length,
    [paginatedQuery.filter]
  );

  const chargesList = useChargesList({
    paginatedQuery,
    setPaginatedQuery: handlePaginatedQuery,
    filter: paginatedQuery.filter ?? undefined,
  });

  // ---- Estado de exclusão --------------------------------------------------
  const queryClient = useQueryClient();
  const [toDelete, setToDelete] = useState<ChargeListItem | null>(null);
  const {
    open: isOpenDeleteDialog,
    onOpen: onOpenDeleteDialog,
    onClose: onCloseDeleteDialog,
  } = useDisclosure();

  const deleteMutation = useMutation({
    mutationFn: async (uuid: string) => deleteCharge(uuid),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [queryKey.carregamentos.charges] });

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

  function handleDeleteClick(item: ChargeListItem) {
    setToDelete(item);
    onOpenDeleteDialog();
  }

  function handleConfirmDelete() {
    if (toDelete) {
      deleteMutation.mutate(toDelete.uuid);
    }
  }

  // ---- Diálogo "Gerar Romaneio" (AM-07, TASK-FE-CG-05) ---------------------
  const [chargeToTransfer, setChargeToTransfer] = useState<ChargeListItem | null>(null);
  const {
    open: isTransferDialogOpen,
    onOpen: onOpenTransferDialog,
    onClose: onCloseTransferDialog,
  } = useDisclosure();

  function handleGenerateTransferClick(item: ChargeListItem) {
    setChargeToTransfer(item);
    onOpenTransferDialog();
  }

  // ---- Modal "Documentos" (AM-03, TASK-FE-CG-06) ---------------------------
  const [chargeForDocuments, setChargeForDocuments] = useState<ChargeListItem | null>(null);
  const {
    open: isDocumentsModalOpen,
    onOpen: onOpenDocumentsModal,
    onClose: onCloseDocumentsModal,
  } = useDisclosure();

  function handleOpenDocumentsClick(item: ChargeListItem) {
    setChargeForDocuments(item);
    onOpenDocumentsModal();
  }

  const columnHelper = createColumnHelper<ChargeListItem>();
  const defaultColumns = useMemo(
    () => [
      columnHelper.accessor('status', {
        header: text.list.table.status,
        cell: ({ row }) => (
          <Badge colorPalette={chargeStatusColorPalette[row.original.status]} variant="subtle">
            {row.original.status_label}
          </Badge>
        ),
        meta: styleColumTable.sm,
      }),
      columnHelper.accessor('number_charge', {
        header: text.list.table.code,
        cell: ({ row }) => <Text fontWeight="medium">{row.original.number_charge}</Text>,
        meta: styleColumTable.sm,
      }),
      columnHelper.accessor('dt_charge', {
        header: text.list.table.dtCharge,
        cell: ({ row }) => <Text fontSize="sm">{formatDate(row.original.dt_charge)}</Text>,
        meta: styleColumTable.date,
      }),
      columnHelper.display({
        id: 'responsible',
        header: text.list.table.responsible,
        cell: ({ row }) => <Text lineClamp="1">{row.original.user?.label ?? '—'}</Text>,
      }),
      columnHelper.accessor('driver_name', {
        header: text.list.table.driver,
        cell: ({ row }) => <Text lineClamp="1">{row.original.driver_name || '—'}</Text>,
      }),
      columnHelper.accessor('items_sum_quantity', {
        header: text.list.table.quantityForeseen,
        cell: ({ row }) => (
          <Text fontSize="sm">
            {row.original.items_sum_quantity != null
              ? row.original.items_sum_quantity.toLocaleString('pt-BR')
              : '—'}
          </Text>
        ),
        meta: styleColumTable.sm,
      }),
      columnHelper.accessor('items_sum_quantity_real', {
        header: text.list.table.quantityReal,
        cell: ({ row }) => (
          <Text fontSize="sm">
            {row.original.items_sum_quantity_real != null
              ? row.original.items_sum_quantity_real.toLocaleString('pt-BR')
              : '—'}
          </Text>
        ),
        meta: styleColumTable.sm,
      }),
      columnHelper.display({
        id: 'total',
        header: text.list.table.total,
        cell: ({ row }) => {
          // LM-09 do contrato legado — `total_real ?? total`.
          const value = row.original.total_real ?? row.original.total;
          return (
            <Text fontSize="sm">
              {value != null
                ? value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
                : '—'}
            </Text>
          );
        },
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
              <ChargeActionsMenu
                canView={canView}
                canEdit={canEdit}
                canDelete={canDelete}
                isDeletable={item.status === 'pendente'}
                isDeleting={isDeleting}
                isFinishable={item.status === 'pendente'}
                isTransferable={item.status === 'finalizada'}
                labels={{
                  view: text.list.actions.view,
                  edit: text.list.actions.edit,
                  delete: text.list.actions.delete,
                  documents: text.list.actions.documents,
                  finish: text.list.actions.finish,
                  transfer: text.list.actions.transfer,
                  print: text.list.actions.print,
                  deleteDisabledTooltip: text.list.actions.deleteDisabledTooltip,
                  finishDisabledTooltip: text.list.actions.finishDisabledTooltip,
                  transferDisabledTooltip: text.list.actions.transferDisabledTooltip,
                  comingSoonTooltip: text.list.actions.comingSoonTooltip,
                }}
                onEditOrView={() => navigate(`/operacional/carregamento/${item.uuid}`)}
                onDelete={() => handleDeleteClick(item)}
                onFinish={() => navigate(`/operacional/carregamento/${item.uuid}/finalizar`)}
                onGenerateTransfer={() => handleGenerateTransferClick(item)}
                onOpenDocuments={() => handleOpenDocumentsClick(item)}
              />
            </Flex>
          );
        },
        meta: styleColumTable.sm,
      }),
    ],
    [navigate, isDeleting, text, languageGB, canView, canEdit, canDelete]
  );

  const isLoading = checkLoadingStatus([chargesList]);
  const items = chargesList.data?.data?.items;
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
            />
          }
        >
          <PageHeader title={text.list.pageTitle} description={text.list.pageSubtitle} />
        </HeaderGrid>

        <Box mt={6}>
          <Table
            isLoading={isLoading}
            pageSizeOptions={PAGE_SIZE_OPTIONS}
            isError={chargesList.isError}
            error={chargesList.error}
            isEmpty={isEmpty}
            onRetry={() => chargesList.refetch()}
            isRetrying={chargesList.isFetching}
            retryLabel={text.list.error.retry}
            emptyIcon={FiTruck as ElementType}
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
            canCreate={filtersApplied === 0 && can('charge_create')}
            createLabel={text.list.emptyState.cta}
            onCreate={() => navigate('/operacional/carregamento/novo')}
          />
        </Box>
      </TableProvider>

      <FilterSideCharge
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
            ? text.deleteDialog.descriptionTemplate.replace(
                '{code}',
                String(toDelete.number_charge)
              )
            : undefined
        }
        hideQuestionMark
        tone="danger"
      />

      <GenerateTransferDialog
        isOpen={isTransferDialogOpen}
        onClose={() => {
          onCloseTransferDialog();
          setChargeToTransfer(null);
        }}
        charge={chargeToTransfer}
        languageGB={languageGB}
      />

      <ChargeDocumentsModal
        isOpen={isDocumentsModalOpen}
        onClose={() => {
          onCloseDocumentsModal();
          setChargeForDocuments(null);
        }}
        chargeUuid={chargeForDocuments?.uuid ?? null}
        chargeCode={chargeForDocuments?.number_charge}
        canEdit={canEdit}
      />
    </ContainerGrid>
  );
}
