// src/pages/Operacional/Nutrition/index.tsx
// -----------------------------------------------------------------------------
// Tela de LISTAGEM (grid) de NUTRIÇÃO (Nutrition — Operacional / Consumo de
// Ração, F-050, esteira 066, TASK-NT-FE-02). Rota `/operacional/nutricao` —
// guardada por `<RequirePermission permission="nutrition_view">` (rota
// registrada nesta mesma Tarefa, `router/index.tsx`, ANTES do catch-all
// `/operacional/*`). Item de menu próprio em `navigationTree.ts`
// (`ope-pec-man-nut`, filho de "Manejo" — mirror EXATO de Sanitário/Pesagem/
// Desmama, mesmo grupo de permissão `ope-pec-man` que já incluía
// `nutrition_view/create/edit/delete` no `anyOf`).
//
// UX-GAP confirmado (ver `nutricao-fid-g3f-matriz.DRAFT.md` — `ux_root` não
// tem tela de Nutrição em `src/pages/operacional/`). Seguido o padrão
// vigente (`get_spa_ux_fidelity_pattern` + `get_pwa_grid_query_pattern`) —
// mirror estrutural de `Fabrica/FoodBeat/index.tsx` (grid V3:
// `useCustomGridQuery`/`userPaginatedQuery`/`useGridSettings`/
// `useGridStorageScope`) + `CadastrosBase/CentroCusto/{index.tsx,
// HeaderTable.tsx}` (Header em componente PRÓPRIO).
//
// Surfaces cobertas nesta Tarefa (`nutricao-fid-g3f-matriz.DRAFT.md`):
// SRF-01 (listagem), SRF-02 (filtro, decisão de incluir `employee_uuid` —
// `CLM-08`), SRF-08 (exclusão). SRF-03 (form criar/editar) FOI concluído em
// `TASK-NT-FE-03` — a ação "Editar" e o `ButtonAdd`/CTA de criação
// (`HeaderNutritionTable.tsx`) foram wirados nessa Tarefa, apontando para
// `/operacional/nutricao/novo`/`/operacional/nutricao/:id`. SRF-07
// (visualizar) foi wirada em `TASK-NT-FE-05` — ação "Ver" (gate
// `nutrition_view`, mesmo grupo já usado pela própria rota da listagem)
// navega para `/operacional/nutricao/:uuid/visualizar`, repassando
// `employee_or_user_name` (já resolvido pelo backend nesta listagem, `LST-01`)
// via `navigate(path, { state })` — MELHOR ESFORÇO para o campo "Responsável"
// da visualização, já que `GET /nutritions/{uuid}` não devolve essa
// informação (ver docblock de `ViewNutrition.tsx`).
//
// Coluna `time_control` NÃO adicionada (Risco 1 da ficha) — fidelidade ao
// `LST-01` do legado, que nunca exibiu esse campo na grid.
// -----------------------------------------------------------------------------

import { useMemo, useState } from 'react';

import { Box, EmptyState, Flex, Icon, Text, useDisclosure, VStack } from '@chakra-ui/react';
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
import formatDate from '@/utils/formatDate';
import { styleColumTable } from '@/utils/style-colum-table';

import { queryKey } from '@/constants/query-key';

import { deleteNutrition, listNutritions } from '@/services/v2/Nutritions/nutrition-service';
import type { ListNutritionsParams } from '@/services/v2/Nutritions/nutrition-service';

import type { NutritionFilterForm, NutritionListItem } from '@/@types/v2/Nutritions';

import { FilterSideNutrition } from './FilterSideNutrition';
import { HeaderNutritionTable } from './HeaderNutritionTable';

// Chave de storage desta tela — módulo + queryKey derivada da tradução
// (`queryKey.nutritions.nutritions`, TASK-NT-FE-01), mesma expressão para
// paginação (`userPaginatedQuery`) e personalização de grid
// (`useGridSettings`), nunca literal cru repetido.
const NUTRITION_STORAGE_KEY = 'OperacionalNutricao' + queryKey.nutritions.nutritions;

