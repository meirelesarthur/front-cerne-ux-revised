// src/pages/CadastrosBase/Autorizadores/index.tsx
// -----------------------------------------------------------------------------
// Tela de LISTAGEM (grid) de AUTORIZADORES (RequestAuthorizer) — Cadastros
// Base / Pessoas. SLICE 1 (Lote 06 / esteira 089, Frente C, F-141: Lista +
// visibilidade) — corrige o eixo da rejeição AF ("não está aparecendo no
// ambiente"): a rota hoje caía no `RoutePlaceholder` genérico.
//
// Rota: /cadastros-base/autorizadores (guardada por `request-authorizers_view`,
// registrada nesta MESMA Tarefa em `src/router/index.tsx`).
//
// Estrutura idêntica a CadastrosBase/CentroCusto/index.tsx (molde CRUD mais
// recente do projeto):
//   - grid paginado (TableProvider + Table) via useRequestAuthorizersList;
//   - HeaderTable       → botões de ação (Add respeita request-authorizers_create);
//   - FilterSideAutorizadores → drawer (só `search`, contrato §5 da Tarefa);
//   - delete via useRequest + DeleteConfirmDialog (respeita
//     request-authorizers_delete; erro de negócio do backend vira toast com
//     a message do envelope).
//
// Fidelidade ao design system `cerne`: adaptação (não cópia) do padrão visual
// de listagem já em uso no projeto (CentroCusto/Perfil) — get_spa_ux_fidelity_
// pattern §2. SEM tela própria no Storybook para Autorizadores nesta rodada
// (mesma classe de UX-GAP documentada nas telas irmãs) — reaproveita o
// layout canônico de listagem (ContainerGrid/HeaderGrid/Table), não inventa
// layout novo.
//
// Colunas (paridade com o legado, T-081-FE-02): Autorizador, Dt. Cadastro
// (`d/m/Y`), Valor ("até R$ 1.234,56"; nulo aparece como "até R$ 0,00", o
// efeito real na alçada), Ativo, Autorizador Condicional (+ colunas extras do
// novo: nº de cotações, Ordenador de Despesas?, Fazendas) e ações.
// "Visualizar" abre a tela própria (`.../:uuid/visualizar`, só
// `request-authorizers_view`); "Editar" exige `request-authorizers_edit`.
// -----------------------------------------------------------------------------

import { useMemo, useState } from 'react';
import type { ElementType } from 'react';

import { Badge, Box, Flex, Icon, Text, useDisclosure } from '@chakra-ui/react';
import { createColumnHelper } from '@tanstack/react-table';
import { FiEdit, FiEye, FiShield, FiTrash2 } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';

import { Actions } from '@/components/Action';
import { ContainerGrid } from '@/components/ContainerGrid';
import { DeleteConfirmDialog } from '@/components/DeleteConfirmDialog';
import { HeaderGrid } from '@/components/HeaderGrid';
import { Table } from '@/components/Table';

import { TableProvider } from '@/contexts/TableContext';

import { useAuth } from '@/hooks/useAuth';
import { useGridSettings } from '@/hooks/useGridSettings';
import { useGridStorageScope } from '@/hooks/useGridStorageScope';
import { useLanguage } from '@/hooks/useLanguage';
import { userPaginatedQuery } from '@/hooks/usePaginatedQueryStorage';
import { usePermissions } from '@/hooks/usePermissions';
import { useRequest } from '@/hooks/useRequest';

import { checkLoadingStatus } from '@/utils/checkLoadingStatus';
import formatCurrencyBRL from '@/utils/formatCurrencyBRL';
import formatDate from '@/utils/formatDate';
import { styleColumTable } from '@/utils/style-colum-table';

import { queryKey } from '@/constants/query-key';

import { deleteRequestAuthorizer } from '@/services/v2/RequestAuthorizers/request-authorizer-service';

import type {
  RequestAuthorizerFilterForm,
  RequestAuthorizerListItem,
} from '@/@types/v2/RequestAuthorizers';

import { FilterSideAutorizadores } from './FilterSideAutorizadores';
import { HeaderTable } from './HeaderTable';
import { useRequestAuthorizersList } from './useRequestAuthorizers';

import { PageHeader } from '@/components/ui/PageHeader';

import { ListToolbar } from '@/components/ui/ListToolbar';
import { useListSearch } from '@/hooks/useListSearch';

// Chave de storage desta tela. Paginação (`userPaginatedQuery`) e
// personalização de grid (`useGridSettings`) derivam da MESMA expressão para
// nunca divergirem — nada de literal cru repetido (DEC-007 §12).
const AUTORIZADORES_STORAGE_KEY = 'CadastrosBaseAutorizadores' + queryKey.requestAuthorizers.list;

