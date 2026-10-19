// src/pages/Administrativo/Fabrica/FoodBeat/index.tsx
// -----------------------------------------------------------------------------
// Tela de LISTAGEM (grid) de BATIDA (FoodBeat — Fábrica, TASK-FB-FE-05). Rota
// `/administrativo/fabrica/batidas` — guardada por `<RequirePermission
// permission="food-beat_view">` (rota conectada em `TASK-FB-FE-07`, fora do
// escopo deste arquivo; permissão/item de menu `adm-est-fab` já existem,
// `navigationPermissions.ts:222`).
//
// UX-GAP confirmado (ver ficha, mesmo commit-âncora de `TASK-FB-FE-04`).
// Referência de estilo: `FazendasLista.tsx` (`ux_root`) + precedente REAL
// `Fabrica/index.tsx` (Food, `TASK-FOOD-FE-05` ✅) — mesma família de grid
// (`useCustomGridQuery`/`userPaginatedQuery`/`useGridSettings`/
// `useGridStorageScope`).
//
// Decisão de navegação cruzada Food↔Batida — ADIADA (instrução explícita do
// Maestro, 2026-08-12): esta tela NÃO ganha o botão "Ver Formulações" e
// `Fabrica/index.tsx` (Food) NÃO é tocado. A navegação cruzada entra numa
// etapa posterior, depois da homologação do módulo Food. Nenhuma das 2
// opções da ficha (`a`/`b`) foi escolhida silenciosamente — a decisão foi
// simplesmente postergada por instrução direta, registrada aqui e no
// Histórico da ficha.
//
// 3 ações (Ver/Editar, Excluir, Imprimir) — SEM "Duplicar" (Doc Bruta `§7`
// não lista duplicação para Batida, diferente de Food).
// -----------------------------------------------------------------------------

import { ElementType, useMemo, useState } from 'react';

import { Badge, Box, Flex, Icon, Text, useDisclosure, VStack } from '@chakra-ui/react';
import { createColumnHelper } from '@tanstack/react-table';
import { FiEdit, FiFileText, FiPackage, FiTrash2 } from 'react-icons/fi';
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

import { foodBeatTypeLabel } from '@/constants/food-beats/food-beat-type';
import { queryKey } from '@/constants/query-key';

import {
  deleteFoodBeat,
  getFoodBeatItemReport,
  listFoodBeats,
} from '@/services/v2/FoodBeats/food-beat-service';
import type { ListFoodBeatsParams } from '@/services/v2/FoodBeats/food-beat-service';

import type { FoodBeatFilterForm, FoodBeatListItem, FoodBeatType } from '@/@types/v2/FoodBeats';

import { FilterSideFoodBeat } from './FilterSideFoodBeat';

// Cor do Badge de Tipo por valor — mirror `TYPE_BADGE_COLOR` de
// `Fabrica/index.tsx` (Food), mesma paleta semântica (F=purple, E=blue).
const TYPE_BADGE_COLOR: Record<FoodBeatType, string> = {
  F: 'purple',
  E: 'blue',
};

// Chave de storage desta tela — NÃO colide com `FABRICA_STORAGE_KEY` de Food
// (prefixo próprio + `queryKey.foodBeats.foodBeats`, distinto de
// `queryKey.foods.foods`).
const FOODBEAT_STORAGE_KEY = 'AdministrativoFabricaBatida' + queryKey.foodBeats.foodBeats;

// Achatamento `FoodBeatFilterForm` (Option-based, TASK-FB-FE-01) →
// `ListFoodBeatsParams` (querystring real de `GET /food-beats`) — mirror
// `FabricaList::toRequestFilter`.
function toRequestFilter(filter?: FoodBeatFilterForm | null): ListFoodBeatsParams {
  return {
    product_uuid: filter?.product_uuid?.value || undefined,
    user_uuid: filter?.user_uuid?.value || undefined,
    start_date: filter?.start_date || undefined,
    end_date: filter?.end_date || undefined,
  };
}

