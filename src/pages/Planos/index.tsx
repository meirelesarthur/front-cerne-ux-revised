// src/pages/Planos/index.tsx
// -----------------------------------------------------------------------------
// Tela de LISTAGEM (grid) de PLANOS (PlanRole) — TASK-FE-2701. Substitui o
// placeholder anterior (`ModulePlaceholder`) pela grid real. Depende de
// `TASK-FE-2700` (service/tipos/i18n/query-key).
//
// UX-GAP declarado (ver Tarefa): o único artefato "Planos" do Storybook
// `cerne` (`GB.Cerne.UX/src/pages/planos/PlanosPage.tsx`) é a vitrine PÚBLICA
// de contratação — NÃO é a tela de BACK-OFFICE que este módulo precisa
// (CRUD administrativo de `PlanRole`). Seguir-pelo-padrão: mirror estrutural
// de `Configuracoes/Apps/index.tsx` (grid+filtro+exclusão via TableProvider/
// HeaderGrid/DeleteConfirmDialog) + `CadastrosBase/CentroCusto/index.tsx`
// (`useGridSettings`/`GridSettingsFloatingPanel`, protocolo
// `padrao-frontend-gb-cerne-v2` ponto 8).
//
// `PlanRole` é catálogo GLOBAL (sem `farm_id`/`tenant_id`, confirmado no
// Model/migration) — `useCustomGridQuery` SEM ID de contexto, NUNCA
// `useCustomGridQueryById`/`useCustomGridQueryByGuid` (mesma armadilha já
// documentada em `Apps/index.tsx`).
// -----------------------------------------------------------------------------

import { useMemo, useState } from 'react';

import type { ElementType } from 'react';

import { Badge, Box, Flex, Icon, Text, useDisclosure } from '@chakra-ui/react';
import { createColumnHelper } from '@tanstack/react-table';
import { FiEdit, FiEye, FiPackage, FiTrash2 } from 'react-icons/fi';
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

import { deletePlanRole, listPlanRoles } from '@/services/v2/Planos/planRole-service';

import type { PlanRoleFilterForm, PlanRoleListItem } from '@/@types/v2/Planos';

import { FilterSidePlanos } from './FilterSidePlanos';
import { HeaderTable } from './HeaderTable';

import { PageHeader } from '@/components/ui/PageHeader';

// Chave de storage desta tela — paginação (`userPaginatedQuery`) e
// personalização de grid (`useGridSettings`) derivam da MESMA expressão para
// nunca divergirem (protocolo `padrao-frontend-gb-cerne-v2`).
const PLANOS_STORAGE_KEY = 'Planos' + queryKey.planos.planRoles;