export default function AutorizadoresList() {
  const { languageGB } = useLanguage();
  const navigate = useNavigate();
  const { can } = usePermissions();
  // FIX P1 (esteira 089, achado do Tester — rede real): `activeFarmUuid`
  // represa `useRequestAuthorizersList` até o boot de auth resolver o
  // `X-Farm-Id` (ver cabeçalho de useRequestAuthorizers.tsx). Mesma fonte já
  // usada por `PesagemRodoviaria/index.tsx`.
  const { activeFarmUuid } = useAuth();
  const text = languageGB.requestAuthorizers.requestAuthorizer;

  const canCreate = can('request-authorizers_create');
  const canView = can('request-authorizers_view');
  const canEdit = can('request-authorizers_edit');
  const canDelete = can('request-authorizers_delete');

  const defaultQueryOptions = useMemo(
    () => ({
      pageSize: 10,
      storageKey: AUTORIZADORES_STORAGE_KEY,
    }),
    []
  );

  const { paginatedQuery, handlePaginatedQuery, handleFilterChange, handleResetFilter } =
    userPaginatedQuery<RequestAuthorizerFilterForm>(defaultQueryOptions);
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

  // ---- Estado de exclusão --------------------------------------------------
  const [toDelete, setToDelete] = useState<RequestAuthorizerListItem | null>(null);
  const {
    open: isOpenDeleteDialog,
    onOpen: onOpenDeleteDialog,
    onClose: onCloseDeleteDialog,
  } = useDisclosure();

  const requestAuthorizersList = useRequestAuthorizersList({
    paginatedQuery,
    setPaginatedQuery: handlePaginatedQuery,
    filter: paginatedQuery.filter ?? undefined,
    activeFarmUuid,
  });

  const deleteMutation = useRequest({
    asyncFunction: async ({ authorizerUuid }: { authorizerUuid: string }) => {
      return await deleteRequestAuthorizer(authorizerUuid);
    },
    queryKey: queryKey.requestAuthorizers.list,
    queryKey2: queryKey.requestAuthorizers.detail,
    // Mesma observação de CentroCusto/index.tsx — `useRequest`'s TypesRequest
    // não tem variante "delete" (só update/create/apply/export/revoke/
    // restore); "update" é a única opção compilável. O texto exibido no
    // toast vem de `personalizedMessage`, então o rótulo genérico de "update"
    // nunca aparece ao usuário.
    typesRequest: 'update',
    entityName: text.singularLabel,
    personalizedMessage: text.list.deletedToast,
    actionSuccess: () => {
      onCloseDeleteDialog();
      setToDelete(null);
    },
  });

  const handleDeleteClick = (authorizer: RequestAuthorizerListItem) => {
    setToDelete(authorizer);
    onOpenDeleteDialog();
  };

  const handleConfirmDelete = () => {
    if (toDelete) {
      deleteMutation.mutate({ authorizerUuid: toDelete.uuid });
    }
  };

  const isDeleting = deleteMutation.isPending;

  const columnHelper = createColumnHelper<RequestAuthorizerListItem>();
  const defaultColumns = useMemo(
    () => [
      columnHelper.accessor((row) => row.user?.name, {
        id: 'user',
        header: text.list.table.user,
        cell: ({ row }) => (
          <Text fontWeight="medium" lineClamp="1">
            {row.original.user?.name}
          </Text>
        ),
        meta: { gridLabel: text.list.table.user },
      }),
      columnHelper.accessor('created_at', {
        header: text.list.table.createdAt,
        cell: ({ row }) => (
          <Text fontSize="sm">
            {row.original.created_at ? formatDate(row.original.created_at, 'dd/MM/yyyy') : '-'}
          </Text>
        ),
        meta: { ...styleColumTable.sm, gridLabel: text.list.table.createdAt },
      }),
      columnHelper.accessor('max_value', {
        header: text.list.table.maxValue,
        cell: ({ row }) => (
          <Text fontSize="sm">
            {`${text.list.table.maxValueUpTo} ${formatCurrencyBRL(row.original.max_value ?? 0)}`}
          </Text>
        ),
        meta: { ...styleColumTable.sm, gridLabel: text.list.table.maxValue },
      }),
      columnHelper.accessor('number_quotes', {
        header: text.list.table.numberQuotes,
        cell: ({ row }) => <Text fontSize="sm">{row.original.number_quotes ?? '-'}</Text>,
        meta: { ...styleColumTable.sm, gridLabel: text.list.table.numberQuotes },
      }),
      columnHelper.accessor('expense_organizer', {
        header: text.list.table.expenseOrganizer,
        cell: ({ row }) => (
          <Badge colorPalette={row.original.expense_organizer ? 'green' : 'gray'} variant="subtle">
            {row.original.expense_organizer ? text.list.table.yes : text.list.table.no}
          </Badge>
        ),
        meta: { ...styleColumTable.sm, gridLabel: text.list.table.expenseOrganizer },
      }),
      columnHelper.accessor('is_conditional', {
        header: text.list.table.isConditional,
        cell: ({ row }) => (
          <Badge colorPalette={row.original.is_conditional ? 'green' : 'gray'} variant="subtle">
            {row.original.is_conditional ? text.list.table.yes : text.list.table.no}
          </Badge>
        ),
        meta: { ...styleColumTable.sm, gridLabel: text.list.table.isConditional },
      }),
      columnHelper.accessor('is_active', {
        header: text.list.table.isActive,
        cell: ({ row }) => (
          <Badge
            colorPalette={row.original.is_active ? 'green' : 'gray'}
            variant="subtle"
            py={1}
            px={3}
          >
            {row.original.is_active ? text.list.table.active : text.list.table.inactive}
          </Badge>
        ),
        meta: { ...styleColumTable.sm, gridLabel: text.list.table.isActive },
      }),
      columnHelper.accessor((row) => row.farms?.length ?? 0, {
        id: 'farms',
        header: text.list.table.farms,
        cell: ({ row }) => (
          <Text fontSize="sm" color="fg.muted">
            {row.original.farms?.length ?? 0} {text.list.table.farmsCount}
          </Text>
        ),
        meta: { ...styleColumTable.sm, gridLabel: text.list.table.farms },
      }),
      columnHelper.display({
        id: 'acoes',
        header: '',
        enableHiding: false,
        cell: ({ row }) => (
          <Flex justify="flex-end">
            <Actions size="sm">
              {/* "Visualizar" abre a tela própria (só `request-authorizers_view`);
                  não depende da permissão de editar (PAR-03). */}
              {canView && (
                <Actions.Item
                  icon={<Icon as={FiEye} />}
                  onClick={() =>
                    navigate(`/cadastros-base/autorizadores/${row.original.uuid}/visualizar`)
                  }
                >
                  {text.list.actions.view}
                </Actions.Item>
              )}
              {canEdit && (
                <Actions.Item
                  icon={<Icon as={FiEdit} />}
                  onClick={() => navigate(`/cadastros-base/autorizadores/${row.original.uuid}`)}
                >
                  {text.list.actions.edit}
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
        ),
        meta: {
          ...styleColumTable.sm,
          gridLabel: languageGB.defaltStrings.actions,
          gridOrder: 'fixed-end',
          gridDataColumn: false,
        },
      }),
    ],
    [navigate, isDeleting, canView, canEdit, canDelete, languageGB.defaltStrings.actions, text]
  );

  const gridSettings = useGridSettings<RequestAuthorizerListItem>({
    storageKey: AUTORIZADORES_STORAGE_KEY,
    storageScope: useGridStorageScope(),
    columns: defaultColumns,
  });
  const { columnOrder, setColumnOrder, columnVisibility, setColumnVisibility } = gridSettings;

  const isLoading = checkLoadingStatus([requestAuthorizersList]);
  const isError = requestAuthorizersList.isError;
  const items = requestAuthorizersList.data?.data?.items;
  const isEmpty = !isLoading && !isError && (items?.length ?? 0) === 0;

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
            isError={isError}
            error={requestAuthorizersList.error}
            isEmpty={isEmpty}
            onRetry={() => requestAuthorizersList.refetch()}
            isRetrying={requestAuthorizersList.isFetching}
            emptyIcon={FiShield as ElementType}
            emptyTitle={
              filtersApplied > 0
                ? text.list.emptyState.titleFiltered
                : canCreate
                  ? text.list.emptyState.titleEmpty
                  : text.list.emptyState.titleEmptyNoCreate
            }
            emptyDescription={
              filtersApplied > 0
                ? text.list.emptyState.descriptionFiltered
                : canCreate
                  ? text.list.emptyState.descriptionEmpty
                  : text.list.emptyState.descriptionEmptyNoCreate
            }
            canCreate={filtersApplied === 0 && canCreate}
            createLabel={text.list.emptyState.cta}
            onCreate={() => navigate('/cadastros-base/autorizadores/novo')}
          />
        </Box>
      </TableProvider>

      <FilterSideAutorizadores
        isOpen={isFilterOpen}
        onClose={onCloseFilter}
        handleFilterChange={handleFilterChange}
        handleReset={handleResetFilter}
        filter={paginatedQuery.filter}
        languageGB={languageGB}
        filtersApplied={filtersApplied}
      />

      <DeleteConfirmDialog
        isOpen={isOpenDeleteDialog}
        onClose={() => {
          onCloseDeleteDialog();
          setToDelete(null);
        }}
        onConfirm={handleConfirmDelete}
        isLoading={isDeleting}
        title={text.list.deleteConfirm.title}
        description={text.list.deleteConfirm.text}
        hideQuestionMark
        warningText=""
        tone="danger"
      />
    </ContainerGrid>
  );
}
