// src/pages/BaseRegistrations/DrinkingFountains/index.tsx
// -----------------------------------------------------------------------------
// Tela de LISTAGEM (grid paginada, COM filtro textual, COM GridSettings) de
// Bebedouros (DrinkingFountain) — Cadastros Base / Pecuários. Execução 029,
// TASK-FE-2301. Rota: /cadastros-base/bebedouros (guardada por
// `drinking-fountains_view`, registrada por TASK-FE-2304 — este arquivo não
// mexe em rota/menu/query-key/i18n, já FUNDAÇÃO da execução).
//
// Molde estrutural: `DiagnosisPregnancy/index.tsx` (grid + filtro lateral,
// tela canônica do protocolo v2) + `Grazings/index.tsx`/`CentroCusto/index.tsx`
// (integração `useGridSettings`/`GridSettingsFloatingPanel`, protocolo v2 §8).
// DELTA sobre `contrato-fe-cochos.md §2` (contrato-fe-bebedouros.md §2): 3
// ações de linha (Visualizar/Editar/Excluir — mirror `CentroCusto/index.tsx`,
// a visualização em cards é NOVA, sem equivalente no legado), SEM coluna de
// Comprimento (decisão de densidade, informação de detalhe).
//
// i18n SEM alias (protocolo v2, anti-padrão proibido) — caminho completo
// `languageGB.baseRegistrations.drinkingFountain...` inline em cada uso.
// -----------------------------------------------------------------------------

import { useMemo, useState } from 'react';

import { Badge, Box, Flex, Icon, Text, useDisclosure } from '@chakra-ui/react';
import { createColumnHelper } from '@tanstack/react-table';
import { Droplet } from 'lucide-react';
import { FiEdit, FiEye, FiTrash2 } from 'react-icons/fi';
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

import {
  deleteDrinkingFountain,
  listDrinkingFountains,
} from '@/services/v2/BaseRegistrations/drinking-fountains-service';

import type {
  DrinkingFountainListItem,
  DrinkingFountainsFilterForm,
} from '@/@types/v2/BaseRegistrations/drinking-fountains';

import { FilterSideDrinkingFountains } from './FilterSideDrinkingFountains';
import { HeaderTable } from './HeaderTable';

import { PageHeader } from '@/components/ui/PageHeader';

import { ListToolbar } from '@/components/ui/ListToolbar';
import { useListSearch } from '@/hooks/useListSearch';

// Chave de storage desta tela — paginação (`userPaginatedQuery`) e
// personalização de grid (`useGridSettings`) derivam da MESMA expressão
// estável para nunca divergirem (mirror `Grazings/index.tsx`).
const DRINKING_FOUNTAINS_STORAGE_KEY =
  'BaseRegistrationsDrinkingFountains' + queryKey.drinkingFountains.drinkingFountainsList;

// Localização composta (mesma decisão D-FE-3 de Cochos, aplicada
// simetricamente) — Área OU Módulo Pastejo (o que estiver preenchido) + o
// Curral vinculado, se houver (relação independente do XOR Área×Módulo).
function buildLocationLabel(item: DrinkingFountainListItem): string {
  const parts: string[] = [];
  if (item.area) {
    parts.push(item.area.description);
  } else if (item.grazing) {
    parts.push(item.grazing.description);
  }
  if (item.feedlot_corral) {
    parts.push(item.feedlot_corral.identification);
  }
  return parts.length > 0 ? parts.join(' · ') : '—';
}

