// src/pages/BaseRegistrations/Markers/index.tsx
// -----------------------------------------------------------------------------
// Tela de LISTAGEM (grid) de MARCADORES — Cadastros Base / Configurações
// (menu "Configurações" → `configuracoes`, item `cfg-mrc`; movido do grupo
// `cad-gerais` em 97-Esteiras/019, decisão do dono 2026-08-05).
//
// Rota: /cadastros-base/marcadores (guardada por `markers_view`, registrada
// em src/router/index.tsx — este arquivo não mexe em rota/menu).
//
// Estrutura idêntica a CadastrosBase/FamiliaBens/index.tsx (grid flat REAL de
// servidor, paginação real 15/página):
//   - grid paginado (TableProvider + Table) via useCustomGridQuery inline;
//   - HeaderTable    → botões de ação (Add respeita markers_create);
//   - FilterSideMarkers → drawer (search/type/is_enabled), COM
//     re-hidratação ao reabrir (Contrato B `FilterModalProps`, prop `filter`);
//   - delete via `useMutation` DEDICADO (mesma razão documentada em
//     `Contador/index.tsx` — o `onError` genérico do `useRequest` só lê
//     `message`, nunca `errors`, o que esconderia `errors.in_use`): no
//     sucesso invalida a listagem + toast; no erro, se for 422 com
//     `errors.in_use` populado (mapa `{tabela: count}`, GAP-MK-FE-01), fecha
//     `DeleteConfirmDialog` e abre `MarkerInUseDialog` com a lista traduzida;
//     qualquer outro erro cai no toast genérico.
//
// Permissões: recurso SEM flag por item (`MarkerResource` não expõe
// `can_edit`/`can_delete`) — ações de linha usam permissão GLOBAL
// (`markers_edit`/`markers_delete`), mesmo padrão de FamiliaBens/Contador.
//
// Thumbnail: `Image` (Chakra v3) não tem prop `fallback` — fallback local via
// estado de erro de carregamento (`MarkerThumbnail`), mesmo padrão
// `FamilyEquipmentThumbnail` de FamiliaBens/index.tsx.
// -----------------------------------------------------------------------------

import { ElementType, useEffect, useMemo, useState } from 'react';

import { Badge, Box, Flex, Icon, Image, Text, useDisclosure } from '@chakra-ui/react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createColumnHelper } from '@tanstack/react-table';
import { isAxiosError } from 'axios';
import { FiEdit, FiImage, FiMapPin, FiTrash2 } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';

import { Actions } from '@/components/Action';
import { ContainerGrid } from '@/components/ContainerGrid';
import { DeleteConfirmDialog } from '@/components/DeleteConfirmDialog';
import { HeaderGrid } from '@/components/HeaderGrid';
import { InUseBlockedDialog, type InUseBlockedItem } from '@/components/InUseBlockedDialog';
import { Table } from '@/components/Table';
import { toaster } from '@/components/ui/toaster';

import { TableProvider } from '@/contexts/TableContext';

import { useCustomGridQuery } from '@/hooks/useCustomGridQuery';
import { useGridSettings } from '@/hooks/useGridSettings';
import { useGridStorageScope } from '@/hooks/useGridStorageScope';
import { useLanguage } from '@/hooks/useLanguage';
import { userPaginatedQuery } from '@/hooks/usePaginatedQueryStorage';
import { usePermissions } from '@/hooks/usePermissions';

import { checkLoadingStatus } from '@/utils/checkLoadingStatus';
import { styleColumTable } from '@/utils/style-colum-table';

import { queryKey } from '@/constants/query-key';
import { markerInUseTableLabels } from '@/constants/Marker/options/marker-in-use-table-labels';

import { deleteMarker, listMarkers } from '@/services/v2/BaseRegistrations/marker-service';

import type { MarkerFilterForm, MarkerListItem } from '@/@types/v2/BaseRegistrations/marker';

import { FilterSideMarkers } from './FilterSideMarkers';
import { HeaderTable } from './HeaderTable';
import { extractApiFieldErrorMessage, extractInUseItems } from '@/utils/extractApiErrorMessage';

