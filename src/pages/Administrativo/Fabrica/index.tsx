// src/pages/Administrativo/Fabrica/index.tsx
// -----------------------------------------------------------------------------
// Tela de LISTAGEM (grid) de FORMULAÇÃO (Food — Fábrica/Ração,
// TASK-FOOD-FE-05). Rota `/administrativo/fabrica/formulacao` — guardada por
// `<RequirePermission permission="food_view">` (rota conectada em
// `TASK-FOOD-FE-07`, fora do escopo deste arquivo).
//
// UX-GAP confirmado (ver ficha) — nenhuma página Food/Formulação/Ração em
// `GB.Cerne.UX/src/pages`. Base = Blade legado (`index.blade.php`, Doc Bruta
// Food §7) + padrão de listagem já consolidado no `frontend_root`
// (`Warehouses/index.tsx` — GridSettings/`useGridSettings`+
// `GridSettingsFloatingPanel`, `SaldoEstoque/index.tsx` — `useCustomGridQuery`
// inline).
//
// Divergência EXPLÍCITA e autorizada da regra global #1 do protocolo
// (`padrao-frontend-gb-cerne-v2`, "ações de linha: somente Editar e
// Excluir"): esta grid tem 4 ações (Editar/Excluir/Duplicar/Imprimir) —
// fidelidade ao Blade legado (`index.blade.php`, os mesmos 4 `@can(...)` das
// linhas 14,75,79,83,87,91 da Doc Bruta) + precedente real de extensão já
// aceito no projeto (PlanAccount, TASK-PA-07/08/09). "Duplicar" reusa a
// permissão `food_create` (fidelidade à Doc Bruta §7, não `food_view`).
// -----------------------------------------------------------------------------

import { ElementType, useMemo, useState } from 'react';

import { Badge, Box, Flex, Icon, Text, useDisclosure } from '@chakra-ui/react';
import { createColumnHelper } from '@tanstack/react-table';
import { FiCopy, FiEdit, FiFileText, FiPackage, FiTrash2 } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';

import { Actions } from '@/components/Action';
import { ButtonAdd } from '@/components/ButtonAdd';
import { ButtonFilter } from '@/components/ButtonFilter';
import { ContainerGrid } from '@/components/ContainerGrid';
import { DeleteConfirmDialog } from '@/components/DeleteConfirmDialog';
import { GridSettingsFloatingPanel } from '@/components/GridSettings/GridSettingsFloatingPanel';
import { HeaderGrid } from '@/components/HeaderGrid';
import { Table } from '@/components/Table';
import { toaster } from '@/components/ui/toaster';

import { TableProvider } from '@/contexts/TableContext';

import { useCustomGridQuery } from '@/hooks/useCustomGridQuery';
import { useGridSettings } from '@/hooks/useGridSettings';
import { useGridStorageScope } from '@/hooks/useGridStorageScope';
import { useLanguage } from '@/hooks/useLanguage';
import { userPaginatedQuery } from '@/hooks/usePaginatedQueryStorage';
import { usePermissions } from '@/hooks/usePermissions';
import { useRequest } from '@/hooks/useRequest';

import { checkLoadingStatus } from '@/utils/checkLoadingStatus';
import { downloadBlob } from '@/utils/downloadBlob';
import formatDate from '@/utils/formatDate';
import { styleColumTable } from '@/utils/style-colum-table';

import { foodTypeLabel } from '@/constants/foods/food-type';
import { queryKey } from '@/constants/query-key';

import {
  deleteFood,
  duplicateFood,
  getFoodReport,
  listFoods,
} from '@/services/v2/Foods/food-service';
import type { ListFoodsParams } from '@/services/v2/Foods/food-service';

import type { FoodFilterForm, FoodListItem, FoodType } from '@/@types/v2/Foods';

import { FilterSideFabrica } from './FilterSideFabrica';

import { PageHeader } from '@/components/ui/PageHeader';

// Cor do Badge de Tipo por valor — puramente cosmético/ajustável, mirror
// `TYPE_BADGE_COLOR` de `Warehouses/index.tsx`.
const TYPE_BADGE_COLOR: Record<FoodType, string> = {
  P: 'purple',
  U: 'blue',
};

// Chave de storage desta tela. Paginação (`userPaginatedQuery`) e
// personalização de grid (`useGridSettings`) derivam da MESMA expressão para
// nunca divergirem (mesmo padrão de `Warehouses`/`SaldoEstoque`).
const FABRICA_STORAGE_KEY = 'AdministrativoFabrica' + queryKey.foods.foods;

