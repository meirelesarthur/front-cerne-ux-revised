// src/pages/Operacional/FeedlotYards/index.tsx
// -----------------------------------------------------------------------------
// Tela de LISTAGEM (grid) de PÁTIOS (FeedlotYard) — Operacional/Confinamento.
// Rota: /operacional/patios (guardada por `feedlot-yards_view`, registrada em
// TASK-PT-FE-01 — este arquivo não mexe em rota/menu).
//
// Estrutura mirror `CadastrosBase/CentroCusto/index.tsx` (sibling estrutural
// PRIMÁRIO desta fatia) SEM a lógica de hierarquia/`class`/descendente —
// `FeedlotYard` é uma entidade FLAT:
//   - grid paginado (TableProvider + Table) via useFeedlotYardsList
//     (useCustomGridQuery, SEM ID de contexto);
//   - HeaderTable      → botão "Novo" (respeita feedlot-yards_create);
//   - FilterSideFeedlotYards → drawer (code/name/is_active);
//   - delete via useRequest genérico + DeleteConfirmDialog (respeita
//     feedlot-yards_delete; 422 de negócio — setor vinculado — vira toast
//     com a `message` do envelope, SEM `onError` customizado/diálogo
//     dedicado, TASK-PT-FE-01 §Riscos item 4).
//
// `priority` (rótulo "Ordem") NÃO é coluna desta listagem — fiel ao legado
// (`CLM-17`), só aparece na tela de Detalhe (`DetalheFeedlotYard.tsx`).
// Coluna "Área (m²)" vem PRONTA do backend (`FeedlotYardResource.area`,
// runtime) — formatada com `Intl.NumberFormat`, texto simples, SEM `Badge`
// e SEM formatação monetária (não é R$, é m²).
// -----------------------------------------------------------------------------

import { useMemo, useState, type ElementType } from 'react';

import { Badge, Box, Flex, Icon, Text, useDisclosure } from '@chakra-ui/react';
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
import { styleColumTable } from '@/utils/style-colum-table';

import { feedlotYardStatusColor } from '@/constants/FeedlotYards/feedlot-yard-status';
import { queryKey } from '@/constants/query-key';

import { deleteFeedlotYard } from '@/services/v2/FeedlotYards/feedlot-yard-service';

import type { FeedlotYardFilterForm, FeedlotYardListItem } from '@/@types/v2/FeedlotYards';

import { FilterSideFeedlotYards } from './FilterSideFeedlotYards';
import { HeaderTable } from './HeaderTable';
import { useFeedlotYardsList } from './useFeedlotYards';

import { PageHeader } from '@/components/ui/PageHeader';

// Chave de storage desta tela — paginação (`userPaginatedQuery`) e
// personalização de grid (`useGridSettings`) derivam da MESMA expressão
// (mirror `CENTRO_CUSTO_STORAGE_KEY`), nunca literal cru repetido.
const FEEDLOT_YARDS_STORAGE_KEY = 'OperacionalFeedlotYards' + queryKey.feedlotYards.feedlotYards;