function formatQuantity(value: number | string): string {
  const numeric = Number(value) || 0;
  return numeric.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function FoodBeatList() {
  const { languageGB } = useLanguage();
  const navigate = useNavigate();
  const { can } = usePermissions();
  const text = languageGB.foodBeats.foodBeat;

  const canCreate = can('food-beat_create');
  const canEdit = can('food-beat_view') || can('food-beat_edit');

  const defaultQueryOptions = useMemo(
    () => ({
      pageSize: 10,
      storageKey: FOODBEAT_STORAGE_KEY,
    }),
    []
  );

  const { paginatedQuery, handlePaginatedQuery, handleFilterChange, handleResetFilter } =
    userPaginatedQuery<FoodBeatFilterForm>(defaultQueryOptions);

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

  const foodBeatsList = useCustomGridQuery<FoodBeatListItem, ListFoodBeatsParams>({
    asyncFunction: listFoodBeats,
    queryKey: queryKey.foodBeats.foodBeats,
    paginatedQuery,
    setPaginatedQuery: handlePaginatedQuery,
    filterQuery: [],
    filter: requestFilter,
  });

  // ---- Estado de exclusão (soft delete, `DA-FB-11`) ------------------------
  const [toDelete, setToDelete] = useState<FoodBeatListItem | null>(null);
  const {
    open: isOpenDeleteDialog,
    onOpen: onOpenDeleteDialog,
    onClose: onCloseDeleteDialog,
  } = useDisclosure();

  // `typesRequest: 'apply'` — V3 não tem variante "delete" própria
  // (`personalizedMessage` sempre vence o rótulo genérico).
  const deleteMutation = useRequest({
    asyncFunction: async ({ foodBeatUuid }: { foodBeatUuid: string }) => {
      return await deleteFoodBeat(foodBeatUuid);
    },
    queryKey: queryKey.foodBeats.foodBeats,
    typesRequest: 'apply',
    entityName: text.singularLabel,
    personalizedMessage: text.list.deletedToast,
    actionSuccess: () => {
      onCloseDeleteDialog();
      setToDelete(null);
    },
  });

  const handleDeleteClick = (foodBeat: FoodBeatListItem) => {
    setToDelete(foodBeat);
    onOpenDeleteDialog();
  };

  const handleConfirmDelete = () => {
    if (toDelete) {
      deleteMutation.mutate({ foodBeatUuid: toDelete.uuid });
    }
  };

  const isDeleting = deleteMutation.isPending;

  // ---- Imprimir (relatório PDF de 1 item) -----------------------------------
  // Download síncrono via blob — SEM TanStack mutation, mirror
  // `FabricaList::handlePrintReport`. Estado local por uuid.
  const [downloadingReportUuid, setDownloadingReportUuid] = useState<string | null>(null);

  async function handlePrintReport(foodBeat: FoodBeatListItem) {
    setDownloadingReportUuid(foodBeat.uuid);
    try {
      const blob = await getFoodBeatItemReport(foodBeat.uuid);
      downloadBlob(blob, `batida-${foodBeat.code}.pdf`);
    } catch {
      toaster.error({ title: text.singularLabel, description: text.list.reportErrorToast });
    } finally {
      setDownloadingReportUuid(null);
    }
  }

  const typeLabels = foodBeatTypeLabel(languageGB);

  const columnHelper = createColumnHelper<FoodBeatListItem>();
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
      columnHelper.accessor('type', {
        header: text.list.columns.type,
        cell: ({ row }) => (
          <Badge colorPalette={TYPE_BADGE_COLOR[row.original.type]} variant="subtle">
            {typeLabels[row.original.type]}
          </Badge>
        ),
        meta: { ...styleColumTable.sm, gridLabel: text.list.columns.type },
      }),
      columnHelper.accessor((row) => row.warehouse.description, {
        id: 'warehouse',
        header: text.list.columns.warehouse,
        cell: ({ row }) => <Text fontSize="sm">{row.original.warehouse.description}</Text>,
        meta: { gridLabel: text.list.columns.warehouse },
      }),
      columnHelper.accessor((row) => row.food?.description ?? row.product?.description ?? '', {
        id: 'productOrFood',
        header: text.list.columns.productOrFood,
        enableHiding: false, // coluna-âncora — nunca ocultável
        cell: ({ row }) => (
          <Text fontWeight="medium" lineClamp="1">
            {row.original.food?.description ?? row.original.product?.description ?? '—'}
          </Text>
        ),
        meta: { gridLabel: text.list.columns.productOrFood },
      }),
      columnHelper.accessor('quantity', {
        header: text.list.columns.quantity,
        cell: ({ row }) => (
          <Text fontSize="sm" textAlign="right" fontVariantNumeric="tabular-nums">
            {formatQuantity(row.original.quantity)}
          </Text>
        ),
        meta: { ...styleColumTable.sm, gridLabel: text.list.columns.quantity },
      }),
      columnHelper.accessor((row) => row.user?.name ?? '', {
        id: 'user',
        header: text.list.columns.user,
        cell: ({ row }) => <Text fontSize="sm">{row.original.user?.name ?? '—'}</Text>,
        meta: { gridLabel: text.list.columns.user },
      }),
      columnHelper.display({
        id: 'acoes',
        header: '',
        enableHiding: false,
        cell: ({ row }) => (
          <Flex justify="flex-end">
            <Actions size="sm">
              {canEdit && (
                <Actions.Item
                  icon={<Icon as={FiEdit} />}
                  onClick={() => navigate(`/administrativo/fabrica/batidas/${row.original.uuid}`)}
                >
                  {text.list.actions.edit}
                </Actions.Item>
              )}
              {can('food-beat_view') && (
                <Actions.Item
                  icon={<Icon as={FiFileText} />}
                  onClick={() => handlePrintReport(row.original)}
                  disabled={downloadingReportUuid === row.original.uuid}
                >
                  {text.list.actions.report}
                </Actions.Item>
              )}
              {can('food-beat_delete') && (
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
      canEdit,
      languageGB.defaltStrings.actions,
      typeLabels,
      downloadingReportUuid,
    ]
  );

  const gridSettings = useGridSettings<FoodBeatListItem>({
    storageKey: FOODBEAT_STORAGE_KEY,
    storageScope: useGridStorageScope(),
    columns: defaultColumns,
  });
  const { columnOrder, setColumnOrder, columnVisibility, setColumnVisibility } = gridSettings;

  const isLoading = checkLoadingStatus([foodBeatsList]);
  const items = foodBeatsList.data?.data?.items;
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
                  onClick={() => navigate('/administrativo/fabrica/batidas/novo')}
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
          <VStack align="flex-start" gap={1}>
            <Text fontSize="2xl" fontWeight="bold" color="brandColorText">
              {/* Nome exibido da funcionalidade = singular ("Batida"), mirror
                  do item de menu (`navigationTree.ts`, id `adm-est-fab-bat`).
                  `pluralLabel` ("Batidas") permanece intacto no idioma —
                  não é mais consumido como título, mas continua correto
                  para eventuais usos plurais futuros (TASK-FB-FE-13). */}
              {text.singularLabel}
            </Text>
          </VStack>
        </HeaderGrid>

        <Box mt={6}>
          <Table
            isLoading={isLoading}
            isError={foodBeatsList.isError}
            error={foodBeatsList.error}
            isEmpty={isEmpty}
            onRetry={() => foodBeatsList.refetch()}
            isRetrying={foodBeatsList.isFetching}
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
            onCreate={() => navigate('/administrativo/fabrica/batidas/novo')}
          />
        </Box>
      </TableProvider>

      <FilterSideFoodBeat
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
