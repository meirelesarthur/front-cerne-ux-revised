// src/pages/CadastrosBase/EstoqueInicial/index.tsx
// -----------------------------------------------------------------------------
// Tela de LISTAGEM (grid) de ESTOQUE INICIAL (OpeningBalance) — Cadastros
// Base. TASK-FE-1042 (execução 026), rota `/cadastros-base/estoques-iniciais`
// (wiring real de rota/menu é TASK-FE-1046 — CHOKEPOINT, este arquivo não
// mexe em rota/menu).
//
// Mirror mecânico de `Armazem/index.tsx` (CRUD flat, sem hierarquia) com a
// casca de filtro em `<Form formFilter>` de `Produtos/Catalogo/index.tsx`
// (achatamento `toRequestFilter` — `paginatedQuery.filter` guarda o par
// uuid+label para re-hidratar o drawer; a querystring real nunca leva os
// `*_label`).
//
// FIDELIDADE AO LEGADO (correção pós-entrega do Maestro, evidência direta do
// Blade `agro365/resources/views/openingbalances/index.blade.php:85-104`):
// 7 colunas de dado — Produto/Un. Medida/Armazém/Quantidade/Dt. Movimento/
// Lote Fornecedor/Classificação — + Ações. SEM Vl. Unitário/Valor Total: o
// legado NÃO os exibe na listagem (só no formulário/detalhe, fora do escopo
// desta Tarefa) — eram escopo novo não pedido, removidos. Título "Estoque
// Inicial" (NÃO "Saldo Inicial de Estoque" do UX — mirror rename já decidido
// para Produtos/GAP-FE-200). Summary bar (registros/armazéns/última entrada)
// CORTADA por YAGNI (task-packet, Roteiro item 4 — registrado aqui, não
// implementada nesta Tarefa).
//
// "Dt. Movimento" = `created_at` — CONFIRMADO fiel ao legado (não é proxy):
// o Blade renderiza literalmente `$item->created_at->format(...)` na coluna
// `trad.var_dmov` (linha 102). `date` (sempre `NULL`) segue corretamente
// NUNCA exposto pelo `OpeningBalanceResource` (contrato §9/§13) e não
// participa desta tela.
//
// Fallback "Não Possui" (Lote Fornecedor/Classificação vazios) — fiel ao
// legado (`$item->provider_lot ?? 'Não Possui'`/`$item->cultivation_name ??
// 'Não Possui'`, linhas 103-104) via chave de tradução `trad.var_nao_possui`
// (`text.list.table.noData`) — NUNCA string literal no componente.
// -----------------------------------------------------------------------------

import { ElementType, useMemo, useState } from 'react';

import { Box, Flex, Icon, Text, useDisclosure } from '@chakra-ui/react';
import { createColumnHelper } from '@tanstack/react-table';
import { FiEdit, FiPackage, FiTrash2 } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';

import { Actions } from '@/components/Action';
import { ContainerGrid } from '@/components/ContainerGrid';
import { DeleteConfirmDialog } from '@/components/DeleteConfirmDialog';
import { HeaderGrid } from '@/components/HeaderGrid';
import { Table } from '@/components/Table';

import { TableProvider } from '@/contexts/TableContext';

import { useLanguage } from '@/hooks/useLanguage';
import { userPaginatedQuery } from '@/hooks/usePaginatedQueryStorage';
import { usePermissions } from '@/hooks/usePermissions';
import { useRequest } from '@/hooks/useRequest';

import { checkLoadingStatus } from '@/utils/checkLoadingStatus';
import formatDate from '@/utils/formatDate';
import { styleColumTable } from '@/utils/style-colum-table';

import { queryKey } from '@/constants/query-key';

import { deleteOpeningBalance } from '@/services/v2/OpeningBalances/opening-balance-service';
import type { ListOpeningBalancesParams } from '@/services/v2/OpeningBalances/opening-balance-service';

import type { OpeningBalanceFilterForm, OpeningBalanceListItem } from '@/@types/v2/OpeningBalances';

import { FilterSideEstoqueInicial } from './FilterSideEstoqueInicial';
import { HeaderTable } from './HeaderTable';
import { useOpeningBalancesList } from './useOpeningBalances';

