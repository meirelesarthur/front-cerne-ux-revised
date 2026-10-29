// src/pages/Operacional/Appropriations/index.tsx
// -----------------------------------------------------------------------------
// Tela de LISTAGEM (grid) de Apontamentos (Appropriation) — TASK-FE-2706.
// Domínio PRÓPRIO (`Operacional`, URL `/operacional/apontamentos`, mirror
// `Administrativo/Funcoes`/`Financeiro/MercadoPago` — não `BaseRegistrations`,
// ver `TASK-FE-2713`).
//
// ⚠️ CORREÇÃO DE E2E DO DONO (pós-TASK-FE-2706) SOBRE A EXCEÇÃO ANTERIOR —
// a decisão documentada aqui dizia "Visualizar / Voltar Status / Excluir"
// (SEM "Editar" na linha). Revisado: o menu de ações por linha replica 1:1 o
// dropdown de `appropriations/index.blade.php` do legado —
// Visualizar (sempre, `appropriations_view`) → Editar + Finalizar (só status
// `O`/Aberto, `appropriations_edit`) → Apropriar (só status `F`/Finalizado,
// `appropriations_edit`) → Voltar Status (status ≠ `O`, `appropriations_edit`)
// → Excluir (sempre, `appropriations_delete`, SEM guarda de status — mirror
// exato do legado, que também não guarda o botão de excluir por status).
// Editar/Finalizar/Apropriar fiam a ação à MESMA rota já usada pelo Form
// (`/operacional/apontamentos/{uuid}`, `/apropriar`, `/finalizar`) — TASK-FE-715
// (execução 034) trocou o antigo `DeleteConfirmDialog` + `useFinishAppropriation`
// inline de "Finalizar" por navegação para a tela dedicada de Finalização
// (`FinishAppropriation.tsx`), mirror exato de "Apropriar".
//
// ⚠️ Coluna "Dt. Criação" (especificação visual) OMITIDA — `AppropriationResource`
// (leitura direta do backend) NÃO expõe `created_at` no `toArray()` (só
// `uuid/code/status*/date/description/used_area/area/activity/operation/
// cultivation/harvest/warehouse_production/employee/user`); SEM MOCK, não
// inventar a coluna sem o dado real. Reportado como observação ao Tester.
// -----------------------------------------------------------------------------

import { useMemo, useState } from 'react';
import type { ElementType } from 'react';

import { Box, Flex, Icon, Text, useDisclosure } from '@chakra-ui/react';
import { createColumnHelper } from '@tanstack/react-table';
import {
  FiCheckCircle,
  FiEdit,
  FiEye,
  FiPenTool,
  FiPieChart,
  FiRotateCcw,
  FiTrash2,
} from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';

import { Actions } from '@/components/Action';
import { ContainerGrid } from '@/components/ContainerGrid';
import { DeleteConfirmDialog } from '@/components/DeleteConfirmDialog';
import { HeaderGrid } from '@/components/HeaderGrid';
import { Table } from '@/components/Table';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatusTag } from '@/components/ui/StatusTag';

import { TableProvider } from '@/contexts/TableContext';

import { useGridSettings } from '@/hooks/useGridSettings';
import { useGridStorageScope } from '@/hooks/useGridStorageScope';
import { useLanguage } from '@/hooks/useLanguage';
import { userPaginatedQuery } from '@/hooks/usePaginatedQueryStorage';
import { usePermissions } from '@/hooks/usePermissions';
import { useRequest } from '@/hooks/useRequest';

import { checkLoadingStatus } from '@/utils/checkLoadingStatus';
import { styleColumTable } from '@/utils/style-colum-table';

import { queryKey } from '@/constants/query-key';

import { deleteAppropriation } from '@/services/v2/Appropriations/appropriation-service';

import type { AppropriationFilterForm, AppropriationListItem } from '@/@types/v2/Appropriations';

import { APPROPRIATION_STATUS_META } from './appropriationStatus';
import { FilterSideAppropriations } from './FilterSideAppropriations';
import { HeaderTable } from './HeaderTable';
import { RevertAppropriationStatusModal } from './RevertAppropriationStatusModal';
import { useAppropriationsList } from './useAppropriations';

const APPROPRIATIONS_STORAGE_KEY =
  'OperacionalAppropriations' + queryKey.appropriations.appropriations;

