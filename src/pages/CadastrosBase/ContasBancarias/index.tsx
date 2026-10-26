// src/pages/CadastrosBase/ContasBancarias/index.tsx
// -----------------------------------------------------------------------------
// Tela de LISTAGEM (grid flat, sem hierarquia) de CONTAS BANCÁRIAS (Account) —
// Cadastros Base / Financeiros, execução 025 (TASK-FE-564). Rota:
// /cadastros-base/contas-bancarias (guardada por `accounts_view`, wiring de
// rota real em TASK-FE-563 — CHOKEPOINT isolado, fora do escopo desta Tarefa).
//
// Referência UX: `GB.Cerne.UX@305e10e —
// src/pages/cadastros/contas-bancarias/ContasBancariasLista.tsx`, implementado
// com o catálogo real do fork (`ContainerGrid`/`Table`/`Actions`), NÃO os
// componentes visuais do Storybook — mirror estrutural de
// `Embalagens/index.tsx`/`CategoriasAnimais/index.tsx` (grid + filtro +
// delete guardado, mesmo grupo "Cadastros Base").
//
// GUARD DE FAZENDA ATIVA (Account-contrato.md §4/D2, `farm.context` ESTRITO):
// mesmo padrão ESTABELECIDO por `Embalagens/index.tsx` (1º catálogo com
// listagem, não settings-form, a precisar do guard) — a query só dispara
// quando `usePermissions().hasFarm` é `true`; sem fazenda ativa, EmptyState
// informativo, ZERO chamada de rede (evita 403 cru do backend).
//
// `limit`/`balance` chegam como STRING do backend (decimal cast sem `(float)`
// no Resource — achado desta Tarefa, ver comentário em
// `@types/v2/CadastrosBase/account/index.d.ts`, mesma classe de armadilha já
// catalogada em `Package.size`) — SEMPRE `Number(...)` antes de formatar ou
// comparar (nunca aritmética direta na string).
//
// Ordenação: backend fixa `orderBy('bank', 'asc')` (Account-contrato.md §11)
// — SEM `SortHeader` clicável nesta versão (mirror do próprio mock, que
// também não ordena por cabeçalho).
//
// Exclusão — DUAS variantes de `ConfirmDialog` (Tarefa, "Estados de UI"):
//   1. Normal — `balance == 0` e nenhuma conta na PÁGINA ATUAL referencia esta
//      via `investment_account.uuid` → `DeleteConfirmDialog` destrutivo
//      padrão (Cancelar/Excluir).
//   2. Bloqueada — heurística CLIENT-SIDE best-effort (Riscos #1 da Tarefa):
//      só computável sobre os itens JÁ CARREGADOS na página (paginação real,
//      não o array completo do mock) → `DeleteConfirmDialog` com
//      `hideQuestionMark` (variante informativa, extensão aditiva do
//      componente compartilhado, default preserva os ~40 outros
//      consumidores). Qualquer dependência fora da página atual (ou FK física
//      de `movements`/`tickets`, GAP-BE-260/261) só aparece no erro genérico
//      do `useRequest` — nenhuma mensagem de negócio fabricada.
// -----------------------------------------------------------------------------

import { ElementType, useMemo, useState } from 'react';

import { Badge, Box, EmptyState, Flex, Icon, Text, useDisclosure, VStack } from '@chakra-ui/react';
import { createColumnHelper } from '@tanstack/react-table';
import { FiCreditCard, FiEdit, FiEye, FiTrash2 } from 'react-icons/fi';
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
import { styleColumTable } from '@/utils/style-colum-table';

import {
  accountTypeColor,
  accountTypeOptions,
} from '@/constants/cadastrosBase/account/account-status';
import { statusOptions } from '@/constants/options/statusOptions';
import { queryKey } from '@/constants/query-key';

import { deleteAccount } from '@/services/v2/CadastrosBase/Account/account-service';

import type { AccountFilterForm, AccountListItem } from '@/@types/v2/CadastrosBase/account';

import { FilterSideContasBancarias } from './FilterSideContasBancarias';
import { HeaderTable } from './HeaderTable';
import { useAccountsList } from './useAccounts';

import { PageHeader } from '@/components/ui/PageHeader';

import { ListToolbar } from '@/components/ui/ListToolbar';
import { useListSearch } from '@/hooks/useListSearch';