import { PageHeader } from '@/components/ui/PageHeader';

import { ListToolbar } from '@/components/ui/ListToolbar';
import { useListSearch } from '@/hooks/useListSearch';

// Thumbnail com fallback local (Chakra v3 `Image` não tem prop `fallback`).
function MarkerThumbnail({ iconUrl, alt }: { iconUrl: string | null; alt: string }) {
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setHasError(false);
  }, [iconUrl]);

  const showPlaceholder = !iconUrl || hasError;

  if (showPlaceholder) {
    return (
      <Flex
        boxSize="9"
        align="center"
        justify="center"
        borderRadius="md"
        bg="bg.muted"
        border="1px solid"
        borderColor="border.subtle"
        flexShrink={0}
      >
        <Icon as={FiImage} boxSize={4} color="fg.muted" />
      </Flex>
    );
  }

  return (
    <Image
      src={iconUrl}
      alt={alt}
      boxSize="9"
      borderRadius="md"
      objectFit="contain"
      flexShrink={0}
      onError={() => setHasError(true)}
    />
  );
}

// Chave de storage desta tela — expressão estável e única (mesmo padrão de
// CentroCusto): paginação e personalização de grid derivam dela para nunca
// divergirem.
const MARKERS_STORAGE_KEY = 'CadastrosBaseMarcadores' + queryKey.markers.markersList;