// Achatamento `FoodFilterForm` → `ListFoodsParams` (querystring real de `GET
// /foods`) — mirror `SaldoEstoque::toRequestFilter`.
function toRequestFilter(filter?: FoodFilterForm | null): ListFoodsParams {
  return {
    product_uuid: filter?.product_uuid || undefined,
    is_enabled: filter?.is_enabled || undefined,
    type: filter?.type || undefined,
  };
}

function formatQuantity(value: number | string, measurementLabel?: string): string {
  const numeric = Number(value) || 0;
  const formatted = numeric.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return measurementLabel ? `${formatted} ${measurementLabel}` : formatted;
}

export default function FabricaList() {
  const { languageGB } = useLanguage();
  const navigate = useNavigate();
  const { can } = usePermissions();
  const text = languageGB.foods.food;

  const canCreate = can('food_create');

  const defaultQueryOptions = useMemo(
    () => ({
      pageSize: 10,
      storageKey: FABRICA_STORAGE_KEY,
    }),
    []
  );

  const { paginatedQuery, handlePaginatedQuery, handleFilterChange, handleResetFilter } =
    userPaginatedQuery<FoodFilterForm>(defaultQueryOptions);

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

  const foodsList = useCustomGridQuery<FoodListItem, ListFoodsParams>({
    asyncFunction: listFoods,
    queryKey: queryKey.foods.foods,
    paginatedQuery,
    setPaginatedQuery: handlePaginatedQuery,
    filterQuery: [],
    filter: requestFilter,
  });

  // ---- Estado de exclusão --------------------------------------------------
  const [toDelete, setToDelete] = useState<FoodListItem | null>(null);
  const {
    open: isOpenDeleteDialog,
    onOpen: onOpenDeleteDialog,
    onClose: onCloseDeleteDialog,
  } = useDisclosure();

  const deleteMutation = useRequest({
    asyncFunction: async ({ foodUuid }: { foodUuid: string }) => {
      return await deleteFood(foodUuid);
    },
    queryKey: queryKey.foods.foods,
    // `TypesRequest` não tem variante "delete" — mesmo truque já usado por
    // `Warehouses`/`CostCenter`/`Perfil` para a mesma operação (o rótulo
    // genérico associado a "update" nunca aparece, `personalizedMessage`
    // sempre vence).
    typesRequest: 'update',
    entityName: text.singularLabel,
    personalizedMessage: text.list.deletedToast,
    actionSuccess: () => {
      onCloseDeleteDialog();
      setToDelete(null);
    },
  });

  const handleDeleteClick = (food: FoodListItem) => {
    setToDelete(food);
    onOpenDeleteDialog();
  };

  const handleConfirmDelete = () => {
    if (toDelete) {
      deleteMutation.mutate({ foodUuid: toDelete.uuid });
    }
  };

  const isDeleting = deleteMutation.isPending;

  // ---- Duplicar -------------------------------------------------------------
  // Mirror comportamento observado do legado (o `@can('food_create')`
  // protegendo o link "Duplicar", Doc Bruta Food §7) — refresh in-place do
  // grid via invalidação de `queryKey.foods.foods` (efeito de negócio
  // preservado: uma nova Formulação existe com `code` sequencial novo).
  const duplicateMutation = useRequest({
    asyncFunction: async ({ foodUuid }: { foodUuid: string }) => {
      return await duplicateFood(foodUuid);
    },
    queryKey: queryKey.foods.foods,
    typesRequest: 'create',
    entityName: text.singularLabel,
    personalizedMessage: text.list.duplicatedToast,
    actionSuccess: () => {},
  });

  function handleDuplicateClick(food: FoodListItem) {
    duplicateMutation.mutate({ foodUuid: food.uuid });
  }

  // ---- Imprimir (relatório PDF individual) ----------------------------------
  // Download síncrono via blob — SEM TanStack mutation (não há invalidação de
  // cache nem estado de servidor a sincronizar), mirror
  // `PlanAccount/HeaderTable.tsx::handleDownloadTemplate`. Estado local por
  // uuid (só 1 download por vez é o cenário real de clique, mas isolado por
  // linha evita desabilitar a ação de OUTRAS linhas enquanto uma imprime).
  const [downloadingReportUuid, setDownloadingReportUuid] = useState<string | null>(null);

  async function handlePrintReport(food: FoodListItem) {
    setDownloadingReportUuid(food.uuid);
    try {
      const blob = await getFoodReport(food.uuid);
      downloadBlob(blob, `formulacao-${food.code}.pdf`);
    } catch {
      toaster.error({ title: text.singularLabel, description: text.list.reportErrorToast });
    } finally {
      setDownloadingReportUuid(null);
    }
  }

  const typeLabels = foodTypeLabel(languageGB);

  const columnHelper = createColumnHelper<FoodListItem>();
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
      columnHelper.accessor((row) => row.product.description, {
        id: 'product',
        header: text.list.columns.product,
        enableHiding: false, // coluna-âncora — nunca ocultável
        cell: ({ row }) => (
          <Text fontWeight="medium" lineClamp="1">
            {row.original.product.description}
          </Text>
        ),
        meta: { gridLabel: text.list.columns.product },
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
      columnHelper.accessor('quantity', {
        header: text.list.columns.quantity,
        cell: ({ row }) => (
          <Text fontSize="sm" textAlign="right" fontVariantNumeric="tabular-nums">
            {formatQuantity(row.original.quantity, row.original.measurement?.description)}
          </Text>
        ),
        meta: { ...styleColumTable.sm, gridLabel: text.list.columns.quantity },
      }),
      columnHelper.accessor('type', {
        header: text.list.columns.type,
        cell: ({ row }) => (
          <Badge colorPalette={TYPE_BADGE_COLOR[row.original.type]} variant="subtle">
            {typeLabels[row.original.type]}
          </Badge>
        ),
        meta: { ...styleColumTable.sm, gridLabel: text.list.columns.type },
      }),
      columnHelper.accessor('is_enabled', {
        header: text.list.columns.status,
        cell: ({ row }) => (
          <Badge
            colorPalette={row.original.is_enabled ? 'green' : 'gray'}
            variant="subtle"
            py={1}
            px={3}
          >
            {row.original.is_enabled
              ? text.list.columns.activeLabel
              : text.list.columns.inactiveLabel}
          </Badge>
        ),
        meta: { ...styleColumTable.sm, gridLabel: text.list.columns.status },
      }),
      columnHelper.display({
        id: 'acoes',
        header: '',
        enableHiding: false,
        cell: ({ row }) => (
          <Flex justify="flex-end">
            <Actions size="sm">
              {can('food_view') && (
                <Actions.Item
                  icon={<Icon as={FiEdit} />}
                  onClick={() =>
                    navigate(`/administrativo/fabrica/formulacao/${row.original.uuid}`)
                  }
                >
                  {text.list.actions.edit}
                </Actions.Item>
              )}
              {can('food_view') && (
                <Actions.Item
                  icon={<Icon as={FiFileText} />}
                  onClick={() => handlePrintReport(row.original)}
                  disabled={downloadingReportUuid === row.original.uuid}
                >
                  {text.list.actions.report}
                </Actions.Item>
              )}
              {/* "Duplicar" reusa `food_create` — fidelidade à Doc Bruta Food
                  §7 (`@can('food_create')` protegendo o link no legado). */}
              {can('food_create') && (
                <Actions.Item
                  icon={<Icon as={FiCopy} />}
                  onClick={() => handleDuplicateClick(row.original)}
                  disabled={duplicateMutation.isPending}
                >
                  {text.list.actions.duplicate}
                </Actions.Item>
              )}
              {can('food_delete') && (
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
    [
      navigate,
      isDeleting,
      text,
      can,
      languageGB.defaltStrings.actions,
      typeLabels,
      downloadingReportUuid,
      duplicateMutation.isPending,
    ]
  );

  const gridSettings = useGridSettings<FoodListItem>({
    storageKey: FABRICA_STORAGE_KEY,
    storageScope: useGridStorageScope(),
    columns: defaultColumns,
  });
  const { columnOrder, setColumnOrder, columnVisibility, setColumnVisibility } = gridSettings;

  const isLoading = checkLoadingStatus([foodsList]);
  const items = foodsList.data?.data?.items;
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
            <>
              {canCreate && (
                <ButtonAdd
                  onClick={() => navigate('/administrativo/fabrica/formulacao/novo')}
                  languageGB={languageGB}
                />
              )}
              <GridSettingsFloatingPanel
                gridSettings={gridSettings}
                triggerLabel={languageGB.defaltStrings.gridSettings.trigger}
              />
              <ButtonFilter filtersApplied={filtersApplied} onClick={onOpenFilter} />
            </>
          }
        >
          <PageHeader title={text.list.pageTitle} description={text.list.pageSubtitle} />
        </HeaderGrid>

        <Box mt={6}>
          <Table
            isLoading={isLoading}
            isError={foodsList.isError}
            error={foodsList.error}
            isEmpty={isEmpty}
            onRetry={() => foodsList.refetch()}
            isRetrying={foodsList.isFetching}
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
            onCreate={() => navigate('/administrativo/fabrica/formulacao/novo')}
          />
        </Box>
      </TableProvider>

      <FilterSideFabrica
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