// Achatamento `NutritionFilterForm` (Option-based, TASK-NT-FE-01) →
// `ListNutritionsParams` (querystring real de `GET /nutritions`) — mirror
// `FoodBeatList::toRequestFilter`.
function toRequestFilter(filter?: NutritionFilterForm | null): ListNutritionsParams {
  return {
    start_date: filter?.start_date || undefined,
    end_date: filter?.end_date || undefined,
    product_uuid: filter?.product_uuid?.value || undefined,
    batch_uuid: filter?.batch_uuid?.value || undefined,
    employee_uuid: filter?.employee_uuid?.value || undefined,
  };
}

function formatQuantity(value: number | string): string {
  const numeric = Number(value) || 0;
  return numeric.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function NutritionList() {
  const navigate = useNavigate();
  const { languageGB } = useLanguage();
  const { can } = usePermissions();
  const text = languageGB.nutritions.nutrition;

  const defaultQueryOptions = useMemo(
    () => ({
      pageSize: 10,
      storageKey: NUTRITION_STORAGE_KEY,
    }),
    []
  );

  const { paginatedQuery, handlePaginatedQuery, handleFilterChange, handleResetFilter } =
    userPaginatedQuery<NutritionFilterForm>(defaultQueryOptions);

  // ---- Estado de filtro (drawer) ------------------------------------------
  const { open: isFilterOpen, onOpen: onOpenFilter, onClose: onCloseFilter } = useDisclosure();

  const filtersApplied = useMemo(
    () =>
      Object.values(paginatedQuery.filter ?? {}).filter(
        (v) => v !== undefined && v !== null && v !== ''
      ).length,
    [paginatedQuery.filter]
  );

  const requestFilter = useMemo(
    () => toRequestFilter(paginatedQuery.filter),
    [paginatedQuery.filter]
  );

  // Listagem global por fazenda (X-Farm-Id) — SEM `registrationId`
  // (`useCustomGridQuery`, não `useCustomGridQueryById`, conforme a Tarefa).
  const nutritionsList = useCustomGridQuery<NutritionListItem, ListNutritionsParams>({
    asyncFunction: listNutritions,
    queryKey: queryKey.nutritions.nutritions,
    paginatedQuery,
    setPaginatedQuery: handlePaginatedQuery,
    filterQuery: [],
    filter: requestFilter,
  });

  // ---- Estado de exclusão (fiel ao legado — SEM reversão de estoque,
  // GAP-NT-01 [PARA ANÁLISE], decisão do dono pendente) ----------------------
  const [toDelete, setToDelete] = useState<NutritionListItem | null>(null);
  const {
    open: isOpenDeleteDialog,
    onOpen: onOpenDeleteDialog,
    onClose: onCloseDeleteDialog,
  } = useDisclosure();

  const deleteMutation = useRequest({
    asyncFunction: async ({ nutritionUuid }: { nutritionUuid: string }) => {
      return await deleteNutrition(nutritionUuid);
    },
    queryKey: queryKey.nutritions.nutritions,
    typesRequest: 'apply',
    entityName: text.singularLabel,
    personalizedMessage: text.list.deletedToast,
    actionSuccess: () => {
      onCloseDeleteDialog();
      setToDelete(null);
    },
  });

  const handleDeleteClick = (nutrition: NutritionListItem) => {
    setToDelete(nutrition);
    onOpenDeleteDialog();
  };

  const handleConfirmDelete = () => {
    if (toDelete) {
      deleteMutation.mutate({ nutritionUuid: toDelete.uuid });
    }
  };

  const isDeleting = deleteMutation.isPending;

  const canDelete = can('nutrition_delete');
  const canEdit = can('nutrition_edit');
  const canView = can('nutrition_view');

  // Colunas ORDEM FIEL a `LST-01`: code, date, responsável, áreas/pastejos,
  // lotes, produtos, quantidade total, ações. SEM `time_control` (Risco 1).
  const columnHelper = createColumnHelper<NutritionListItem>();
  const defaultColumns = useMemo(
    () => [
      columnHelper.accessor('code', {
        header: text.list.columns.code,
        cell: ({ row }) => (
          <Text fontFamily="mono" fontSize="sm" fontWeight="medium">
            {row.original.code}
          </Text>
        ),
        meta: { ...styleColumTable.sm, gridLabel: text.list.columns.code },
      }),
      columnHelper.accessor('date', {
        header: text.list.columns.date,
        cell: ({ row }) => (
          <Text fontSize="sm" color="fg.muted">
            {row.original.date ? formatDate(row.original.date, 'dd/MM/yyyy') : '—'}
          </Text>
        ),
        meta: { ...styleColumTable.date, gridLabel: text.list.columns.date },
      }),
      columnHelper.accessor('employee_or_user_name', {
        header: text.list.columns.employeeOrUser,
        cell: ({ row }) => (
          <Text fontSize="sm" lineClamp="1">
            {row.original.employee_or_user_name || '—'}
          </Text>
        ),
        meta: { gridLabel: text.list.columns.employeeOrUser },
      }),
      columnHelper.accessor('areas_grazings', {
        header: text.list.columns.areasGrazings,
        cell: ({ row }) => (
          <Text fontSize="sm" lineClamp="1">
            {row.original.areas_grazings || '—'}
          </Text>
        ),
        meta: { gridLabel: text.list.columns.areasGrazings },
      }),
      columnHelper.accessor('batches', {
        header: text.list.columns.batches,
        cell: ({ row }) => (
          <Text fontSize="sm" lineClamp="1">
            {row.original.batches || '—'}
          </Text>
        ),
        meta: { gridLabel: text.list.columns.batches },
      }),
      columnHelper.accessor('products', {
        header: text.list.columns.products,
        cell: ({ row }) => (
          <Text fontSize="sm" lineClamp="1">
            {row.original.products || '—'}
          </Text>
        ),
        meta: { gridLabel: text.list.columns.products },
      }),
      columnHelper.accessor('quantity_total', {
        header: text.list.columns.quantity,
        cell: ({ row }) => (
          <Text fontSize="sm" textAlign="right" fontVariantNumeric="tabular-nums">
            {formatQuantity(row.original.quantity_total)}
          </Text>
        ),
        meta: { ...styleColumTable.sm, gridLabel: text.list.columns.quantity },
      }),
      columnHelper.display({
        id: 'acoes',
        header: '',
        enableHiding: false,
        cell: ({ row }) => (
          <Flex justify="flex-end">
            <Actions size="sm">
              {canView && (
                <Actions.Item
                  icon={<Icon as={FiEye} />}
                  onClick={() =>
                    navigate(`/operacional/nutricao/${row.original.uuid}/visualizar`, {
                      state: { employeeOrUserName: row.original.employee_or_user_name },
                    })
                  }
                >
                  {text.list.actions.view}
                </Actions.Item>
              )}
              {canEdit && (
                <Actions.Item
                  icon={<Icon as={FiEdit} />}
                  onClick={() => navigate(`/operacional/nutricao/${row.original.uuid}`)}
                >
                  {text.list.actions.edit}
                </Actions.Item>
              )}
              {canDelete && (
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
    [isDeleting, canDelete, canEdit, canView, navigate, text, languageGB.defaltStrings.actions]
  );

  const gridSettings = useGridSettings<NutritionListItem>({
    storageKey: NUTRITION_STORAGE_KEY,
    storageScope: useGridStorageScope(),
    columns: defaultColumns,
  });
  const { columnOrder, setColumnOrder, columnVisibility, setColumnVisibility } = gridSettings;

  const isLoading = checkLoadingStatus([nutritionsList]);
  const items = nutritionsList.data?.data?.items;
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
            <HeaderNutritionTable
              onOpenFilter={onOpenFilter}
              filtersApplied={filtersApplied}
              languageGB={languageGB}
              gridSettings={gridSettings}
            />
          }
        >
          <VStack align="flex-start" gap={1}>
            <Text fontSize="2xl" fontWeight="bold" color="brandColorText">
              {text.singularLabel}
            </Text>
          </VStack>
        </HeaderGrid>

        <Box mt={6}>
          {isEmpty && !nutritionsList.isError ? (
            <EmptyState.Root>
              <EmptyState.Content>
                <EmptyState.Indicator>
                  <Icon as={FiPackage} boxSize={8} color="fg.muted" />
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
              </EmptyState.Content>
            </EmptyState.Root>
          ) : (
            <Table
              isLoading={isLoading}
              isError={nutritionsList.isError}
              error={nutritionsList.error}
              onRetry={() => nutritionsList.refetch()}
              isRetrying={nutritionsList.isFetching}
            />
          )}
        </Box>
      </TableProvider>

      <FilterSideNutrition
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