// Formatação de "Área (m²)" — 2 casas, SEM símbolo monetário (é m², não R$).
const areaFormatter = new Intl.NumberFormat('pt-BR', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

function formatArea(area: number | null): string {
  return area === null || area === undefined ? '—' : `${areaFormatter.format(area)} m²`;
}

export default function FeedlotYardList() {
  const { languageGB } = useLanguage();
  const navigate = useNavigate();
  const { can } = usePermissions();
  const text = languageGB.feedlotYards.feedlotYard;

  const canCreate = can('feedlot-yards_create');

  const defaultQueryOptions = useMemo(
    () => ({
      pageSize: 10,
      storageKey: FEEDLOT_YARDS_STORAGE_KEY,
    }),
    []
  );

  const { paginatedQuery, handlePaginatedQuery, handleFilterChange, handleResetFilter } =
    userPaginatedQuery<FeedlotYardFilterForm>(defaultQueryOptions);

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
  const [toDelete, setToDelete] = useState<FeedlotYardListItem | null>(null);
  const {
    open: isOpenDeleteDialog,
    onOpen: onOpenDeleteDialog,
    onClose: onCloseDeleteDialog,
  } = useDisclosure();

  const feedlotYardsList = useFeedlotYardsList({
    paginatedQuery,
    setPaginatedQuery: handlePaginatedQuery,
    filter: {
      code: paginatedQuery.filter?.code,
      name: paginatedQuery.filter?.name,
      is_active: paginatedQuery.filter?.is_active?.value,
    },
  });

  const deleteMutation = useRequest({
    asyncFunction: async ({ feedlotYardUuid }: { feedlotYardUuid: string }) =>
      deleteFeedlotYard(feedlotYardUuid),
    queryKey: queryKey.feedlotYards.feedlotYards,
    queryKey2: queryKey.feedlotYards.feedlotYard,
    // `useRequest`'s TypesRequest não tem variante "delete" (só update/create/
    // apply/export/revoke/restore) — "update" é a mesma convenção já usada por
    // `CentroCusto/index.tsx`/`Pastagem/index.tsx` para exclusão. O texto do
    // toast vem de `personalizedMessage`, então o rótulo genérico de "update"
    // nunca aparece ao usuário.
    typesRequest: 'update',
    entityName: text.singularLabel,
    personalizedMessage: text.list.deletedToast,
    // SEM `onError` customizado (TASK-PT-FE-01 §Riscos item 4) — o fallback
    // genérico do `useRequest` já extrai `error.response.data.message` da
    // `BusinessRuleException` ("Não é possível excluir um pátio que possui
    // setores vinculados.") e mostra o toast de erro.
    actionSuccess: () => {
      onCloseDeleteDialog();
      setToDelete(null);
    },
  });

  const isDeleting = deleteMutation.isPending;

  function handleDeleteClick(feedlotYard: FeedlotYardListItem) {
    setToDelete(feedlotYard);
    onOpenDeleteDialog();
  }

  function handleConfirmDelete() {
    if (toDelete) {
      deleteMutation.mutate({ feedlotYardUuid: toDelete.uuid });
    }
  }

  const columnHelper = createColumnHelper<FeedlotYardListItem>();
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
      // "Área (m²)" — SEMPRE vinda pronta do backend (runtime), texto simples,
      // sem Badge e sem formatação monetária (não é R$).
      columnHelper.accessor('area', {
        header: text.list.table.area,
        cell: ({ row }) => <Text fontSize="sm">{formatArea(row.original.area)}</Text>,
        meta: { ...styleColumTable.sm, gridLabel: text.list.table.area },
      }),
      columnHelper.accessor('is_active', {
        header: text.list.table.active,
        cell: ({ row }) => (
          <Badge
            colorPalette={
              row.original.is_active ? feedlotYardStatusColor.true : feedlotYardStatusColor.false
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
                onClick={() => navigate(`/operacional/patios/${row.original.uuid}/detalhe`)}
              >
                {text.list.actions.view}
              </Actions.Item>
              {can('feedlot-yards_edit') && (
                <Actions.Item
                  icon={<Icon as={FiEdit} />}
                  onClick={() => navigate(`/operacional/patios/${row.original.uuid}`)}
                >
                  {text.list.actions.edit}
                </Actions.Item>
              )}
              {can('feedlot-yards_delete') && (
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

  const gridSettings = useGridSettings<FeedlotYardListItem>({
    storageKey: FEEDLOT_YARDS_STORAGE_KEY,
    storageScope: useGridStorageScope(),
    columns: defaultColumns,
  });
  const { columnOrder, setColumnOrder, columnVisibility, setColumnVisibility } = gridSettings;

  const isLoading = checkLoadingStatus([feedlotYardsList]);
  const items = feedlotYardsList.data?.data?.items;
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
          <PageHeader title={text.list.pageTitle} description={text.list.pageSubtitle} />
        </HeaderGrid>

        <Box mt={6}>
          <Table
            isLoading={isLoading}
            isError={feedlotYardsList.isError}
            error={feedlotYardsList.error}
            isEmpty={isEmpty}
            onRetry={() => feedlotYardsList.refetch()}
            isRetrying={feedlotYardsList.isFetching}
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
            onCreate={() => navigate('/operacional/patios/novo')}
          />
        </Box>
      </TableProvider>

      <FilterSideFeedlotYards
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