import { PageHeader } from '@/components/ui/PageHeader';

// `quantity` — 3 casas decimais fiel ao schema (`decimal(12,3)`, contrato §1).
function formatQuantity(value: number): string {
  return value.toLocaleString('pt-BR', { minimumFractionDigits: 3, maximumFractionDigits: 3 });
}

// Achatamento `OpeningBalanceFilterForm` (persistido, com `*_label`
// companion) → `ListOpeningBalancesParams` (querystring real de `GET
// /opening-balances`) — responsabilidade desta Tarefa, mirror
// `Produtos/Catalogo/index.tsx` (`toRequestFilter`). `*_label` nunca é
// enviado à API, só existe para re-hidratar o drawer.
function toRequestFilter(filter?: OpeningBalanceFilterForm | null): ListOpeningBalancesParams {
  return {
    search: filter?.search || undefined,
    product_uuid: filter?.product_uuid || undefined,
    warehouse_uuid: filter?.warehouse_uuid || undefined,
  };
}

export default function EstoqueInicialList() {
  const { languageGB } = useLanguage();
  const navigate = useNavigate();
  const { can } = usePermissions();
  const text = languageGB.openingBalances.openingBalance;

  const canCreate = can('openingbalances_create');
  const canEdit = can('openingbalances_edit');
  const canDelete = can('openingbalances_delete');

  const defaultQueryOptions = useMemo(
    () => ({
      pageSize: 10,
      storageKey: 'CadastrosBaseEstoqueInicial' + queryKey.openingBalances.openingBalancesList,
    }),
    []
  );

  const { paginatedQuery, handlePaginatedQuery, handleFilterChange, handleResetFilter } =
    userPaginatedQuery<OpeningBalanceFilterForm>(defaultQueryOptions);

  // ---- Estado de filtro (drawer) ------------------------------------------
  const { open: isFilterOpen, onOpen: onOpenFilter, onClose: onCloseFilter } = useDisclosure();

  const filtersApplied = useMemo(
    () =>
      Object.entries(paginatedQuery.filter ?? {})
        // Chaves `*_label` são DISPLAY-ONLY (re-hidratação do drawer) — não
        // devem inflar o badge "Filtros(N)" (mirror `Produtos/Catalogo`).
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
  const [toDelete, setToDelete] = useState<OpeningBalanceListItem | null>(null);
  const {
    open: isOpenDeleteDialog,
    onOpen: onOpenDeleteDialog,
    onClose: onCloseDeleteDialog,
  } = useDisclosure();

  const openingBalancesList = useOpeningBalancesList({
    paginatedQuery,
    setPaginatedQuery: handlePaginatedQuery,
    filter: requestFilter,
  });

  // Mensagem de erro do backend (422 — RN-8, estoque atual < quantidade do
  // saldo) chega via `resData.message` real (interceptor de `useRequest`,
  // nunca texto genérico inventado aqui — diretriz do dev).
  const deleteMutation = useRequest({
    asyncFunction: async ({ openingBalanceUuid }: { openingBalanceUuid: string }) => {
      return await deleteOpeningBalance(openingBalanceUuid);
    },
    queryKey: queryKey.openingBalances.openingBalancesList,
    typesRequest: 'update',
    entityName: text.singularLabel,
    personalizedMessage: text.list.deletedToast,
    actionSuccess: () => {
      onCloseDeleteDialog();
      setToDelete(null);
    },
  });

  const handleDeleteClick = (openingBalance: OpeningBalanceListItem) => {
    setToDelete(openingBalance);
    onOpenDeleteDialog();
  };

  const handleConfirmDelete = () => {
    if (toDelete) {
      deleteMutation.mutate({ openingBalanceUuid: toDelete.uuid });
    }
  };

  const isDeleting = deleteMutation.isPending;

  const columnHelper = createColumnHelper<OpeningBalanceListItem>();
  const defaultColumns = useMemo(
    () => [
      columnHelper.accessor((row) => row.product.description, {
        id: 'product',
        header: text.list.table.product,
        cell: ({ row }) => (
          <Text lineClamp="1">
            <Text as="span" fontFamily="mono" fontSize="sm" color="fg.muted" mr={2}>
              {row.original.product.code}
            </Text>
            <Text as="span" fontWeight="medium">
              {row.original.product.description}
            </Text>
          </Text>
        ),
      }),
      // `product.measurement` aninhado (TASK-BE-742, correção de fidelidade —
      // o Resource nunca teve o campo achatado `measurement_description` que
      // esta coluna lia antes; renderizava vazio em runtime).
      columnHelper.accessor((row) => row.product.measurement?.description ?? '', {
        id: 'measurement',
        header: text.list.table.measurement,
        cell: ({ row }) => (
          <Text fontSize="sm" color="fg.muted">
            {row.original.product.measurement?.description || text.list.table.noData}
          </Text>
        ),
        meta: styleColumTable.sm,
      }),
      columnHelper.accessor((row) => row.warehouse.description, {
        id: 'warehouse',
        header: text.list.table.warehouse,
        cell: ({ row }) => (
          <Text fontSize="sm" color="fg.muted" lineClamp="1">
            {row.original.warehouse.description}
          </Text>
        ),
        meta: styleColumTable.md,
      }),
      columnHelper.accessor('quantity', {
        header: text.list.table.quantity,
        cell: ({ row }) => (
          <Text fontSize="sm" textAlign="right" fontVariantNumeric="tabular-nums">
            {formatQuantity(row.original.quantity)}
          </Text>
        ),
        meta: styleColumTable.sm,
      }),
      // "Dt. Movimento" = `created_at` — CONFIRMADO fiel ao legado (ver nota
      // de topo do arquivo, Blade linha 102).
      columnHelper.accessor('created_at', {
        header: text.list.table.movementDate,
        cell: ({ row }) => (
          <Text fontSize="sm" color="fg.muted">
            {formatDate(row.original.created_at)}
          </Text>
        ),
        meta: styleColumTable.sm,
      }),
      columnHelper.accessor('provider_lot', {
        header: text.list.table.providerLot,
        cell: ({ row }) => (
          <Text fontSize="sm" color={row.original.provider_lot ? 'fg.default' : 'fg.muted'}>
            {row.original.provider_lot || text.list.table.noData}
          </Text>
        ),
        meta: styleColumTable.sm,
      }),
      // "Classificação" (`cultivation`) — fiel ao legado (Blade linha 104,
      // `trad.agr_classif`), removida do escopo do UX/mock e reincorporada
      // por instrução do Maestro. Chave real é `cultivation.name` (correção
      // de fidelidade, Maestro 2026-07-31 — `OpeningBalanceResource.php` não
      // expõe `description` aqui, diferente do `cultivation` de Produtos).
      columnHelper.accessor((row) => row.cultivation?.name ?? '', {
        id: 'classification',
        header: text.list.table.classification,
        cell: ({ row }) => (
          <Text
            fontSize="sm"
            color={row.original.cultivation ? 'fg.default' : 'fg.muted'}
            lineClamp="1"
          >
            {row.original.cultivation?.name || text.list.table.noData}
          </Text>
        ),
        meta: styleColumTable.sm,
      }),
      columnHelper.display({
        id: 'acoes',
        header: '',
        cell: ({ row }) => (
          <Flex justify="flex-end">
            <Actions size="sm">
              {canEdit && (
                <Actions.Item
                  icon={<Icon as={FiEdit} />}
                  onClick={() =>
                    navigate(`/cadastros-base/estoques-iniciais/${row.original.uuid}/editar`)
                  }
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

  const isLoading = checkLoadingStatus([openingBalancesList]);
  const items = openingBalancesList.data?.data?.items;
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
            isError={openingBalancesList.isError}
            error={openingBalancesList.error}
            isEmpty={isEmpty}
            onRetry={() => openingBalancesList.refetch()}
            isRetrying={openingBalancesList.isFetching}
            emptyIcon={FiPackage as ElementType}
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
            onCreate={() => navigate('/cadastros-base/estoques-iniciais/novo')}
          />
        </Box>
      </TableProvider>

      <FilterSideEstoqueInicial
        isOpen={isFilterOpen}
        onClose={onCloseFilter}
        handleFilterChange={(applied) => handleFilterChange(applied)}
        handleReset={() => handleResetFilter()}
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
        itemName={toDelete?.product.description}
      />
    </ContainerGrid>
  );
}
