// src/pages/Administrativo/Adiantamento/index.tsx
// -----------------------------------------------------------------------------
// Tela de LISTAGEM (grid) de ADIANTAMENTO SALARIAL — Administrativo.
// Rota: /administrativo/adiantamento (guarda `advances_view`).
// TASK-FE-adiant-salarial (97-Esteiras/034).
//
// UX-GAP declarado (FID-G3F §1): sem tela desenhada no `ux_root` para
// Adiantamento Salarial — decisão do dono = seguir-pelo-padrão. Mirror
// estrutural de `CadastrosBase/CicloProducao/index.tsx` (grid+detalhe+
// clique-na-linha+delete), acrescido do drawer de filtro (Contrato B) —
// mirror `Financeiro/Contrato/index.tsx` (ButtonFilter + FilterSide, único
// filtro real do backend: `employee_uuid`).
//
// Colunas (FID-G3F §3.1/FE-GRID-COLS): funcionário, evento, data, valor
// (moeda pt-BR). `amount` chega `decimal:2` cru como STRING do
// `AdvanceResource` — sempre `Number(...)` antes de formatar (mesma nota já
// registrada em `Financeiro/Contrato/index.tsx` para o caso inverso).
// -----------------------------------------------------------------------------

import { useEffect, useMemo, useState, type ElementType } from 'react';

import { Box, Flex, Icon, Text, useDisclosure } from '@chakra-ui/react';
import { createColumnHelper } from '@tanstack/react-table';
import { FiEdit, FiEye, FiRefreshCw, FiTrash2 } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';

import { Actions } from '@/components/Action';
import { ButtonFilter } from '@/components/ButtonFilter';
import { ContainerGrid } from '@/components/ContainerGrid';
import { DeleteConfirmDialog } from '@/components/DeleteConfirmDialog';
import { HeaderGrid } from '@/components/HeaderGrid';
import { Table } from '@/components/Table';

import { TableProvider } from '@/contexts/TableContext';

import { useLanguage } from '@/hooks/useLanguage';
import { userPaginatedQuery } from '@/hooks/usePaginatedQueryStorage';
import { usePermissions } from '@/hooks/usePermissions';
import { useRequest } from '@/hooks/useRequest';
import { useTable } from '@/hooks/useTable';

import { checkLoadingStatus } from '@/utils/checkLoadingStatus';
import formatDate from '@/utils/formatDate';
import { styleColumTable } from '@/utils/style-colum-table';

import { queryKey } from '@/constants/query-key';

import { deleteAdvance } from '@/services/v2/Advances/advance-service';

import type { Advance, AdvanceFilterForm } from '@/@types/v2/Advances';

import { FilterSideAdiantamento } from './FilterSideAdiantamento';
import { HeaderTable } from './HeaderTable';
import { useAdvancesList } from './useAdvances';

import { PageHeader } from '@/components/ui/PageHeader';

