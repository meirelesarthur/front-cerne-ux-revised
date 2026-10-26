// src/pages/Administrativo/Funcoes/index.tsx
// -----------------------------------------------------------------------------
// Tela de LISTAGEM (grid) de FUNÇÕES — Administrativo / Gestão Pessoal
// (menu já existente, `adm-gp-fun`).
//
// Rota: /administrativo/funcoes (guardada por `functions_view`, registrada em
// src/router/index.tsx — este arquivo não mexe em rota/menu).
//
// Estrutura idêntica a CadastrosBase/Marcadores/index.tsx (grid flat REAL de
// servidor, paginação real):
//   - grid paginado (TableProvider + Table) via useFunctionsList;
//   - HeaderTable    → botões de ação (Add respeita functions_create);
//   - FilterSideFuncoes → drawer (search/is_enabled/cbo_uuid), COM
//     re-hidratação ao reabrir (prop `filter`, Contrato B canônico);
//   - delete via `useRequest` (095): invalida a listagem + toast `deletedToast`; com
//     vínculos a API devolve 422 genérico e o toast exibe a `message` da API
//     (não há mais diálogo de vínculos);
//
// Permissões: recurso SEM flag por item (`FunctionResource` não expõe
// `can_edit`/`can_delete`) — ações de linha usam permissão GLOBAL
// (`functions_edit`/`functions_delete`), mesmo padrão de Marker/FamiliaBens.
//
// `filtersApplied` exclui `cbo_uuid_label` da contagem do badge "Filtros(N)"
// (checklist item 5/13 — companheiro display-only do `SelectAsyncPaginate`,
// nunca conta como um filtro real).
// -----------------------------------------------------------------------------

import { useMemo, useState } from 'react';
import type { ElementType } from 'react';

import { Badge, Box, Flex, Icon, Text, useDisclosure } from '@chakra-ui/react';
import { createColumnHelper } from '@tanstack/react-table';
import { FiBriefcase, FiEdit, FiTrash2 } from 'react-icons/fi';
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

import { queryKey } from '@/constants/query-key';

import { deleteFunction } from '@/services/v2/Functions/function-service';

import type { FunctionFilterForm, FunctionListItem } from '@/@types/v2/Functions';

import { FilterSideFuncoes } from './FilterSideFuncoes';
import { HeaderTable } from './HeaderTable';
import { useFunctionsList } from './useFunctions';

import { PageHeader } from '@/components/ui/PageHeader';

// Companheiro display-only do `SelectAsyncPaginate` de `cbo_uuid` (checklist
// item 13) — nunca conta como filtro real na badge "Filtros(N)".
const DISPLAY_ONLY_FILTER_KEYS = ['cbo_uuid_label'];

// `base_salary` chega como string decimal do backend (`"2200.00"`, cast
// `decimal:2`) — formatação BRL local, mesmo padrão de outras telas do
// projeto que não compartilham um util central (ex.: PrevisaoDepreciacao).
function formatCurrencyBRL(value: string): string {
  return Number(value).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
}

export default function FuncoesList() {
  const { languageGB } = useLanguage();
  const navigate = useNavigate();
  const { can } = usePermissions();
  const text = languageGB.functions.function;

  const canCreate = can('functions_create');
  const canEdit = can('functions_edit');
  const canDelete = can('functions_delete');

  const defaultQueryOptions = useMemo(
    () => ({
      pageSize: 15,
      storageKey: 'AdministrativoFuncoes' + queryKey.functions.functionsList,
    }),
    []
  );

  const { paginatedQuery, handlePaginatedQuery, handleFilterChange, handleResetFilter } =
    userPaginatedQuery<FunctionFilterForm>(defaultQueryOptions);

  // ---- Estado de filtro (drawer) ------------------------------------------
  const { open: isFilterOpen, onOpen: onOpenFilter, onClose: onCloseFilter } = useDisclosure();

  const filtersApplied = useMemo(
    () =>
      Object.entries(paginatedQuery.filter ?? {}).filter(
        ([key, v]) =>
          !DISPLAY_ONLY_FILTER_KEYS.includes(key) && v !== undefined && v !== null && v !== ''
      ).length,
    [paginatedQuery.filter]
  );

  const functionsList = useFunctionsList({
    paginatedQuery,
    setPaginatedQuery: handlePaginatedQuery,
    filter: paginatedQuery.filter ?? undefined,
  });

  // ---- Estado de exclusão --------------------------------------------------
  const [toDelete, setToDelete] = useState<FunctionListItem | null>(null);
  const {
    open: isOpenDeleteDialog,
    onOpen: onOpenDeleteDialog,
    onClose: onCloseDeleteDialog,
  } = useDisclosure();

  const deleteMutation = useRequest({
    asyncFunction: async (functionUuid: string) => {
      await deleteFunction(functionUuid);
      return undefined;
    },
    queryKey: queryKey.functions.functionsList,
    typesRequest: 'update',
    entityName: text.singularLabel,
    personalizedMessage: text.list.deletedToast,
    actionSuccess: () => {
      onCloseDeleteDialog();
      setToDelete(null);
    },
  });

  const isDeleting = deleteMutation.isPending;

  const handleDeleteClick = (item: FunctionListItem) => {
    setToDelete(item);
    onOpenDeleteDialog();
  };

  const handleConfirmDelete = () => {
    if (toDelete) {
      // 422 (vínculos): o toast do `useRequest` exibe a `message` da API; aqui
      // só fecha o diálogo e mantém o item na lista.
      deleteMutation.mutate(toDelete.uuid, {
        onError: () => {
          onCloseDeleteDialog();
          setToDelete(null);
        },
      });
    }
  };

  const columnHelper = createColumnHelper<FunctionListItem>();
  const defaultColumns = useMemo(
    () => [
      columnHelper.accessor('name', {
        header: text.list.table.name,
        cell: ({ row }) => (
          <Text fontWeight="medium" lineClamp="1">
            {row.original.name}
          </Text>
        ),
      }),
      columnHelper.display({
        id: 'cbo',
        header: text.list.table.cbo,
        cell: ({ row }) => (
          <Text fontSize="sm" color="fg.muted" lineClamp="1">
            {row.original.cbo.code} — {row.original.cbo.description}
          </Text>
        ),
      }),
      columnHelper.accessor('base_salary', {
        header: text.list.table.baseSalary,
        cell: ({ row }) => <Text lineClamp="1">{formatCurrencyBRL(row.original.base_salary)}</Text>,
        meta: styleColumTable.sm,
      }),
      columnHelper.accessor('is_enabled', {
        header: text.list.table.active,
        cell: ({ row }) => (
          <Badge
            colorPalette={row.original.is_enabled ? 'green' : 'gray'}
            variant="subtle"
            py={1}
            px={3}
          >
            {row.original.is_enabled ? text.list.table.activeLabel : text.list.table.inactiveLabel}
          </Badge>
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
                  onClick={() => navigate(`/administrativo/funcoes/${row.original.uuid}`)}
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

  const isLoading = checkLoadingStatus([functionsList]);
  const items = functionsList.data?.data?.items;
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
            isError={functionsList.isError}
            error={functionsList.error}
            isEmpty={isEmpty}
            onRetry={() => functionsList.refetch()}
            isRetrying={functionsList.isFetching}
            retryLabel={text.list.error.retry}
            emptyIcon={FiBriefcase as ElementType}
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
            onCreate={() => navigate('/administrativo/funcoes/novo')}
          />
        </Box>
      </TableProvider>

      <FilterSideFuncoes
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
        itemName={toDelete?.name}
      />
    </ContainerGrid>
  );
}