export default function AppropriationsList() {
  const { languageGB } = useLanguage();
  const navigate = useNavigate();
  const { can } = usePermissions();
  const text = languageGB.appropriations.appropriation;

  const canCreate = can('appropriations_create');
  const canView = can('appropriations_view');
  const canDelete = can('appropriations_delete');
  const canEdit = can('appropriations_edit');

  const defaultQueryOptions = useMemo(
    () => ({ pageSize: 10, storageKey: APPROPRIATIONS_STORAGE_KEY }),
    []
  );

  const { paginatedQuery, handlePaginatedQuery, handleFilterChange, handleResetFilter } =
    userPaginatedQuery<AppropriationFilterForm>(defaultQueryOptions);

  const { open: isFilterOpen, onOpen: onOpenFilter, onClose: onCloseFilter } = useDisclosure();

  const filtersApplied = useMemo(
    () =>
      Object.values(paginatedQuery.filter ?? {}).filter(
        (v) => v !== undefined && v !== null && v !== ''
      ).length,
    [paginatedQuery.filter]
  );

  const [toDelete, setToDelete] = useState<AppropriationListItem | null>(null);
  const {
    open: isOpenDeleteDialog,
    onOpen: onOpenDeleteDialog,
    onClose: onCloseDeleteDialog,
  } = useDisclosure();

  const [toRevert, setToRevert] = useState<AppropriationListItem | null>(null);
  const {
    open: isOpenRevertModal,
    onOpen: onOpenRevertModal,
    onClose: onCloseRevertModal,
  } = useDisclosure();

  const appropriationsList = useAppropriationsList({
    paginatedQuery,
    setPaginatedQuery: handlePaginatedQuery,
    filter: paginatedQuery.filter ?? undefined,
  });

  const deleteMutation = useRequest({
    asyncFunction: async ({ appropriationUuid }: { appropriationUuid: string }) => {
      return await deleteAppropriation(appropriationUuid);
    },
    queryKey: queryKey.appropriations.appropriations,
    queryKey2: queryKey.appropriations.appropriation,
    typesRequest: 'update',
    entityName: text.singularLabel,
    personalizedMessage: text.list.deletedToast,
    actionSuccess: () => {
      onCloseDeleteDialog();
      setToDelete(null);
    },
  });

  const isDeleting = deleteMutation.isPending;

  function handleDeleteClick(appropriation: AppropriationListItem) {
    setToDelete(appropriation);
    onOpenDeleteDialog();
  }

  function handleConfirmDelete() {
    if (toDelete) {
      deleteMutation.mutate({ appropriationUuid: toDelete.uuid });
    }
  }

  function handleRevertStatusClick(appropriation: AppropriationListItem) {
    setToRevert(appropriation);
    onOpenRevertModal();
  }

  // "Finalizar" (O → F) direto da linha — TASK-FE-715: deixou de abrir o
  // `DeleteConfirmDialog` genérico + `useFinishAppropriation` inline; navega
  // para a tela dedicada de Finalização (mirror "Apropriar", mesma linha
  // abaixo). SEM guarda de status própria além da visibilidade do item
  // (mirror legado — D6/D7/D10).
  function handleFinishClick(appropriation: AppropriationListItem) {
    navigate(`/operacional/apontamentos/${appropriation.uuid}/finalizar`);
  }

  const columnHelper = createColumnHelper<AppropriationListItem>();
  const defaultColumns = useMemo(
    () => [
      columnHelper.accessor('status', {
        header: languageGB.defaltStrings.statusColumn,
        enableHiding: false,
        cell: ({ row }) => (
          <StatusTag
            label={row.original.status_label}
            color={APPROPRIATION_STATUS_META[row.original.status].badgeColor}
          />
        ),
        meta: { ...styleColumTable.md, gridLabel: languageGB.defaltStrings.statusColumn },
      }),
      columnHelper.accessor('code', {
        header: text.list.table.code,
        cell: ({ row }) => (
          <Text fontFamily="mono" fontSize="sm" fontWeight="medium">
            {row.original.code}
          </Text>
        ),
        meta: { ...styleColumTable.sm, gridLabel: text.list.table.code },
      }),
      columnHelper.accessor((row) => row.area?.description ?? '', {
        id: 'area',
        header: text.list.table.area,
        cell: ({ row }) => <Text fontSize="sm">{row.original.area?.description ?? '—'}</Text>,
        meta: { gridLabel: text.list.table.area },
      }),
      columnHelper.accessor('description', {
        header: text.list.table.description,
        cell: ({ row }) => (
          <Text fontSize="sm" lineClamp="1">
            {row.original.description || '—'}
          </Text>
        ),
        meta: { gridLabel: text.list.table.description },
      }),
      columnHelper.accessor('date', {
        header: text.list.table.date,
        cell: ({ row }) => <Text fontSize="sm">{row.original.date}</Text>,
        meta: { ...styleColumTable.date, gridLabel: text.list.table.date },
      }),
      columnHelper.accessor((row) => row.employee?.name ?? row.user?.name ?? '', {
        id: 'requester',
        header: text.list.table.requester,
        cell: ({ row }) => (
          <Text fontSize="sm">{row.original.employee?.name ?? row.original.user?.name ?? '—'}</Text>
        ),
        meta: { gridLabel: text.list.table.requester },
      }),
      columnHelper.display({
        id: 'acoes',
        header: '',
        enableHiding: false,
        cell: ({ row }) => {
          const nextStatus = APPROPRIATION_STATUS_META[row.original.status].nextStatusOnRevert;
          // Máquina de estados O→F→A — mirror EXATO do dropdown do legado
          // (`appropriations/index.blade.php`): Editar/Finalizar só em
          // Aberto; Apropriar só em Finalizado; Voltar Status em qualquer
          // status ≠ Aberto (já coberto por `nextStatus`). SEM guarda de
          // permissão própria alem de `appropriations_edit` — mesma gate do
          // legado (`@can('appropriations_edit')`) para as 4 transições.
          const canEditRow = canEdit && row.original.status === 'O';
          const canAppropriateRow = canEdit && row.original.status === 'F';
          return (
            <Flex justify="flex-end">
              <Actions size="sm">
                {canView && (
                  <Actions.Item
                    icon={<Icon as={FiEye} />}
                    onClick={() =>
                      navigate(`/operacional/apontamentos/${row.original.uuid}/detalhe`)
                    }
                  >
                    {text.list.actions.view}
                  </Actions.Item>
                )}
                {canEditRow && (
                  <Actions.Item
                    icon={<Icon as={FiEdit} />}
                    onClick={() => navigate(`/operacional/apontamentos/${row.original.uuid}`)}
                  >
                    {text.list.actions.edit}
                  </Actions.Item>
                )}
                {canEditRow && (
                  <Actions.Item
                    icon={<Icon as={FiCheckCircle} />}
                    onClick={() => handleFinishClick(row.original)}
                  >
                    {text.list.actions.finish}
                  </Actions.Item>
                )}
                {canAppropriateRow && (
                  <Actions.Item
                    icon={<Icon as={FiPieChart} />}
                    onClick={() =>
                      navigate(`/operacional/apontamentos/${row.original.uuid}/apropriar`)
                    }
                  >
                    {text.list.actions.appropriate}
                  </Actions.Item>
                )}
                {canEdit && nextStatus && (
                  <Actions.Item
                    icon={<Icon as={FiRotateCcw} />}
                    onClick={() => handleRevertStatusClick(row.original)}
                  >
                    {text.list.actions.revertStatus}
                  </Actions.Item>
                )}
                {canDelete && (
                  <>
                    <Actions.Separator />
                    <Actions.Item
                      icon={<Icon as={FiTrash2} />}
                      onClick={() => handleDeleteClick(row.original)}
                      tone="danger"
                      disabled={isDeleting}
                    >
                      {text.list.actions.delete}
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
    [navigate, isDeleting, canView, canEdit, canDelete, text, languageGB]
  );

  const gridSettings = useGridSettings<AppropriationListItem>({
    storageKey: APPROPRIATIONS_STORAGE_KEY,
    storageScope: useGridStorageScope(),
    columns: defaultColumns,
  });
  const { columnOrder, setColumnOrder, columnVisibility, setColumnVisibility } = gridSettings;

  const isLoading = checkLoadingStatus([appropriationsList]);
  const items = appropriationsList.data?.data?.items;
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
            <HeaderTable
              onOpenFilter={onOpenFilter}
              filtersApplied={filtersApplied}
              languageGB={languageGB}
              canCreate={canCreate}
              onCreate={() => navigate('/operacional/apontamentos/novo')}
              gridSettings={gridSettings}
            />
          }
        >
          <PageHeader title={text.list.pageTitle} description={text.list.pageSubtitle} />
        </HeaderGrid>

        <Box mt={6}>
          <Table
            isLoading={isLoading}
            isError={appropriationsList.isError}
            error={appropriationsList.error}
            isEmpty={isEmpty}
            onRetry={() => appropriationsList.refetch()}
            isRetrying={appropriationsList.isFetching}
            emptyIcon={FiPenTool as ElementType}
            emptyTitle={
              filtersApplied > 0 ? text.list.emptyState.titleFiltered : text.list.emptyState.title
            }
            emptyDescription={
              filtersApplied > 0
                ? text.list.emptyState.descriptionFiltered
                : text.list.emptyState.description
            }
            canCreate={filtersApplied === 0 && canCreate}
            createLabel={text.list.emptyState.cta}
            onCreate={() => navigate('/operacional/apontamentos/novo')}
          />
        </Box>
      </TableProvider>

      <FilterSideAppropriations
        isOpen={isFilterOpen}
        onClose={onCloseFilter}
        handleFilterChange={handleFilterChange}
        handleReset={handleResetFilter}
        filter={paginatedQuery.filter}
        languageGB={languageGB}
        filtersApplied={filtersApplied}
      />

      <RevertAppropriationStatusModal
        isOpen={isOpenRevertModal}
        onClose={() => {
          onCloseRevertModal();
          setToRevert(null);
        }}
        appropriationUuid={toRevert?.uuid}
        currentStatus={toRevert?.status}
        onSuccess={() => setToRevert(null)}
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
