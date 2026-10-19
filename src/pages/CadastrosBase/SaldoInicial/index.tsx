// src/pages/CadastrosBase/SaldoInicial/index.tsx
// -----------------------------------------------------------------------------
// Tela de LISTAGEM (grid) de SALDO INICIAL (OpenMovement) — Cadastros Base /
// Financeiros, execução 031, TASK-FE-031-36. Rota:
// /cadastros-base/saldo-inicial (guardada por `open-movements_view`, wiring
// real da rota é TASK-FE-031-38 — este arquivo não mexe em rota/menu).
//
// Mirror estrutural do padrão canônico mais recente
// (`BaseRegistrations/DiagnosisPregnancy/index.tsx` — `useCustomGridQuery`
// inline, sem hook local, regra 5 do protocolo v2) + `GridSettings`
// (`useGridSettings`/`GridSettingsFloatingPanel`, mirror `CentroCusto/index.tsx`,
// regra 8 do protocolo). `per_page` inicial = 10 (instrução explícita do
// dono, contrato §7 — diverge do default geral 15/30 de outras telas, NÃO é
// para "corrigir").
//
// Ações de linha: SÓ Visualizar (navega para `/detalhe`) e Excluir (gated
// `open-movements_delete`) — SEM Editar (contrato §2, veredito do legado:
// Saldo Inicial nunca teve edição). Sem coluna/filtro de Status Ativo/
// Inativo — `Movement` não tem esse campo (regra global 4 do protocolo não
// se aplica; ausência de campo na fonte, não violação).
// -----------------------------------------------------------------------------

import { ElementType, useMemo, useState } from 'react';

import { Box, Flex, Icon, Text, useDisclosure, VStack } from '@chakra-ui/react';
import { createColumnHelper } from '@tanstack/react-table';
import { FiDollarSign, FiEye, FiTrash2 } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';

import { Actions } from '@/components/Action';
import { ContainerGrid } from '@/components/ContainerGrid';
import { DeleteConfirmDialog } from '@/components/DeleteConfirmDialog';
import { HeaderGrid } from '@/components/HeaderGrid';
import { Table } from '@/components/Table';

import { TableProvider } from '@/contexts/TableContext';

import { useCustomGridQuery } from '@/hooks/useCustomGridQuery';
import { useGridSettings } from '@/hooks/useGridSettings';
import { useGridStorageScope } from '@/hooks/useGridStorageScope';
import { useLanguage } from '@/hooks/useLanguage';
import { userPaginatedQuery } from '@/hooks/usePaginatedQueryStorage';
import { usePermissions } from '@/hooks/usePermissions';
import { useRequest } from '@/hooks/useRequest';

import { checkLoadingStatus } from '@/utils/checkLoadingStatus';
import { styleColumTable } from '@/utils/style-colum-table';

import { queryKey } from '@/constants/query-key';

import {
  deleteOpenMovement,
  listOpenMovements,
} from '@/services/v2/OpenMovements/open-movement-service';
import type { ListOpenMovementsParams } from '@/services/v2/OpenMovements/open-movement-service';

import type { OpenMovementFilterForm, OpenMovementListItem } from '@/@types/v2/OpenMovements';

import { FilterSideSaldoInicial } from './FilterSideSaldoInicial';
import { HeaderTable } from './HeaderTable';

// Chave de storage desta tela — paginação (`userPaginatedQuery`) e
// personalização de grid (`useGridSettings`) derivam da MESMA expressão
// (mirror `CENTRO_CUSTO_STORAGE_KEY`, DEC-007 §12).
const SALDO_INICIAL_STORAGE_KEY = 'CadastrosBaseSaldoInicial' + queryKey.openMovements.list;