export default function MarkersList() {
  const { languageGB } = useLanguage();
  const navigate = useNavigate();
  const { can } = usePermissions();
  const text = languageGB.markers.marker;

  const canCreate = can('markers_create');
  const canEdit = can('markers_edit');
  const canDelete = can('markers_delete');

  const defaultQueryOptions = useMemo(
    () => ({
      pageSize: 15,
      storageKey: MARKERS_STORAGE_KEY,
    }),
    []
  );

  const { paginatedQuery, handlePaginatedQuery, handleFilterChange, handleResetFilter } =
    userPaginatedQuery<MarkerFilterForm>(defaultQueryOptions);
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

  const markersList = useCustomGridQuery<MarkerListItem, MarkerFilterForm>({
    asyncFunction: listMarkers,
    queryKey: queryKey.markers.markersList,
    paginatedQuery,
    setPaginatedQuery: handlePaginatedQuery,
    filterQuery: [],
    filter: paginatedQuery.filter ?? ({} as MarkerFilterForm),
  });

  // ---- Estado de exclusão --------------------------------------------------
  const queryClient = useQueryClient();
  const [toDelete, setToDelete] = useState<MarkerListItem | null>(null);
  const {
    open: isOpenDeleteDialog,
    onOpen: onOpenDeleteDialog,
    onClose: onCloseDeleteDialog,
  } = useDisclosure();

  // Estado do aviso de exclusão BLOQUEADA (422 `errors.in_use`, normalizado
  // por `extractInUseItems` — cobre tanto o shape array quanto o mapa
  // `{tabela: count}` usado por Marker, GAP-MK-FE-01).
  const [blockedInUse, setBlockedInUse] = useState<InUseBlockedItem[] | null>(null);
  const {
    open: isOpenBlockedDialog,
    onOpen: onOpenBlockedDialog,
    onClose: onCloseBlockedDialog,
  } = useDisclosure();

  // ⚠️ NÃO usa `useRequest` aqui — mesma razão documentada em
  // `Contador/index.tsx`: o `onError` genérico só lê `message`, nunca
  // `errors`, o que esconderia `errors.in_use`.
  const deleteMutation = useMutation({
    mutationFn: async (markerUuid: string) => await deleteMarker(markerUuid),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [queryKey.markers.markersList] });

      toaster.success({
        title: text.singularLabel,
        description: text.list.deletedToast,
        duration: 7000,
      });

      onCloseDeleteDialog();
      setToDelete(null);
    },
    onError: (error) => {
      console.error('Marker delete - error:', error);

      const inUseItems = extractInUseItems(error);
      if (inUseItems) {
        onCloseDeleteDialog();
        setBlockedInUse(inUseItems);
        onOpenBlockedDialog();
        return;
      }

      // Fallback: qualquer erro que NÃO seja o 422 estruturado de bloqueio
      // (403, 500, 422 residual sem `in_use` populado).
      let errorMessage = languageGB.common.errorLog.unknownError;
      if (isAxiosError(error)) {
        const statusCode = error.response?.status ?? null;
        const resData = error.response?.data as any;
        if (resData?.message) {
          const msg =
            extractApiFieldErrorMessage(error) ?? (typeof resData.message === 'string' ? resData.message : JSON.stringify(resData.message));
          errorMessage = `${statusCode} — ${msg}`;
        } else if (error.message) {
          errorMessage = error.message;
        }
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }

      toaster.error({
        title: text.singularLabel,
        description: errorMessage,
        duration: 7000,
      });
    },
  });

  const isDeleting = deleteMutation.isPending;

  const handleDeleteClick = (marker: MarkerListItem) => {
    setToDelete(marker);
    onOpenDeleteDialog();
  };

  const handleConfirmDelete = () => {
    if (toDelete) {
      deleteMutation.mutate(toDelete.uuid);
    }
  };

  const handleCloseBlockedDialog = () => {
    onCloseBlockedDialog();
    setBlockedInUse(null);
    setToDelete(null);
  };

  const columnHelper = createColumnHelper<MarkerListItem>();
  const defaultColumns = useMemo(
    () => [
      columnHelper.display({
        id: 'icon',
        header: text.list.table.icon,
        cell: ({ row }) => (
          <MarkerThumbnail iconUrl={row.original.icon_url} alt={row.original.description} />
        ),
        meta: { ...styleColumTable.sm, gridLabel: text.list.table.icon },
      }),
      columnHelper.accessor('description', {
        header: text.list.table.description,
        enableHiding: false,
        meta: { gridLabel: text.list.table.description },
        cell: ({ row }) => (
          <Text fontWeight="medium" lineClamp="1">
            {row.original.description}
          </Text>
        ),
      }),
      columnHelper.accessor('type_label', {
        header: text.list.table.type,
        cell: ({ row }) => (
          <Text fontSize="sm" color="fg.muted" lineClamp="1">
            {row.original.type_label}
          </Text>
        ),
        meta: { ...styleColumTable.sm, gridLabel: text.list.table.type },
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
        meta: { ...styleColumTable.sm, gridLabel: text.list.table.active },
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
                  onClick={() => navigate(`/cadastros-base/marcadores/${row.original.uuid}`)}
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
        meta: {
          ...styleColumTable.sm,
          gridLabel: languageGB.defaltStrings.actions,
          gridOrder: 'fixed-end',
          gridDataColumn: false,
        },
      }),
    ],
    [navigate, isDeleting, text, canEdit, canDelete, languageGB.defaltStrings.actions]
  );

  const gridSettings = useGridSettings<MarkerListItem>({
    storageKey: MARKERS_STORAGE_KEY,
    storageScope: useGridStorageScope(),
    columns: defaultColumns,
  });
  const { columnOrder, setColumnOrder, columnVisibility, setColumnVisibility } = gridSettings;

  const isLoading = checkLoadingStatus([markersList]);
  const items = markersList.data?.data?.items;
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
            isError={markersList.isError}
            error={markersList.error}
            isEmpty={isEmpty}
            onRetry={() => markersList.refetch()}
            isRetrying={markersList.isFetching}
            retryLabel={text.list.error.retry}
            emptyIcon={FiMapPin as ElementType}
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
            onCreate={() => navigate('/cadastros-base/marcadores/novo')}
          />
        </Box>
      </TableProvider>

      <FilterSideMarkers
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

      <InUseBlockedDialog
        isOpen={isOpenBlockedDialog}
        onClose={handleCloseBlockedDialog}
        title={text.deleteBlocked.title}
        description={text.deleteBlocked.description}
        itemName={toDelete?.description}
        items={blockedInUse}
        closeLabel={languageGB.defaltStrings.close}
        resourceLabelTemplate={text.deleteBlocked.resourceLabel}
        getResourceLabel={(table) => markerInUseTableLabels.getLabel(table, languageGB)}
      />
    </ContainerGrid>
  );
}