// `amount` chega `decimal:2` cru como STRING do `AdvanceResource` — sempre
// `Number(...)` antes de formatar (nunca `MoneyInput`, essa é só a coluna de
// EXIBIÇÃO da grid).
function formatCurrencyBRL(value: number | string): string {
  return Number(value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

// Clique na linha (fora da coluna de ações) navega para o Detalhe — mesmo
// mecanismo de `RowClickToDetail` de CicloProducao/index.tsx (precisa estar
// DENTRO do `<TableProvider>` para ler `useTable()`).
function RowClickToDetail() {
  const navigate = useNavigate();
  const { table } = useTable();

  useEffect(() => {
    const selected = table?.getSelectedRowModel()?.rows[0]?.original as Advance | undefined;
    if (selected?.uuid) {
      navigate(`/administrativo/adiantamento/${selected.uuid}/detalhe`);
    }
  }, [table?.getSelectedRowModel()?.rows[0]?.original]);

  return null;
}

export default function AdiantamentoList() {
  const { languageGB } = useLanguage();
  const navigate = useNavigate();
  const { can } = usePermissions();
  const text = languageGB.advances.advance;

  const canCreate = can('advances_create');
  const canEdit = can('advances_edit');
  const canDelete = can('advances_delete');

  const defaultQueryOptions = useMemo(
    () => ({
      pageSize: 10,
      storageKey: 'AdministrativoAdiantamento' + queryKey.advances.advances,
    }),
    []
  );

  const { paginatedQuery, handlePaginatedQuery, handleFilterChange, handleResetFilter } =
    userPaginatedQuery<AdvanceFilterForm>(defaultQueryOptions);

  // ---- Estado de filtro (drawer) ------------------------------------------
  const { open: isFilterOpen, onOpen: onOpenFilter, onClose: onCloseFilter } = useDisclosure();

  const filtersApplied = useMemo(
    () =>
      Object.values(paginatedQuery.filter ?? {}).filter(
        (v) => v !== undefined && v !== null && v !== ''
      ).length,
    [paginatedQuery.filter]
  );

  // ---- Estado de exclusão --------------------------------------------------
  const [toDelete, setToDelete] = useState<Advance | null>(null);
  const {
    open: isOpenDeleteDialog,
    onOpen: onOpenDeleteDialog,
    onClose: onCloseDeleteDialog,
  } = useDisclosure();

  const advancesList = useAdvancesList({
    paginatedQuery,
    setPaginatedQuery: handlePaginatedQuery,
    filter: paginatedQuery.filter,
  });

  const deleteMutation = useRequest({
    asyncFunction: async ({ advanceUuid }: { advanceUuid: string }) => {
      return await deleteAdvance(advanceUuid);
    },
    queryKey: queryKey.advances.advances,
    queryKey2: queryKey.advances.advance,
    // `useRequest` não tem variante "delete" (mesma observação de
    // CicloProducao/Contrato) — o texto do toast vem de `personalizedMessage`.
    typesRequest: 'update',
    entityName: text.singularLabel,
    personalizedMessage: text.list.deletedToast,
    actionSuccess: () => {
      onCloseDeleteDialog();
      setToDelete(null);
    },
  });

  const handleDeleteClick = (advance: Advance) => {
    setToDelete(advance);
    onOpenDeleteDialog();
  };

  const handleConfirmDelete = () => {
    if (toDelete) {
      deleteMutation.mutate({ advanceUuid: toDelete.uuid });
    }
  };

  const isDeleting = deleteMutation.isPending;

  const columnHelper = createColumnHelper<Advance>();
  const defaultColumns = useMemo(
    () => [
      columnHelper.display({
        id: 'employee',
        header: text.list.table.employee,
        cell: ({ row }) => (
          <Text fontWeight="medium" lineClamp="1">
            {row.original.employee?.name ?? '—'}
          </Text>
        ),
        meta: styleColumTable.md,
      }),
      columnHelper.display({
        id: 'event',
        header: text.list.table.event,
        cell: ({ row }) => (
          <Text fontSize="sm" color="fg.muted" lineClamp="1">
            {row.original.event?.name ?? '—'}
          </Text>
        ),
        meta: styleColumTable.md,
      }),
      columnHelper.accessor('date', {
        header: text.list.table.date,
        cell: ({ row }) => (
          <Text fontSize="sm" color="fg.muted">
            {formatDate(row.original.date)}
          </Text>
        ),
        meta: styleColumTable.date,
      }),
      columnHelper.accessor('amount', {
        header: text.list.table.amount,
        cell: ({ row }) => (
          <Text
            fontSize="sm"
            fontWeight="medium"
            textAlign="right"
            fontVariantNumeric="tabular-nums"
          >
            {formatCurrencyBRL(row.original.amount)}
          </Text>
        ),
        meta: styleColumTable.md,
      }),
      columnHelper.display({
        id: 'acoes',
        header: '',
        cell: ({ row }) => (
          <Flex justify="flex-end">
            <Actions size="sm">
              <Actions.Item
                icon={<Icon as={FiEye} />}
                onClick={() =>
                  navigate(`/administrativo/adiantamento/${row.original.uuid}/detalhe`)
                }
              >
                {text.list.actions.view}
              </Actions.Item>
              {canEdit && (
                <Actions.Item
                  icon={<Icon as={FiEdit} />}
                  onClick={() => navigate(`/administrativo/adiantamento/${row.original.uuid}`)}
                >
                  {text.list.actions.edit}
                </Actions.Item>
              )}
              {canDelete && (
                <Actions.Item
                  icon={<Icon as={FiTrash2} />}
                  onClick={() => handleDeleteClick(row.original)}
                  color="red.400"
                  disabled={isDeleting}
                >
                  {text.list.actions.delete}
                </Actions.Item>
              )}
            </Actions>
          </Flex>
        ),
        meta: styleColumTable.sm,
      }),
    ],
    [navigate, isDeleting, text, canEdit, canDelete]
  );

  const isLoading = checkLoadingStatus([advancesList]);
  const items = advancesList.data?.data?.items;
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
        <RowClickToDetail />

        <HeaderGrid
          header={
            <>
              <HeaderTable languageGB={languageGB} />
              <ButtonFilter filtersApplied={filtersApplied} onClick={onOpenFilter} />
            </>
          }
        >
          <PageHeader title={text.list.pageTitle} description={text.list.pageSubtitle} />
        </HeaderGrid>

        <Box mt={6}>
          <Table
            isLoading={isLoading}
            isError={advancesList.isError}
            error={advancesList.error}
            isEmpty={isEmpty}
            onRetry={() => advancesList.refetch()}
            isRetrying={advancesList.isFetching}
            emptyIcon={FiRefreshCw as ElementType}
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
            onCreate={() => navigate('/administrativo/adiantamento/novo')}
          />
        </Box>
      </TableProvider>

      <FilterSideAdiantamento
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
        itemName={toDelete?.employee?.name ?? undefined}
      />
    </ContainerGrid>
  );
}