function formatCurrencyBRL(value: number | string): string {
  return Number(value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

// Achatamento `OpenMovementFilterForm` (persistido, com `*_label` companion)
// → `ListOpenMovementsParams` (querystring real de `GET /open-movements`) —
// mirror `EstoqueInicial/index.tsx` (`toRequestFilter`). `*_label` nunca é
// enviado à API, só existe para re-hidratar o drawer.
function toRequestFilter(filter?: OpenMovementFilterForm | null): ListOpenMovementsParams {
  return {
    start_date: filter?.start_date || undefined,
    end_date: filter?.end_date || undefined,
    account_uuid: filter?.account_uuid || undefined,
    proprietary_uuid: filter?.proprietary_uuid || undefined,
  };
}

export default function SaldoInicialList() {
  const { languageGB } = useLanguage();
  const navigate = useNavigate();
  const { can } = usePermissions();
  const text = languageGB.openMovements.openMovement;

  const canCreate = can('open-movements_create');
  const canDelete = can('open-movements_delete');

  const defaultQueryOptions = useMemo(
    () => ({
      pageSize: 10,
      storageKey: SALDO_INICIAL_STORAGE_KEY,
    }),
    []
  );

  const { paginatedQuery, handlePaginatedQuery, handleFilterChange, handleResetFilter } =
    userPaginatedQuery<OpenMovementFilterForm>(defaultQueryOptions);

  // ---- Estado de filtro (drawer) ------------------------------------------
  const { open: isFilterOpen, onOpen: onOpenFilter, onClose: onCloseFilter } = useDisclosure();

  const filtersApplied = useMemo(
    () =>
      Object.entries(paginatedQuery.filter ?? {})
        // Chaves `*_label` são DISPLAY-ONLY (re-hidratação do drawer) — não
        // devem inflar o badge "Filtros(N)" (mirror `EstoqueInicial/index.tsx`).
        .filter(([key]) => !key.endsWith('_label'))
        .map(([, v]) => v)
        .filter((v) => v !== undefined && v !== null && v !== '').length,
    [paginatedQuery.filter]
  );

  const requestFilter = useMemo(
    () => toRequestFilter(paginatedQuery.filter),
    [paginatedQuery.filter]
  );

  // ---- Estado de exclusão --------------------------------------------------
  const [toDelete, setToDelete] = useState<OpenMovementListItem | null>(null);
  const {
    open: isOpenDeleteDialog,
    onOpen: onOpenDeleteDialog,
    onClose: onCloseDeleteDialog,
  } = useDisclosure();

  const openMovementsList = useCustomGridQuery<OpenMovementListItem, ListOpenMovementsParams>({
    asyncFunction: listOpenMovements,
    queryKey: queryKey.openMovements.list,
    paginatedQuery,
    setPaginatedQuery: handlePaginatedQuery,
    filterQuery: [],
    filter: requestFilter,
  });

  const deleteMutation = useRequest({
    asyncFunction: async ({ openMovementUuid }: { openMovementUuid: string }) => {
      return await deleteOpenMovement(openMovementUuid);
    },
    queryKey: queryKey.openMovements.list,
    queryKey2: queryKey.openMovements.detail,
    // `useRequest`'s TypesRequest não tem variante "delete" (mirror
    // `CentroCusto/index.tsx`/`DiagnosisPregnancy/index.tsx` — "update" é a
    // convenção já usada para a mesma operação; o texto exibido vem de
    // `personalizedMessage`, o rótulo genérico de "update" nunca aparece).
    typesRequest: 'update',
    entityName: text.singularLabel,
    personalizedMessage: text.list.deletedToast,
    actionSuccess: () => {
      onCloseDeleteDialog();
      setToDelete(null);
    },
  });

  const handleDeleteClick = (openMovement: OpenMovementListItem) => {
    setToDelete(openMovement);
    onOpenDeleteDialog();
  };

  const handleConfirmDelete = () => {
    if (toDelete) {
      deleteMutation.mutate({ openMovementUuid: toDelete.uuid });
    }
  };

  const isDeleting = deleteMutation.isPending;

  const columnHelper = createColumnHelper<OpenMovementListItem>();
  const defaultColumns = useMemo(
    () => [
      columnHelper.accessor('code', {
        header: text.list.table.code,
        cell: ({ row }) => (
          <Text fontFamily="mono" fontSize="sm" fontWeight="medium">
            {row.original.code}
          </Text>
        ),
        meta: { ...styleColumTable.sm, gridLabel: text.list.table.code },
      }),
      columnHelper.accessor(
        (row) => `${row.account.bank} — ${row.account.agency}/${row.account.account}`,
        {
          id: 'account',
          header: text.list.table.account,
          cell: ({ row }) => (
            <Text fontSize="sm" lineClamp="1">
              {row.original.account.bank} — {row.original.account.agency}/
              {row.original.account.account}
            </Text>
          ),
          meta: { gridLabel: text.list.table.account },
        }
      ),
      columnHelper.accessor('date', {
        header: text.list.table.date,
        cell: ({ row }) => (
          <Text fontSize="sm" color="fg.muted">
            {new Date(row.original.date).toLocaleDateString('pt-BR')}
          </Text>
        ),
        meta: { ...styleColumTable.sm, gridLabel: text.list.table.date },
      }),
      columnHelper.accessor('value', {
        header: text.list.table.value,
        cell: ({ row }) => (
          <Flex align="center" gap={2}>
            <Icon as={FiDollarSign} color="green.500" boxSize={4} flexShrink={0} />
            <Text fontWeight="medium">{formatCurrencyBRL(row.original.value)}</Text>
          </Flex>
        ),
        meta: { ...styleColumTable.sm, gridLabel: text.list.table.value },
      }),
      columnHelper.accessor((row) => row.proprietary?.name ?? '', {
        id: 'proprietary',
        header: text.list.table.proprietary,
        cell: ({ row }) => (
          <Text fontSize="sm" color="fg.muted" lineClamp="1">
            {row.original.proprietary?.name ?? '—'}
          </Text>
        ),
        meta: { gridLabel: text.list.table.proprietary },
      }),
      columnHelper.display({
        id: 'acoes',
        header: '',
        enableHiding: false,
        cell: ({ row }) => (
          <Flex justify="flex-end">
            <Actions size="sm">
              <Actions.Item
                icon={<Icon as={FiEye} />}
                onClick={() =>
                  navigate(`/cadastros-base/saldo-inicial/${row.original.uuid}/detalhe`)
                }
              >
                {text.list.actions.view}
              </Actions.Item>
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
        ),
        meta: {
          ...styleColumTable.sm,
          gridLabel: languageGB.defaltStrings.actions,
          gridOrder: 'fixed-end',
          gridDataColumn: false,
        },
      }),
    ],
    [navigate, isDeleting, languageGB, canDelete, text]
  );

  const gridSettings = useGridSettings<OpenMovementListItem>({
    storageKey: SALDO_INICIAL_STORAGE_KEY,
    storageScope: useGridStorageScope(),
    columns: defaultColumns,
  });
  const { columnOrder, setColumnOrder, columnVisibility, setColumnVisibility } = gridSettings;

  const isLoading = checkLoadingStatus([openMovementsList]);
  const items = openMovementsList.data?.data?.items;
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
              gridSettings={gridSettings}
            />
          }
        >
          <VStack align="flex-start" gap={1}>
            <Text fontSize="2xl" fontWeight="bold" color="brandColorText">
              {text.list.pageTitle}
            </Text>
            <Text fontSize="sm" color="fg.muted">
              {text.list.pageSubtitle}
            </Text>
          </VStack>
        </HeaderGrid>

        <Box mt={6}>
          <Table
            isLoading={isLoading}
            isError={openMovementsList.isError}
            error={openMovementsList.error}
            isEmpty={isEmpty}
            onRetry={() => openMovementsList.refetch()}
            isRetrying={openMovementsList.isFetching}
            emptyIcon={FiDollarSign as ElementType}
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
            onCreate={() => navigate('/cadastros-base/saldo-inicial/novo')}
          />
        </Box>
      </TableProvider>

      <FilterSideSaldoInicial
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
    </ContainerGrid>
  );
}
