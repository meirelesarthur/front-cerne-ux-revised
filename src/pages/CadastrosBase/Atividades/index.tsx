// src/pages/CadastrosBase/Atividades/index.tsx
// -----------------------------------------------------------------------------
// Tela de LISTAGEM (grid FLAT — sem hierarquia) de ATIVIDADES (Activity) —
// Cadastros Base / Agrícolas (TASK-FE-026).
// Rota: /cadastros-base/atividades (guardada por `activities_view`,
// registrada em src/router/index.tsx — este arquivo não mexe em rota/menu,
// que é a TASK-FE-028).
//
// Referência UX: UX-GAP (nenhum design dedicado no `cerne` — confirmado em
// Activity-contrato.md §14). Molde direto CadastrosBase/TiposTitulo/index.tsx
// (paginação REAL server-side, mesmo shape de estado/filtro/delete). 5
// colunas fiéis ao legado (`../agro365/resources/views/activities/index.blade.php`):
// name/description/vl_hectare/is_enabled + ações. `type`/`use`/`operations`
// NÃO aparecem na grid (o legado também não exibia essas colunas na
// listagem) — disponíveis só como filtro (type/use).
//
// PENDÊNCIA REGISTRADA (não bloqueia a entrega — autorizado pela Tarefa):
// filtro por `operation_id` omitido do drawer — confirmado por leitura direta
// de `GB.Cerne.Api/routes/api.php`: não existe NENHUM endpoint de `Operation`
// no fork (nem `/api/v1/operations`, nem rota legada equivalente). Ver
// FilterSideAtividades.tsx para o detalhe.
// -----------------------------------------------------------------------------

import { useMemo, useState, type ElementType } from 'react';

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

import { deleteActivity } from '@/services/v2/Activities/activity-service';

import type { ActivityFilterForm, ActivityListItem } from '@/@types/v2/Activities';

import { FilterSideAtividades } from './FilterSideAtividades';
import { HeaderTable } from './HeaderTable';
import { useActivityList } from './useActivities';

import { PageHeader } from '@/components/ui/PageHeader';

// Formatação de moeda pt-BR do `vl_hectare` — nenhum helper equivalente em
// `src/utils` (busca confirmada antes de codar); `Intl.NumberFormat` nativo,
// mesma solução sugerida pela Tarefa.
const currencyFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
});

export default function AtividadesList() {
  const { languageGB } = useLanguage();
  const navigate = useNavigate();
  const { can } = usePermissions();
  const text = languageGB.activities.activity;

  const canCreate = can('activities_create');
  const canEdit = can('activities_edit');
  const canDelete = can('activities_delete');

  const defaultQueryOptions = useMemo(
    () => ({
      pageSize: 10,
      storageKey: 'CadastrosBaseAtividades' + queryKey.activities.list,
    }),
    []
  );

  const { paginatedQuery, handlePaginatedQuery, handleFilterChange, handleResetFilter } =
    userPaginatedQuery<ActivityFilterForm>(defaultQueryOptions);

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
  const [toDelete, setToDelete] = useState<ActivityListItem | null>(null);
  const {
    open: isOpenDeleteDialog,
    onOpen: onOpenDeleteDialog,
    onClose: onCloseDeleteDialog,
  } = useDisclosure();

  const activitiesList = useActivityList({
    paginatedQuery,
    setPaginatedQuery: handlePaginatedQuery,
    filter: paginatedQuery.filter ?? undefined,
  });

  const deleteMutation = useRequest({
    asyncFunction: async ({ activityUuid }: { activityUuid: string }) => {
      return await deleteActivity(activityUuid);
    },
    queryKey: queryKey.activities.list,
    queryKey2: queryKey.activities.detail,
    // `useRequest`'s TypesRequest não tem variante "delete" — "update" é a
    // mesma convenção usada por TiposTitulo/CategoryMatrix/LowReason para a
    // mesma operação. O texto exibido no toast vem de `personalizedMessage`,
    // então o rótulo genérico associado a "update" nunca aparece ao usuário.
    //
    // onError: NÃO customizado — usa o tratamento genérico interno do
    // useRequest (lê `message`/`error` do envelope). A API deixa subir ao
    // Handler global o erro de negócio (ex.: Activity em uso em
    // `activity_cost_centers`, Activity-contrato.md §9) — nenhum tratamento
    // especial de código é necessário.
    typesRequest: 'update',
    entityName: text.singularLabel,
    personalizedMessage: text.list.deletedToast,
    actionSuccess: () => {
      onCloseDeleteDialog();
      setToDelete(null);
    },
  });

  const handleDeleteClick = (activity: ActivityListItem) => {
    setToDelete(activity);
    onOpenDeleteDialog();
  };

  const handleConfirmDelete = () => {
    if (toDelete) {
      deleteMutation.mutate({ activityUuid: toDelete.uuid });
    }
  };

  const isDeleting = deleteMutation.isPending;

  const columnHelper = createColumnHelper<ActivityListItem>();
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
      columnHelper.accessor('description', {
        header: text.list.table.description,
        cell: ({ row }) => <Text lineClamp="1">{row.original.description || '—'}</Text>,
      }),
      columnHelper.accessor('vl_hectare', {
        header: text.list.table.vlHectare,
        cell: ({ row }) => (
          <Text fontWeight="medium">{currencyFormatter.format(row.original.vl_hectare)}</Text>
        ),
        meta: styleColumTable.md,
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
                  onClick={() => navigate(`/cadastros-base/atividades/${row.original.uuid}`)}
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

  const isLoading = checkLoadingStatus([activitiesList]);
  const items = activitiesList.data?.data?.items;
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
            isError={activitiesList.isError}
            error={activitiesList.error}
            isEmpty={isEmpty}
            onRetry={() => activitiesList.refetch()}
            isRetrying={activitiesList.isFetching}
            emptyIcon={FiFileText as ElementType}
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
            onCreate={() => navigate('/cadastros-base/atividades/novo')}
          />
        </Box>
      </TableProvider>

      <FilterSideAtividades
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