// Formatação monetária pt-BR (nenhum util global de currency existe no fork —
// Regra F: resolve em poucas linhas sem nova abstração — mesmo tratamento
// dado por `Embalagens/index.tsx` ao `size`). `value` sempre a STRING crua do
// backend (`decimal:2` sem `(float)` cast no Resource, ver cabeçalho do
// arquivo) — `Number(...)` antes de formatar.
function formatCurrencyBRL(value: string): string {
  return Number(value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export default function ContasBancariasList() {
  const { languageGB } = useLanguage();
  const navigate = useNavigate();
  const { can, hasFarm } = usePermissions();
  const text = languageGB.accounts.account;

  // Permissões REAIS do backend (accounts_*, já cadastradas em
  // PermissionTree.php:530-540 — Account-contrato.md D10/§13).
  const canView = can('accounts_view');
  const canEdit = can('accounts_edit');
  const canDelete = can('accounts_delete');

  const defaultQueryOptions = useMemo(
    () => ({
      pageSize: 10,
      storageKey: 'CadastrosBaseContasBancarias' + queryKey.cadastrosBase.accounts,
    }),
    []
  );

  const { paginatedQuery, handlePaginatedQuery, handleFilterChange, handleResetFilter } =
    userPaginatedQuery<AccountFilterForm>(defaultQueryOptions);
  const listSearch = useListSearch(paginatedQuery.filter, handleFilterChange);

  // ---- Estado de filtro (drawer) ------------------------------------------
  const { open: isFilterOpen, onOpen: onOpenFilter, onClose: onCloseFilter } = useDisclosure();

  const filtersApplied = useMemo(
    () =>
      Object.values(paginatedQuery.filter ?? {}).filter(
        (v) => v !== undefined && v !== null && v !== ''
      ).length,
    [paginatedQuery.filter]
  );

  // ---- Estado de exclusão (normal) ----------------------------------------
  const [toDelete, setToDelete] = useState<AccountListItem | null>(null);
  const {
    open: isOpenDeleteDialog,
    onOpen: onOpenDeleteDialog,
    onClose: onCloseDeleteDialog,
  } = useDisclosure();

  // ---- Estado de exclusão (BLOQUEADA — heurística client-side) ------------
  const [blocked, setBlocked] = useState<{
    item: AccountListItem;
    dependents: AccountListItem[];
  } | null>(null);
  const {
    open: isOpenBlockedDialog,
    onOpen: onOpenBlockedDialog,
    onClose: onCloseBlockedDialog,
  } = useDisclosure();

  // Guard de fazenda ativa (§ cabeçalho do arquivo) — a query só dispara
  // quando `hasFarm` é verdadeiro. Sem fazenda ativa, NENHUMA chamada de rede
  // é feita (evita 403 cru do backend `farm.context` estrito).
  const accountsList = useAccountsList({
    paginatedQuery,
    setPaginatedQuery: handlePaginatedQuery,
    filter: paginatedQuery.filter ?? undefined,
    enabled: hasFarm,
  });

  const deleteMutation = useRequest({
    asyncFunction: async ({ accountUuid }: { accountUuid: string }) => {
      return await deleteAccount(accountUuid);
    },
    queryKey: queryKey.cadastrosBase.accounts,
    // `useRequest`'s TypesRequest não tem variante "delete" — "update" é a
    // opção compilável usada pelo mesmo motivo em Embalagens/CategoriasAnimais
    // (o texto exibido vem de `personalizedMessage`). Sem guarda de FK
    // estruturada no backend (GAP-BE-260/261, D9 original) — o `onError`
    // GLOBAL deste hook já exibe a `message` do envelope (erro genérico),
    // NUNCA uma mensagem de negócio fabricada que o servidor não garante.
    typesRequest: 'update',
    entityName: text.singularLabel,
    personalizedMessage: text.list.deletedToast,
    actionSuccess: () => {
      onCloseDeleteDialog();
      setToDelete(null);
    },
  });

  const isDeleting = deleteMutation.isPending;
  const items = hasFarm ? (accountsList.data?.data?.items ?? []) : [];

  // Heurística CLIENT-SIDE best-effort (Riscos #1 da Tarefa) — só computável
  // sobre os itens JÁ CARREGADOS na página atual (paginação real, ao
  // contrário do mock que tem o array completo em memória). Qualquer
  // dependência fora desta página só é descoberta pelo erro genérico do
  // backend na tentativa real de exclusão.
  function dependentsOf(item: AccountListItem): AccountListItem[] {
    return items.filter((account) => account.investment_account?.uuid === item.uuid);
  }

  function handleDeleteClick(item: AccountListItem) {
    const dependents = dependentsOf(item);
    if (Number(item.balance) !== 0 || dependents.length > 0) {
      setBlocked({ item, dependents });
      onOpenBlockedDialog();
    } else {
      setToDelete(item);
      onOpenDeleteDialog();
    }
  }

  function handleConfirmDelete() {
    if (toDelete) {
      deleteMutation.mutate({ accountUuid: toDelete.uuid });
    }
  }

  const blockedMessage = blocked
    ? [
        Number(blocked.item.balance) !== 0 ? text.list.deleteBlocked.balance : null,
        blocked.dependents.length > 0 ? text.list.deleteBlocked.dependents : null,
      ]
        .filter(Boolean)
        .join(' ')
    : '';

  const columnHelper = createColumnHelper<AccountListItem>();
  const defaultColumns = useMemo(
    () => [
      columnHelper.accessor('description', {
        header: text.list.columns.description,
        cell: ({ row }) => (
          <Box minW={0}>
            <Text fontWeight="medium" lineClamp="1">
              {row.original.description}
            </Text>
            <Text fontSize="xs" color="fg.muted" lineClamp="1">
              {row.original.code}
            </Text>
          </Box>
        ),
      }),
      columnHelper.accessor('bank', {
        header: text.list.columns.bank,
        cell: ({ row }) => (
          <Text fontSize="sm" color="fg.muted" lineClamp="1">
            {row.original.bank}
          </Text>
        ),
      }),
      columnHelper.accessor('agency', {
        header: text.list.columns.agency,
        cell: ({ row }) => (
          <Text fontSize="sm" color="fg.muted">
            {row.original.agency}
          </Text>
        ),
        meta: styleColumTable.sm,
      }),
      columnHelper.accessor('account', {
        header: text.list.columns.account,
        cell: ({ row }) => (
          <Text fontSize="sm" color="fg.muted">
            {row.original.account}
          </Text>
        ),
        meta: styleColumTable.sm,
      }),
      columnHelper.accessor((row) => row.type.value, {
        id: 'type',
        header: text.list.columns.type,
        cell: ({ row }) => (
          <Badge
            colorPalette={accountTypeColor[row.original.type.value]}
            variant="subtle"
            py={1}
            px={3}
          >
            {accountTypeOptions.getLabel(row.original.type.value, languageGB)}
          </Badge>
        ),
        meta: styleColumTable.sm,
      }),
      columnHelper.accessor('limit', {
        header: text.list.columns.limit,
        // `limit` chega como STRING (decimal cast) — `Number(...)` antes de
        // formatar (ver cabeçalho do arquivo).
        cell: ({ row }) => (
          <Text fontSize="sm" color="fg.muted" fontVariantNumeric="tabular-nums">
            {formatCurrencyBRL(row.original.limit)}
          </Text>
        ),
        meta: styleColumTable.md,
      }),
      columnHelper.accessor('balance', {
        header: text.list.columns.balance,
        // `balance` — somente-leitura/informativo (D5 do contrato de API),
        // NUNCA editável aqui. STRING crua, mesma conversão de `limit`.
        cell: ({ row }) => (
          <Text
            fontSize="sm"
            fontWeight="medium"
            color={Number(row.original.balance) < 0 ? 'red.500' : 'fg.default'}
            fontVariantNumeric="tabular-nums"
          >
            {formatCurrencyBRL(row.original.balance)}
          </Text>
        ),
        meta: styleColumTable.md,
      }),
      columnHelper.accessor('is_enabled', {
        header: text.list.columns.isEnabled,
        cell: ({ row }) => (
          <Badge
            colorPalette={row.original.is_enabled ? 'green' : 'gray'}
            variant="subtle"
            py={1}
            px={3}
          >
            {statusOptions.getLabel(row.original.is_enabled, languageGB)}
          </Badge>
        ),
        meta: styleColumTable.sm,
      }),
      columnHelper.accessor('is_ticket', {
        header: text.list.columns.ticket,
        // Badge Sim/Não — reaproveita `defaltStrings.yes/no` (genérico, sem
        // cor nova a inventar — Riscos #3 da Tarefa: `info`→azul,
        // `neutral`→cinza, adaptação do `variant="info"/"neutral"` do mock
        // ao Chakra real do fork, colorPalette+variant="subtle").
        cell: ({ row }) => (
          <Flex justify="center">
            <Badge
              colorPalette={row.original.is_ticket ? 'blue' : 'gray'}
              variant="subtle"
              py={1}
              px={3}
            >
              {row.original.is_ticket ? languageGB.defaltStrings.yes : languageGB.defaltStrings.no}
            </Badge>
          </Flex>
        ),
        meta: styleColumTable.sm,
      }),
      columnHelper.display({
        id: 'acoes',
        header: '',
        cell: ({ row }) => (
          <Flex justify="flex-end">
            <Actions size="sm">
              {/* Rota única serve view (read-only) e edit — sem rota
                  `/visualizar` dedicada (Account-FrontEnd-contrato.md §1,
                  mirror CostCenter/PlanAccount). */}
              {(canEdit || canView) && (
                <Actions.Item
                  icon={<Icon as={canEdit ? FiEdit : FiEye} />}
                  onClick={() => navigate(`/cadastros-base/contas-bancarias/${row.original.uuid}`)}
                >
                  {canEdit ? text.list.actions.edit : text.list.actions.view}
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
    [navigate, isDeleting, text, canEdit, canView, canDelete, languageGB]
  );

  const isLoading = hasFarm && checkLoadingStatus([accountsList]);
  const isEmpty = hasFarm && !isLoading && items.length === 0;

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

        <ListToolbar
          search={listSearch.value}
          onSearch={listSearch.onChange}
          searchPlaceholder={languageGB.defaltStrings.searchList}
          onOpenFilter={onOpenFilter}
          filtersApplied={filtersApplied - (paginatedQuery.filter?.search ? 1 : 0)}
        />

        <Box>
          {!hasFarm ? (
            <EmptyState.Root>
              <EmptyState.Content>
                <EmptyState.Indicator>
                  <Icon as={FiCreditCard} boxSize={8} color="fg.muted" />
                </EmptyState.Indicator>
                <VStack textAlign="center" gap={1}>
                  <EmptyState.Title>{text.list.noFarmSelected.title}</EmptyState.Title>
                  <EmptyState.Description>
                    {text.list.noFarmSelected.description}
                  </EmptyState.Description>
                </VStack>
              </EmptyState.Content>
            </EmptyState.Root>
          ) : (
            <Table
              isLoading={isLoading}
              isError={accountsList.isError}
              error={accountsList.error}
              isEmpty={isEmpty}
              onRetry={() => accountsList.refetch()}
              isRetrying={accountsList.isFetching}
              emptyIcon={FiCreditCard as ElementType}
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
              canCreate={filtersApplied === 0 && can('accounts_create')}
              createLabel={text.list.emptyState.cta}
              onCreate={() => navigate('/cadastros-base/contas-bancarias/novo')}
            />
          )}
        </Box>
      </TableProvider>

      <FilterSideContasBancarias
        isOpen={isFilterOpen}
        onClose={onCloseFilter}
        handleFilterChange={(applied) => handleFilterChange(applied)}
        handleReset={() => handleResetFilter()}
        filter={paginatedQuery.filter}
        languageGB={languageGB}
      />

      {/* Exclusão NORMAL — balance == 0 e sem dependentes na página atual. */}
      <DeleteConfirmDialog
        isOpen={isOpenDeleteDialog}
        onClose={() => {
          onCloseDeleteDialog();
          setToDelete(null);
        }}
        onConfirm={handleConfirmDelete}
        isLoading={isDeleting}
        title={text.list.deleteConfirm.title}
        itemName={toDelete?.description}
      />

      {/* Exclusão BLOQUEADA — variante INFORMATIVA (`hideQuestionMark`),
          heurística client-side best-effort (ver cabeçalho do arquivo). */}
      <DeleteConfirmDialog
        isOpen={isOpenBlockedDialog}
        onClose={() => {
          onCloseBlockedDialog();
          setBlocked(null);
        }}
        onConfirm={() => {
          onCloseBlockedDialog();
          setBlocked(null);
        }}
        title={text.list.deleteBlocked.title}
        description={blockedMessage}
        warningText={text.list.deleteBlocked.hint}
        confirmButtonText={text.list.deleteBlocked.confirm}
        colorPalette="gray"
        hideQuestionMark
      />
    </ContainerGrid>
  );
}
