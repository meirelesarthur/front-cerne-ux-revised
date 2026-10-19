// src/pages/Fiscal/AccountingEntry/index.tsx
// -----------------------------------------------------------------------------
// Tela de LISTAGEM (grid) de Partida Dobrada (AccountingEntry — domínio
// Fiscal, F-128, esteira 97-Esteiras/068, TASK-PD-FE-06). Depende da fundação
// (TASK-PD-FE-01..05, commit ce2ff309). Consome `GET /double-entry-accountings`
// (contrato-tela §2, já implementado+testado — `AccountingEntryControllerTest`).
// Mirror estrutural `CadastrosBase/PlanAccount/index.tsx` (mesmo tipo de
// tela — CRUD simples com dialog de exclusão, sem seleção em massa nem
// GridSettings), `useCustomGridQuery` sem ID de contexto (mirror
// `get_pwa_grid_query_pattern`).
//
// Coluna "Responsável" (`user.name`) — `AccountingEntryResource` só expõe
// `user` via `whenLoaded` e o contrato não confirma se o índice
// (`ListAccountingEntryAction`/Repository) faz eager-load dele (FID-G3F,
// linha final). Renderização HONESTA: `row.original.user?.name ?? '—'` — SEM
// fallback fabricado. Se vier vazio/ausente na integração real (runtime),
// reportar Gap `[PARA ANÁLISE]` ao Arquiteto de API (ver relatório desta
// Tarefa) — não implementado nenhum N+1 por linha para contornar.
//
// `origin` — SEMPRE via dicionário local (`accountingEntryOriginOptions`/
// `accountingEntryOriginColor`, TASK-PD-FE-03), nunca `data.origin.label` cru
// (Lei 10 — o backend já traduz, mas o front tem sua própria fonte de i18n).
//
// `total` de registros — `data.pagination.total` (V3, via `paginatedQuery`/
// `TableProvider`), nunca `.count()`/`.length` da página atual (bug do
// legado, PROIBIDO replicar).
//
// Exclusão — `DeleteConfirmDialog` (mirror `PlanAccount`) + `useRequest`
// (`typesRequest: 'apply'`, substituição V3 canônica de `useDeleted` —
// `get_pwa_mutation_query_pattern`), invalidando
// `queryKey.accountingEntries.accountingEntriesList`.
//
// Rotas de formulário (`/novo`, `/:uuid`, `/:uuid/visualizar`) ainda NÃO
// existem (TASK-PD-FE-07/08, fora do escopo desta Tarefa) — navegar para elas
// cai no catch-all `/fiscal/*` (`RoutePlaceholder`), mesma convenção já aceita
// em `PlanAccount/HeaderTable.tsx`/`NfeEmitidas`.
// -----------------------------------------------------------------------------

import { useMemo, useState } from 'react';

import { Badge, Box, EmptyState, Flex, Icon, Text, useDisclosure, VStack } from '@chakra-ui/react';
import { createColumnHelper } from '@tanstack/react-table';
import { FiEdit, FiEye, FiFileText, FiTrash2 } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';

import { Actions } from '@/components/Action';
import { Button } from '@/components/Button';
import { ContainerGrid } from '@/components/ContainerGrid';
import { DeleteConfirmDialog } from '@/components/DeleteConfirmDialog';
import { HeaderGrid } from '@/components/HeaderGrid';
import { Table } from '@/components/Table';

import { TableProvider } from '@/contexts/TableContext';

import { useCustomGridQuery } from '@/hooks/useCustomGridQuery';
import { useLanguage } from '@/hooks/useLanguage';
import { userPaginatedQuery } from '@/hooks/usePaginatedQueryStorage';
import { usePermissions } from '@/hooks/usePermissions';
import { useRequest } from '@/hooks/useRequest';

import { checkLoadingStatus } from '@/utils/checkLoadingStatus';
import formatCurrencyBRL from '@/utils/formatCurrencyBRL';
import formatDate from '@/utils/formatDate';
import { styleColumTable } from '@/utils/style-colum-table';

import {
  accountingEntryOriginColor,
  accountingEntryOriginOptions,
} from '@/constants/Fiscal/accountingEntry';
import { queryKey } from '@/constants/query-key';