export default function DrinkingFountainsList() {
  const { languageGB } = useLanguage();
  const navigate = useNavigate();
  const { can } = usePermissions();

  const canCreate = can('drinking-fountains_create');
  const canEdit = can('drinking-fountains_edit');
  const canDelete = can('drinking-fountains_delete');

  const defaultQueryOptions = useMemo(
    () => ({
      pageSize: 10,
      storageKey: DRINKING_FOUNTAINS_STORAGE_KEY,
    }),
    []
  );

  const { paginatedQuery, handlePaginatedQuery, handleFilterChange, handleResetFilter } =
    userPaginatedQuery<DrinkingFountainsFilterForm>(defaultQueryOptions);
  const listSearch = useListSearch(paginatedQuery.filter, handleFilterChange);

  // ---- Estado de filtro (drawer) ------------------------------------------
  const { open: isFilterOpen, onOpen: onOpenFilter, onClose: onCloseFilter } = useDisclosure();

  const filtersApplied = useMemo(
    () =>
      Object.values(paginatedQuery.filter ?? {}).filter(
        (v) => v !== undefined && v !== null && v !== '' && v !== false
      ).length,
    [paginatedQuery.filter]
  );

  // ---- Estado de exclusão --------------------------------------------------
  const [toDelete, setToDelete] = useState<DrinkingFountainListItem | null>(null);
  const {
    open: isOpenDeleteDialog,
    onOpen: onOpenDeleteDialog,
    onClose: onCloseDeleteDialog,
  } = useDisclosure();

  const drinkingFountainsList = useCustomGridQuery<
    DrinkingFountainListItem,
    DrinkingFountainsFilterForm
  >({
    asyncFunction: listDrinkingFountains,
    queryKey: queryKey.drinkingFountains.drinkingFountainsList,
    paginatedQuery,
    setPaginatedQuery: handlePaginatedQuery,
    filterQuery: [],
    filter: paginatedQuery.filter ?? ({} as DrinkingFountainsFilterForm),
  });

  // Exclusão física, sem 422 estruturado documentado (contrato de API §1.2
  // item 5) — `useRequest` genérico cobre o caso (mirror
  // `DiagnosisPregnancy/index.tsx`).
  const deleteMutation = useRequest({
    asyncFunction: async ({ drinkingFountainUuid }: { drinkingFountainUuid: string }) => {
      return await deleteDrinkingFountain(drinkingFountainUuid);
    },
    queryKey: queryKey.drinkingFountains.drinkingFountainsList,
    queryKey2: queryKey.drinkingFountains.drinkingFountain,
    typesRequest: 'update',
    entityName: languageGB.baseRegistrations.drinkingFountain.singularLabel,
    personalizedMessage: languageGB.baseRegistrations.drinkingFountain.list.deletedToast,
    actionSuccess: () => {
      onCloseDeleteDialog();
      setToDelete(null);
    },
  });

  const handleDeleteClick = (drinkingFountain: DrinkingFountainListItem) => {
    setToDelete(drinkingFountain);
    onOpenDeleteDialog();
  };

  const handleConfirmDelete = () => {
    if (toDelete) {
      deleteMutation.mutate({ drinkingFountainUuid: toDelete.uuid });
    }
  };

  const isDeleting = deleteMutation.isPending;

  const columnHelper = createColumnHelper<DrinkingFountainListItem>();
  const defaultColumns = useMemo(
    () => [
      columnHelper.accessor('code', {
        header: languageGB.baseRegistrations.drinkingFountain.list.table.code,
        enableHiding: false,
        meta: { gridLabel: languageGB.baseRegistrations.drinkingFountain.list.table.code },
        cell: ({ row }) => <Text fontWeight="medium">{row.original.code}</Text>,
      }),
      columnHelper.accessor('description', {
        header: languageGB.baseRegistrations.drinkingFountain.list.table.description,
        enableHiding: false,
        meta: { gridLabel: languageGB.baseRegistrations.drinkingFountain.list.table.description },
        cell: ({ row }) => (
          <Flex align="center" gap={2}>
            <Icon as={Droplet} color="blue.400" boxSize={4} flexShrink={0} />
            <Text fontWeight="medium" lineClamp="1">
              {row.original.description}
            </Text>
          </Flex>
        ),
      }),
      columnHelper.accessor('type_label', {
        header: languageGB.baseRegistrations.drinkingFountain.list.table.type,
        meta: {
          ...styleColumTable.sm,
          gridLabel: languageGB.baseRegistrations.drinkingFountain.list.table.type,
        },
        cell: ({ row }) => (
          <Badge colorPalette="gray" variant="subtle" py={1} px={3}>
            {row.original.type_label}
          </Badge>
        ),
      }),
      columnHelper.accessor((row) => buildLocationLabel(row), {
        id: 'location',
        header: languageGB.baseRegistrations.drinkingFountain.list.table.location,
        meta: { gridLabel: languageGB.baseRegistrations.drinkingFountain.list.table.location },
        cell: ({ row }) => (
          <Text fontSize="sm" color="fg.muted" lineClamp="1">
            {buildLocationLabel(row.original)}
          </Text>
        ),
      }),
      columnHelper.accessor('is_enabled', {
        header: languageGB.baseRegistrations.drinkingFountain.list.table.active,
        meta: {
          ...styleColumTable.sm,
          gridLabel: languageGB.baseRegistrations.drinkingFountain.list.table.active,
        },
        cell: ({ row }) => (
          <Badge
            colorPalette={row.original.is_enabled ? 'green' : 'gray'}
            variant="subtle"
            py={1}
            px={3}
          >
            {row.original.is_enabled
              ? languageGB.baseRegistrations.drinkingFountain.list.table.active
              : languageGB.baseRegistrations.drinkingFountain.list.table.inactive}
          </Badge>
        ),
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
                onClick={() => navigate(`/cadastros-base/bebedouros/${row.original.uuid}/detalhe`)}
              >
                {languageGB.baseRegistrations.drinkingFountain.list.actions.view}
              </Actions.Item>
              {canEdit && (
                <Actions.Item
                  icon={<Icon as={FiEdit} />}
                  onClick={() => navigate(`/cadastros-base/bebedouros/${row.original.uuid}`)}
                >
                  {languageGB.baseRegistrations.drinkingFountain.list.actions.edit}
                </Actions.Item>
              )}
              {canDelete && (
                <>
                  <Actions.Separator />
                  <Actions.Item
                    icon={<Icon as={FiTrash2} />}
                    onClick={() => handleDeleteClick(row.original)}
                    color="red.400"
                    disabled={isDeleting}
                  >
                    {languageGB.baseRegistrations.drinkingFountain.list.actions.delete}
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
    [navigate, isDeleting, languageGB, canEdit, canDelete]
  );

  const gridSettings = useGridSettings<DrinkingFountainListItem>({
    storageKey: DRINKING_FOUNTAINS_STORAGE_KEY,
    storageScope: useGridStorageScope(),
    columns: defaultColumns,
  });
  const { columnOrder, setColumnOrder, columnVisibility, setColumnVisibility } = gridSettings;

  const isLoading = checkLoadingStatus([drinkingFountainsList]);
  const items = drinkingFountainsList.data?.data?.items;
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
              gridSettings={gridSettings}
            />
          }
        >
          <PageHeader title={languageGB.baseRegistrations.drinkingFountain.list.pageTitle} description={languageGB.baseRegistrations.drinkingFountain.list.pageSubtitle} />
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
            isError={drinkingFountainsList.isError}
            error={drinkingFountainsList.error}
            isEmpty={isEmpty}
            onRetry={() => drinkingFountainsList.refetch()}
            isRetrying={drinkingFountainsList.isFetching}
            emptyIcon={Droplet}
            emptyTitle={
              filtersApplied > 0
                ? languageGB.baseRegistrations.drinkingFountain.list.emptyState.titleFiltered
                : languageGB.baseRegistrations.drinkingFountain.list.emptyState.titleEmpty
            }
            emptyDescription={
              filtersApplied > 0
                ? languageGB.baseRegistrations.drinkingFountain.list.emptyState.descriptionFiltered
                : languageGB.baseRegistrations.drinkingFountain.list.emptyState.descriptionEmpty
            }
            canCreate={filtersApplied === 0 && canCreate}
            createLabel={languageGB.baseRegistrations.drinkingFountain.list.emptyState.cta}
            onCreate={() => navigate('/cadastros-base/bebedouros/novo')}
          />
        </Box>
      </TableProvider>

      <FilterSideDrinkingFountains
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
        itemName={toDelete?.description}
      />
    </ContainerGrid>
  );
}
