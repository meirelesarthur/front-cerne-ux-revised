// src/pages/Operacional/FeedlotSectors/index.tsx
// -----------------------------------------------------------------------------
// Tela de LISTAGEM (grid) de SETORES (FeedlotSector) — Operacional/
// Confinamento. Rota: /operacional/setores (guardada por
// `feedlot-sectors_view`, TASK-FS-FE-01).
//
// Estrutura mirror ESTRUTURAL `FeedlotYards/index.tsx` (referência PRIMÁRIA
// desta fatia — mesma família Pátio→Setor) + colunas extras de FK:
//   - grid paginado (TableProvider + Table) via useFeedlotSectorsList
//     (useCustomGridQuery, SEM ID de contexto — filtrável por QUALQUER Pátio);
//   - HeaderTable → botão "Novo" (respeita feedlot-sectors_create);
//   - FilterSideFeedlotSectors → drawer (code/name/feedlot_yard_id/is_active);
//   - delete via useRequest genérico + DeleteConfirmDialog (respeita
//     feedlot-sectors_delete; 422 de negócio — curral/componente vinculado —
//     vira toast com a `message` do envelope, SEM `onError` customizado/
//     diálogo dedicado, contrato de tela §5.4/risco 4).
//
// `priority` (rótulo "Ordem") NÃO é coluna desta listagem — fiel ao legado,
// só aparece na tela de Detalhe (`DetalheFeedlotSector.tsx`). Coluna "Pátio"
// lê `feedlot_yard.name` (FK aninhada), SEM round-trip extra. Coluna
// "Área (m²)" vem PRONTA do backend (runtime) — formatada com
// `Intl.NumberFormat`, texto simples, SEM `Badge` e SEM formatação monetária.
// Ação "Adicionar Curral" do dropdown legado (`AM-02`) NÃO é replicada —
// `FeedlotCorral` não está migrado (fora de escopo).
// -----------------------------------------------------------------------------

import { useMemo, useState, type ElementType } from 'react';

import { Badge, Box, Flex, Icon, Text, useDisclosure, VStack } from '@chakra-ui/react';
import { createColumnHelper } from '@tanstack/react-table';
import { FiBox, FiEdit, FiEye, FiTrash2 } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';

import { Actions } from '@/components/Action';
import { ContainerGrid } from '@/components/ContainerGrid';
import { DeleteConfirmDialog } from '@/components/DeleteConfirmDialog';
import { HeaderGrid } from '@/components/HeaderGrid';
import { Table } from '@/components/Table';

import { TableProvider } from '@/contexts/TableContext';

import { useGridSettings } from '@/hooks/useGridSettings';
import { useGridStorageScope } from '@/hooks/useGridStorageScope';
import { useLanguage } from '@/hooks/useLanguage';
import { userPaginatedQuery } from '@/hooks/usePaginatedQueryStorage';
import { usePermissions } from '@/hooks/usePermissions';
import { useRequest } from '@/hooks/useRequest';

import { checkLoadingStatus } from '@/utils/checkLoadingStatus';
import formatDate from '@/utils/formatDate';
import { styleColumTable } from '@/utils/style-colum-table';

import { feedlotSectorStatusColor } from '@/constants/FeedlotSectors/feedlot-sector-status';
import { queryKey } from '@/constants/query-key';

import { deleteFeedlotSector } from '@/services/v2/FeedlotSectors/feedlot-sector-service';

import type { FeedlotSectorFilterForm, FeedlotSectorListItem } from '@/@types/v2/FeedlotSectors';

import { FilterSideFeedlotSectors } from './FilterSideFeedlotSectors';
import { HeaderTable } from './HeaderTable';
import { useFeedlotSectorsList } from './useFeedlotSectors';