import {
  deleteAccountingEntry,
  getAllAccountingEntries,
} from '@/services/v2/Fiscal/accounting-entry-service';

import type {
  AccountingEntryData,
  AccountingEntryFilterRequest,
} from '@/@types/v2/Fiscal/accountingEntry';

import { FilterSideAccountingEntry } from './FilterSideAccountingEntry';
import { HeaderTable } from './HeaderTable';

const ACCOUNTING_ENTRY_STORAGE_KEY =
  'FiscalAccountingEntry' + queryKey.accountingEntries.accountingEntriesList;

export default function AccountingEntryList() {
  const { languageGB } = useLanguage();
  const { can } = usePermissions();
  const navigate = useNavigate();
  const text = languageGB.accountingEntries.accountingEntry;

  const canCreate = can('double-entry-accountings_create');

  const defaultQueryOptions = useMemo(
    () => ({ pageSize: 10, storageKey: ACCOUNTING_ENTRY_STORAGE_KEY }),
    []
  );

  const { paginatedQuery, handlePaginatedQuery, handleFilterChange, handleResetFilter } =
    userPaginatedQuery<AccountingEntryFilterRequest>(defaultQueryOptions);

  // ---- Estado de filtro (drawer) ------------------------------------------
  const { open: isFilterOpen, onOpen: onOpenFilter, onClose: onCloseFilter } = useDisclosure();

  const filtersApplied = useMemo(
    () =>
      Object.values(paginatedQuery.filter ?? {}).filter(
        (v) => v !== undefined && v !== null && v !== ''
      ).length,
    [paginatedQuery.filter]
  );

  // ---- Grid (sem ID de contexto — mirror get_pwa_grid_query_pattern) ------
  const entriesList = useCustomGridQuery<AccountingEntryData, AccountingEntryFilterRequest>({
    asyncFunction: getAllAccountingEntries,
    queryKey: queryKey.accountingEntries.accountingEntriesList,
    paginatedQuery,
    setPaginatedQuery: handlePaginatedQuery,
    filterQuery: [],
    filter: paginatedQuery.filter ?? ({} as AccountingEntryFilterRequest),
  });

  const items = entriesList.data?.data?.items ?? [];

  // ---- Estado de exclusão --------------------------------------------------
  const [toDelete, setToDelete] = useState<AccountingEntryData | null>(null);
  const {
    open: isOpenDeleteDialog,
    onOpen: onOpenDeleteDialog,
    onClose: onCloseDeleteDialog,
  } = useDisclosure();

  // V3: `useDeleted` não existe — substituição canônica é `useRequest` com
  // `typesRequest: 'apply'` (`get_pwa_mutation_query_pattern`, "Substituição
  // V3"). `personalizedMessage` cobre o texto exibido; o rótulo genérico de
  // `typesRequest` nunca aparece ao usuário.
  const deleteMutation = useRequest({
    asyncFunction: async ({ uuid }: { uuid: string }) => deleteAccountingEntry(uuid),
    queryKey: queryKey.accountingEntries.accountingEntriesList,
    typesRequest: 'apply',
    entityName: text.singularLabel,
    personalizedMessage: text.list.deletedToast,
    actionSuccess: () => {
      onCloseDeleteDialog();
      setToDelete(null);
    },
  });

  const isDeleting = deleteMutation.isPending;

  function handleDeleteClick(entry: AccountingEntryData) {
    setToDelete(entry);
    onOpenDeleteDialog();
  }

  function handleConfirmDelete() {
    if (toDelete) deleteMutation.mutate({ uuid: toDelete.uuid });
  }

  // ---- Colunas --------------------------------------------------------------
  const columnHelper = createColumnHelper<AccountingEntryData>();
  const defaultColumns = useMemo(
    () => [
      columnHelper.accessor('code', {
        header: text.list.table.code,
        cell: ({ row }) => (
          <Text fontFamily="mono" fontSize="sm" fontWeight="medium">
            {row.original.code}
          </Text>
        ),
        meta: styleColumTable.sm,
      }),
      // Badge SEMPRE via dicionário local (Lei 10) — nunca `origin.label` cru.
      columnHelper.accessor('origin', {
        header: text.list.table.origin,
        cell: ({ row }) => (
          <Badge
            colorPalette={accountingEntryOriginColor[row.original.origin.value]}
            variant="subtle"
            py={1}
            px={3}
          >
            {accountingEntryOriginOptions.getLabel(row.original.origin.value, languageGB)}
          </Badge>
        ),
        meta: styleColumTable.sm,
      }),
      columnHelper.accessor('description', {
        header: text.list.table.description,
        cell: ({ row }) => (
          <Text fontWeight="medium" lineClamp="1">
            {row.original.description}
          </Text>
        ),
      }),
      columnHelper.accessor('total_amount', {
        header: text.list.table.totalAmount,
        cell: ({ row }) => (
          <Text fontSize="sm" textAlign="right" fontVariantNumeric="tabular-nums">
            {formatCurrencyBRL(row.original.total_amount)}
          </Text>
        ),
        meta: styleColumTable.sm,
      }),
      // ⚠️ `whenLoaded` — ver nota de cabeçalho do arquivo (Gap potencial).
      // Renderização honesta: SEM fabricar dado ausente.
      columnHelper.display({
        id: 'responsible',
        header: text.list.table.responsible,
        cell: ({ row }) => (
          <Text fontSize="sm" color={row.original.user?.name ? undefined : 'fg.muted'}>
            {row.original.user?.name ?? '—'}
          </Text>
        ),
        meta: styleColumTable.sm,
      }),
      columnHelper.accessor('date', {
        header: text.list.table.date,
        cell: ({ row }) => (
          <Text fontSize="sm" color="fg.muted">
            {formatDate(row.original.date, 'dd/MM/yyyy')}
          </Text>
        ),
        meta: styleColumTable.sm,
      }),
      columnHelper.display({
        id: 'acoes',
        header: '',
        enableHiding: false,
        cell: ({ row }) => (
          <Flex justify="flex-end">
            <Actions size="sm" languageGB={languageGB}>
              {can('double-entry-accountings_view') && (
                <Actions.Item
                  icon={<Icon as={FiEye} />}
                  onClick={() =>
                    navigate(`/fiscal/partida-dobrada/${row.original.uuid}/visualizar`)
                  }
                >
                  {text.list.actions.view}
                </Actions.Item>
              )}
              {can('double-entry-accountings_edit') && (
                <Actions.Item
                  icon={<Icon as={FiEdit} />}
                  onClick={() => navigate(`/fiscal/partida-dobrada/${row.original.uuid}`)}
                >
                  {text.list.actions.edit}
                </Actions.Item>
              )}
              {can('double-entry-accountings_delete') && (
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
        meta: { ...styleColumTable.sm, gridOrder: 'fixed-end', gridDataColumn: false },
      }),
    ],
    [text, languageGB, can, navigate, isDeleting]
  );

  const isLoading = checkLoadingStatus([entriesList]);
  const isEmpty = !isLoading && items.length === 0;

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
          {isEmpty && !entriesList.isError ? (
            <EmptyState.Root>
              <EmptyState.Content>
                <EmptyState.Indicator>
                  <Icon as={FiFileText} boxSize={8} color="fg.muted" />
                </EmptyState.Indicator>
                <VStack textAlign="center" gap={1}>
                  <EmptyState.Title>
                    {filtersApplied > 0
                      ? text.list.emptyState.titleFiltered
                      : text.list.emptyState.titleEmpty}
                  </EmptyState.Title>
                  <EmptyState.Description>
                    {filtersApplied > 0
                      ? text.list.emptyState.descriptionFiltered
                      : text.list.emptyState.descriptionEmpty}
                  </EmptyState.Description>
                </VStack>
                {filtersApplied === 0 && canCreate && (
                  <Button
                    title={text.list.emptyState.cta}
                    onClick={() => navigate('/fiscal/partida-dobrada/novo')}
                  />
                )}
              </EmptyState.Content>
            </EmptyState.Root>
          ) : (
            <Table
              isLoading={isLoading}
              isError={entriesList.isError}
              error={entriesList.error}
              onRetry={() => entriesList.refetch()}
              isRetrying={entriesList.isFetching}
            />
          )}
        </Box>
      </TableProvider>

      <FilterSideAccountingEntry
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
        itemName={toDelete?.description}
      />
    </ContainerGrid>
  );
}