export default function PlanosList() {
  const { languageGB } = useLanguage();
  const navigate = useNavigate();
  const { can } = usePermissions();
  const text = languageGB.planos.planRole;

  const canCreate = can('plan_create');

  const defaultQueryOptions = useMemo(
    () => ({
      pageSize: 10,
      storageKey: PLANOS_STORAGE_KEY,
    }),
    []
  );

  const { paginatedQuery, handlePaginatedQuery, handleFilterChange, handleResetFilter } =
    userPaginatedQuery<PlanRoleFilterForm>(defaultQueryOptions);

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
  const [toDelete, setToDelete] = useState<PlanRoleListItem | null>(null);
  const {
    open: isOpenDeleteDialog,
    onOpen: onOpenDeleteDialog,
    onClose: onCloseDeleteDialog,
  } = useDisclosure();

  // Catálogo GLOBAL (sem farm_id/tenant_id) — `useCustomGridQuery` SEM ID de
  // contexto. NUNCA `useCustomGridQueryById`/`useCustomGridQueryByGuid` aqui.
  const planRolesList = useCustomGridQuery<PlanRoleListItem, PlanRoleFilterForm>({
    asyncFunction: listPlanRoles,
    queryKey: queryKey.planos.planRoles,
    paginatedQuery,
    setPaginatedQuery: handlePaginatedQuery,
    filterQuery: [],
    filter: {
      search: paginatedQuery.filter?.search,
      is_free: paginatedQuery.filter?.is_free,
    },
  });

  const deleteMutation = useRequest({
    asyncFunction: async ({ planRoleUuid }: { planRoleUuid: string }) => {
      return await deletePlanRole(planRoleUuid);
    },
    queryKey: queryKey.planos.planRoles,
    queryKey2: queryKey.planos.planRole,
    // `useRequest` não tem variante "delete" (só update/create/apply/export/
    // revoke/restore) — "update" é a única opção compilável, mesmo padrão de
    // Apps/CentroCusto para a mesma operação.
    typesRequest: 'update',
    entityName: text.singularLabel,
    personalizedMessage: text.list.deletedToast,
    actionSuccess: () => {
      onCloseDeleteDialog();
      setToDelete(null);
    },
  });

  const handleDeleteClick = (planRole: PlanRoleListItem) => {
    setToDelete(planRole);
    onOpenDeleteDialog();
  };

  const handleConfirmDelete = () => {
    if (toDelete) {
      deleteMutation.mutate({ planRoleUuid: toDelete.uuid });
    }
  };

  const isDeleting = deleteMutation.isPending;

  const columnHelper = createColumnHelper<PlanRoleListItem>();
  const defaultColumns = useMemo(
    () => [
      columnHelper.accessor('name', {
        header: text.list.table.name,
        enableHiding: false,
        cell: ({ row }) => (
          <Text fontSize="sm" fontWeight="medium">
            {row.original.name}
          </Text>
        ),
        meta: { gridLabel: text.list.table.name },
      }),
      columnHelper.accessor('price', {
        header: text.list.table.price,
        cell: ({ row }) => <Text fontSize="sm">R$ {row.original.price.toFixed(2)}</Text>,
        meta: { ...styleColumTable.sm, gridLabel: text.list.table.price },
      }),
      columnHelper.accessor('interval_days', {
        header: text.list.table.intervalDays,
        cell: ({ row }) => <Text fontSize="sm">{row.original.interval_days}</Text>,
        meta: { ...styleColumTable.sm, gridLabel: text.list.table.intervalDays },
      }),
      columnHelper.accessor((row) => row.role?.name ?? '', {
        id: 'mainRole',
        header: text.list.table.mainRole,
        cell: ({ row }) => (
          <Text fontSize="sm" color={row.original.role ? 'fg.default' : 'fg.muted'}>
            {row.original.role?.name ?? text.list.table.noRole}
          </Text>
        ),
        meta: { gridLabel: text.list.table.mainRole },
      }),
      columnHelper.accessor('animals_limit', {
        header: text.list.table.farmLimit,
        cell: ({ row }) => <Text fontSize="sm">{row.original.animals_limit}</Text>,
        meta: { ...styleColumTable.sm, gridLabel: text.list.table.farmLimit },
      }),
      columnHelper.accessor('is_free', {
        header: text.list.table.isFree,
        cell: ({ row }) => (
          <Badge colorPalette={row.original.is_free ? 'green' : 'gray'} variant="subtle">
            {row.original.is_free ? text.list.table.freeLabel : text.list.table.paidLabel}
          </Badge>
        ),
        meta: { ...styleColumTable.sm, gridLabel: text.list.table.isFree },
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
                onClick={() => navigate(`/planos/${row.original.uuid}/detalhe`)}
              >
                {text.list.actions.view}
              </Actions.Item>
              {can('plan_edit') && (
                <Actions.Item
                  icon={<Icon as={FiEdit} />}
                  onClick={() => navigate(`/planos/${row.original.uuid}`)}
                >
                  {text.list.actions.edit}
                </Actions.Item>
              )}
              {can('plan_delete') && (
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
        meta: {
          ...styleColumTable.sm,
          gridLabel: languageGB.defaltStrings.actions,
          gridOrder: 'fixed-end',
          gridDataColumn: false,
        },
      }),
    ],
    [navigate, isDeleting, can, languageGB.defaltStrings.actions, text]
  );

  const gridSettings = useGridSettings<PlanRoleListItem>({
    storageKey: PLANOS_STORAGE_KEY,
    storageScope: useGridStorageScope(),
    columns: defaultColumns,
  });
  const { columnOrder, setColumnOrder, columnVisibility, setColumnVisibility } = gridSettings;

  const isLoading = checkLoadingStatus([planRolesList]);
  const items = planRolesList.data?.data?.items;
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
              gridSettings={gridSettings}
            />
          }
        >
          <PageHeader title={text.list.pageTitle} description={text.list.pageSubtitle} />
        </HeaderGrid>

        <Box mt={6}>
          <Table
            isLoading={isLoading}
            isError={planRolesList.isError}
            error={planRolesList.error}
            isEmpty={isEmpty}
            onRetry={() => planRolesList.refetch()}
            isRetrying={planRolesList.isFetching}
            emptyIcon={FiPackage as ElementType}
            emptyTitle={
              filtersApplied > 0 ? text.list.emptyState.titleFiltered : text.list.emptyState.title
            }
            emptyDescription={
              filtersApplied > 0
                ? text.list.emptyState.descriptionFiltered
                : text.list.emptyState.description
            }
            canCreate={filtersApplied === 0 && canCreate}
            onCreate={() => navigate('/planos/create')}
            createLabel={text.list.emptyState.cta}
          />
        </Box>
      </TableProvider>

      <FilterSidePlanos
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
        itemName={toDelete?.name}
        tone="danger"
      />
    </ContainerGrid>
  );
}
