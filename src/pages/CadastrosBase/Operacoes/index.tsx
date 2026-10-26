// src/pages/CadastrosBase/Operacoes/index.tsx
// -----------------------------------------------------------------------------
// Tela de LISTAGEM (grid FLAT — sem hierarquia) de OPERAÇÕES (Operation) —
// Cadastros Base / Agrícolas (TASK-FE-042).
// Rota: /cadastros-base/operacoes (guardada por `operations_view`,
// registrada em src/router/index.tsx — este arquivo não mexe em rota/menu,
// que é a TASK-FE-044).
//
// Referência UX: UX-GAP (nenhum design dedicado no `cerne` para Operações,
// mapeamento do Maestro) — espelha CadastrosBase/Atividades/index.tsx (mesmo
// grupo "Agrícolas", grid flat, paginação REAL server-side, mesmo shape de
// estado/filtro/delete). Colunas fiéis ao legado (Doc Bruta §2/§4):
// name/grouper_name/order/is_enabled + ações — `description`/`use` NÃO
// aparecem na grid (o legado também não exibia — `use` fica disponível só
// como filtro, mesmo padrão de Atividades com `type`/`use`).
//
// Filtro por Agrupador (`grouper_uuid`, GAP-FE-006 resolvido) RE-HABILITADO
// no drawer — ver FilterSideOperacoes.tsx.
// -----------------------------------------------------------------------------

import { useMemo, useState } from 'react';

import { Badge, Box, Flex, Icon, Text, useDisclosure } from '@chakra-ui/react';
import { createColumnHelper } from '@tanstack/react-table';
import { FiEdit, FiFileText, FiTrash2 } from 'react-icons/fi';
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

import { deleteOperation } from '@/services/v2/Operations/operation-service';

import type { OperationFilterForm, OperationListItem } from '@/@types/v2/Operations';

import { FilterSideOperacoes } from './FilterSideOperacoes';
import { HeaderTable } from './HeaderTable';
import { useOperationList } from './useOperations';

import { PageHeader } from '@/components/ui/PageHeader';

export default function OperacoesList() {
  const { languageGB } = useLanguage();
  const navigate = useNavigate();
  const { can } = usePermissions();
  const text = languageGB.operations.operation;

  const canCreate = can('operations_create');
  const canEdit = can('operations_edit');
  const canDelete = can('operations_delete');

  const defaultQueryOptions = useMemo(
    () => ({
      pageSize: 10,
      storageKey: 'CadastrosBaseOperacoes' + queryKey.operations.list,
    }),
    []
  );

  const { paginatedQuery, handlePaginatedQuery, handleFilterChange, handleResetFilter } =
    userPaginatedQuery<OperationFilterForm>(defaultQueryOptions);

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
  const [toDelete, setToDelete] = useState<OperationListItem | null>(null);
  const {
    open: isOpenDeleteDialog,
    onOpen: onOpenDeleteDialog,
    onClose: onCloseDeleteDialog,
  } = useDisclosure();

  const operationsList = useOperationList({
    paginatedQuery,
    setPaginatedQuery: handlePaginatedQuery,
    filter: paginatedQuery.filter ?? undefined,
  });

  const deleteMutation = useRequest({
    asyncFunction: async ({ operationUuid }: { operationUuid: string }) => {
      return await deleteOperation(operationUuid);
    },
    queryKey: queryKey.operations.list,
    queryKey2: queryKey.operations.detail,
    // `useRequest`'s TypesRequest não tem variante "delete" — "update" é a
    // mesma convenção usada por Atividades/TiposTitulo/Groupers para a mesma
    // operação. O rótulo genérico associado a "update" nunca aparece ao
    // usuário porque `personalizedMessage` sobrescreve o toast.
    //
    // onError: NÃO customizado — tratamento genérico interno do `useRequest`
    // (D8 do contrato: 500 genérico se a Operação estiver vinculada a alguma
    // Atividade via `operation_activities`, sem try/catch amigável, mesmo
    // precedente de `DeleteActivityAction`).
    typesRequest: 'update',
    entityName: text.singularLabel,
    personalizedMessage: text.list.deletedToast,
    actionSuccess: () => {
      onCloseDeleteDialog();
      setToDelete(null);
    },
  });

  const handleDeleteClick = (operation: OperationListItem) => {
    setToDelete(operation);
    onOpenDeleteDialog();
  };

  const handleConfirmDelete = () => {
    if (toDelete) {
      deleteMutation.mutate({ operationUuid: toDelete.uuid });
    }
  };

  const isDeleting = deleteMutation.isPending;

  const columnHelper = createColumnHelper<OperationListItem>();
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
      columnHelper.accessor('grouper_name', {
        header: text.list.table.grouper,
        cell: ({ row }) => (
          <Text lineClamp="1">{row.original.grouper_name || text.list.table.noGrouper}</Text>
        ),
      }),
      columnHelper.accessor('order', {
        header: text.list.table.order,
        cell: ({ row }) => <Text>{row.original.order}</Text>,
        meta: styleColumTable.sm,
      }),
      columnHelper.accessor('is_enabled', {
        header: text.list.table.status,
        cell: ({ row }) => (
          <Badge
            colorPalette={row.original.is_enabled ? 'green' : 'gray'}
            variant="subtle"
            py={1}
            px={3}
          >
            {row.original.is_enabled ? text.list.table.active : text.list.table.inactive}
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
                  onClick={() => navigate(`/cadastros-base/operacoes/${row.original.uuid}`)}
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

  const isLoading = checkLoadingStatus([operationsList]);
  const items = operationsList.data?.data?.items;
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
            isError={operationsList.isError}
            error={operationsList.error}
            isEmpty={isEmpty}
            onRetry={() => operationsList.refetch()}
            isRetrying={operationsList.isFetching}
            emptyIcon={FiFileText}
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
            onCreate={() => navigate('/cadastros-base/operacoes/novo')}
          />
        </Box>
      </TableProvider>

      <FilterSideOperacoes
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