// Chave de storage desta tela — paginação (`userPaginatedQuery`) e
// personalização de grid (`useGridSettings`) derivam da MESMA expressão
// (mirror `FEEDLOT_YARDS_STORAGE_KEY`), nunca literal cru repetido.
const FEEDLOT_SECTORS_STORAGE_KEY =
  'OperacionalFeedlotSectors' + queryKey.feedlotSectors.feedlotSectors;

// Formatação de "Área (m²)" — 2 casas, SEM símbolo monetário (é m², não R$).
const areaFormatter = new Intl.NumberFormat('pt-BR', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

function formatArea(area: number | null): string {
  return area === null || area === undefined ? '—' : `${areaFormatter.format(area)} m²`;
}

export default function FeedlotSectorList() {
  const { languageGB } = useLanguage();
  const navigate = useNavigate();
  const { can } = usePermissions();
  const text = languageGB.feedlotSectors.feedlotSector;

  const canCreate = can('feedlot-sectors_create');

  const defaultQueryOptions = useMemo(
    () => ({
      pageSize: 10,
      storageKey: FEEDLOT_SECTORS_STORAGE_KEY,
    }),
    []
  );

  const { paginatedQuery, handlePaginatedQuery, handleFilterChange, handleResetFilter } =
    userPaginatedQuery<FeedlotSectorFilterForm>(defaultQueryOptions);

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
  const [toDelete, setToDelete] = useState<FeedlotSectorListItem | null>(null);
  const {
    open: isOpenDeleteDialog,
    onOpen: onOpenDeleteDialog,
    onClose: onCloseDeleteDialog,
  } = useDisclosure();

  const feedlotSectorsList = useFeedlotSectorsList({
    paginatedQuery,
    setPaginatedQuery: handlePaginatedQuery,
    filter: {
      code: paginatedQuery.filter?.code,
      name: paginatedQuery.filter?.name,
      feedlot_yard_id: paginatedQuery.filter?.feedlot_yard_id?.value,
      is_active: paginatedQuery.filter?.is_active?.value,
    },
  });

  const deleteMutation = useRequest({
    asyncFunction: async ({ feedlotSectorUuid }: { feedlotSectorUuid: string }) =>
      deleteFeedlotSector(feedlotSectorUuid),
    queryKey: queryKey.feedlotSectors.feedlotSectors,
    queryKey2: queryKey.feedlotSectors.feedlotSector,
    // `useRequest`'s TypesRequest não tem variante "delete" — "update" é a
    // mesma convenção já usada por `FeedlotYard`/`CentroCusto`/`Pastagem`
    // para exclusão. O texto do toast vem de `personalizedMessage`, então o
    // rótulo genérico de "update" nunca aparece ao usuário.
    typesRequest: 'update',
    entityName: text.singularLabel,
    personalizedMessage: text.list.deletedToast,
    // SEM `onError` customizado (contrato de tela §5.4/risco 4) — o fallback
    // genérico do `useRequest` já extrai `error.response.data.message` da
    // `BusinessRuleException` ("Não é possível excluir um setor que possui
    // currais ou componentes vinculados.") e mostra o toast de erro.
    actionSuccess: () => {
      onCloseDeleteDialog();
      setToDelete(null);
    },
  });

  const isDeleting = deleteMutation.isPending;

  function handleDeleteClick(feedlotSector: FeedlotSectorListItem) {
    setToDelete(feedlotSector);
    onOpenDeleteDialog();
  }

  function handleConfirmDelete() {
    if (toDelete) {
      deleteMutation.mutate({ feedlotSectorUuid: toDelete.uuid });
    }
  }

  const columnHelper = createColumnHelper<FeedlotSectorListItem>();
  const defaultColumns = useMemo(
    () => [
      columnHelper.accessor('code', {
        header: text.list.table.code,
        cell: ({ row }) => (
          <Text fontFamily="mono" fontSize="sm" fontWeight="medium">
            {row.original.code}
          </Text>
        ),
        meta: { ...styleColumTable.sm, gridLabel: text.list.table.code },
      }),
      columnHelper.accessor('name', {
        header: text.list.table.name,
        enableHiding: false,
        meta: { gridLabel: text.list.table.name },
        cell: ({ row }) => (
          <Text fontWeight="medium" lineClamp="1">
            {row.original.name}
          </Text>
        ),
      }),
      // "Pátio" — FK aninhada (`feedlot_yard.name`), SÓ LEITURA, sem
      // round-trip extra ao backend (contrato de tela §2.2).
      columnHelper.accessor((row) => row.feedlot_yard?.name, {
        id: 'feedlot_yard',
        header: text.list.table.feedlotYard,
        cell: ({ row }) => <Text fontSize="sm">{row.original.feedlot_yard?.name ?? '—'}</Text>,
        meta: { ...styleColumTable.md, gridLabel: text.list.table.feedlotYard },
      }),
      // "Área (m²)" — SEMPRE vinda pronta do backend (runtime), texto simples,
      // sem Badge e sem formatação monetária (não é R$).
      columnHelper.accessor('area', {
        header: text.list.table.area,
        cell: ({ row }) => <Text fontSize="sm">{formatArea(row.original.area)}</Text>,
        meta: { ...styleColumTable.sm, gridLabel: text.list.table.area },
      }),
      columnHelper.accessor('created_at', {
        header: text.list.table.createdAt,
        cell: ({ row }) => <Text fontSize="sm">{formatDate(row.original.created_at)}</Text>,
        meta: { ...styleColumTable.date, gridLabel: text.list.table.createdAt },
      }),
      columnHelper.accessor('is_active', {
        header: text.list.table.active,
        cell: ({ row }) => (
          <Badge
            colorPalette={
              row.original.is_active
                ? feedlotSectorStatusColor.true
                : feedlotSectorStatusColor.false
            }
            variant="subtle"
            py={1}
            px={3}
          >
            {row.original.is_active ? text.list.table.activeLabel : text.list.table.inactiveLabel}
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
              <Actions.Item
                icon={<Icon as={FiEye} />}
                onClick={() => navigate(`/operacional/setores/${row.original.uuid}/detalhe`)}
              >
                {text.list.actions.view}
              </Actions.Item>
              {can('feedlot-sectors_edit') && (
                <Actions.Item
                  icon={<Icon as={FiEdit} />}
                  onClick={() => navigate(`/operacional/setores/${row.original.uuid}`)}
                >
                  {text.list.actions.edit}
                </Actions.Item>
              )}
              {can('feedlot-sectors_delete') && (
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
    [navigate, isDeleting, can, languageGB.defaltStrings.actions, text]
  );

  const gridSettings = useGridSettings<FeedlotSectorListItem>({
    storageKey: FEEDLOT_SECTORS_STORAGE_KEY,
    storageScope: useGridStorageScope(),
    columns: defaultColumns,
  });
  const { columnOrder, setColumnOrder, columnVisibility, setColumnVisibility } = gridSettings;

  const isLoading = checkLoadingStatus([feedlotSectorsList]);
  const items = feedlotSectorsList.data?.data?.items;
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
            />
          }
        >
          <VStack align="flex-start" gap={1}>
            <Text fontSize="2xl" fontWeight="bold" color="brandColorText">
              {text.list.pageTitle}
            </Text>
            <Text fontSize="sm" color="fg.muted">
              {text.list.pageSubtitle}
            </Text>
          </VStack>
        </HeaderGrid>

        <Box mt={6}>
          <Table
            isLoading={isLoading}
            isError={feedlotSectorsList.isError}
            error={feedlotSectorsList.error}
            isEmpty={isEmpty}
            onRetry={() => feedlotSectorsList.refetch()}
            isRetrying={feedlotSectorsList.isFetching}
            emptyIcon={FiBox as ElementType}
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
            onCreate={() => navigate('/operacional/setores/novo')}
          />
        </Box>
      </TableProvider>

      <FilterSideFeedlotSectors
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
