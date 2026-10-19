// src/pages/BaseRegistrations/Indexers/index.tsx
// -----------------------------------------------------------------------------
// Tela de LISTAGEM (grid FLAT — sem hierarquia, COM paginação REAL — padrão
// do projeto 10/página, per_page enviado dinamicamente ao back conforme
// pageSize do grid) de INDEXADORES (Indexer) — Cadastros Base / Financeiros.
// Rota: /cadastros-base/indexadores (guardada por `indexers_view`,
// registrada em src/router/index.tsx — TASK-FE-213 — este arquivo não mexe
// em rota/menu).
//
// Mirror mecânico de `ObservacaoNascimento/index.tsx` (BirthNote) + 1 coluna
// extra (`descriptive`, mesmo estilo visual de `description` — Doc Bruta
// §2: os 2 campos textuais aparecem lado a lado na listagem legada, sem
// hierarquia entre eles):
//   - grid via useIndexadoresList (paginação REAL);
//   - HeaderTable → botões de ação (Add respeita indexers_create);
//   - FilterSideIndexadores → drawer com SÓ `search` (a UI mantém 1 único
//     campo mesmo o backend filtrando 2 colunas, D9 do contrato de API);
//   - delete via useRequest + DeleteConfirmDialog (respeita indexers_delete;
//     onError GENÉRICO do useRequest — D8, nunca 422 por FK nesta tela).
// -----------------------------------------------------------------------------

import { ElementType, useMemo, useState } from 'react';

import { Badge, Box, Flex, Icon, Text, useDisclosure, VStack } from '@chakra-ui/react';
import { createColumnHelper } from '@tanstack/react-table';
import { FiEdit, FiFileText, FiTrash2 } from 'react-icons/fi';
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

import { deleteIndexer, listIndexers } from '@/services/v2/BaseRegistrations/indexer-service';

import type { IndexerFilterForm, IndexerListItem } from '@/@types/v2/BaseRegistrations/indexer';

import { FilterSideIndexers } from './FilterSideIndexers';
import { HeaderTable } from './HeaderTable';

export default function IndexersList() {
  const { languageGB } = useLanguage();
  const navigate = useNavigate();
  const { can } = usePermissions();
  const text = languageGB.baseRegistrations.indexer;

  const canCreate = can('indexers_create');
  const canEdit = can('indexers_edit');
  const canDelete = can('indexers_delete');

  const defaultQueryOptions = useMemo(
    () => ({
      pageSize: 10,
      storageKey: languageGB.baseRegistrations.titleModule + queryKey.baseRegistrations.indexers,
    }),
    []
  );

  const { paginatedQuery, handlePaginatedQuery, handleFilterChange, handleResetFilter } =
    userPaginatedQuery<IndexerFilterForm>(defaultQueryOptions);

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
  const [toDelete, setToDelete] = useState<IndexerListItem | null>(null);
  const {
    open: isOpenDeleteDialog,
    onOpen: onOpenDeleteDialog,
    onClose: onCloseDeleteDialog,
  } = useDisclosure();

  const indexersList = useCustomGridQuery<IndexerListItem, IndexerFilterForm>({
    asyncFunction: listIndexers,
    queryKey: queryKey.baseRegistrations.indexers,
    paginatedQuery,
    setPaginatedQuery: handlePaginatedQuery,
    filterQuery: [],
    filter: paginatedQuery.filter ?? ({} as IndexerFilterForm),
  });

  const deleteMutation = useRequest({
    asyncFunction: async ({ indexerUuid }: { indexerUuid: string }) => {
      return await deleteIndexer(indexerUuid);
    },
    queryKey: queryKey.baseRegistrations.indexers,
    queryKey2: queryKey.baseRegistrations.indexer,
    // `useRequest`'s TypesRequest não tem variante "delete" (só update/create/
    // apply/export/revoke/restore) — "update" é a mesma convenção usada por
    // BirthNote/IdentificationType para a mesma operação. O texto exibido no
    // toast vem de `personalizedMessage`, então o rótulo genérico associado a
    // "update" nunca aparece ao usuário.
    //
    // onError: NÃO customizado — usa o tratamento genérico interno do
    // useRequest. D8 do contrato de API (§6): DELETE é físico direto, sem
    // guarda de FK — nunca ocorre 422 "em uso" nesta tela.
    typesRequest: 'update',
    entityName: text.singularLabel,
    personalizedMessage: text.list.deletedToast,
    actionSuccess: () => {
      onCloseDeleteDialog();
      setToDelete(null);
    },
  });

  const handleDeleteClick = (indexer: IndexerListItem) => {
    setToDelete(indexer);
    onOpenDeleteDialog();
  };

  const handleConfirmDelete = () => {
    if (toDelete) {
      deleteMutation.mutate({ indexerUuid: toDelete.uuid });
    }
  };

  const isDeleting = deleteMutation.isPending;

  const columnHelper = createColumnHelper<IndexerListItem>();
  const defaultColumns = useMemo(
    () => [
      columnHelper.accessor('description', {
        header: text.list.table.description,
        cell: ({ row }) => (
          <Text fontWeight="medium" lineClamp="1">
            {row.original.description}
          </Text>
        ),
        meta: { gridLabel: text.list.table.description },
      }),
      columnHelper.accessor('descriptive', {
        header: text.list.table.descriptive,
        cell: ({ row }) => (
          <Text fontWeight="medium" lineClamp="1">
            {row.original.descriptive}
          </Text>
        ),
        meta: { gridLabel: text.list.table.descriptive },
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
        meta: { ...styleColumTable.sm, gridLabel: text.list.table.status },
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
                  onClick={() => navigate(`/cadastros-base/indexadores/${row.original.uuid}`)}
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
    [navigate, isDeleting, languageGB.defaltStrings.actions, text, canEdit, canDelete]
  );

  const gridSettings = useGridSettings<IndexerListItem>({
    storageKey: 'GBCerneBaseRegistrationsIndexers',
    storageScope: useGridStorageScope(),
    columns: defaultColumns,
  });
  const { columnOrder, setColumnOrder, columnVisibility, setColumnVisibility } = gridSettings;

  const isLoading = checkLoadingStatus([indexersList]);
  const items = indexersList.data?.data?.items;
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
            isError={indexersList.isError}
            error={indexersList.error}
            isEmpty={isEmpty}
            onRetry={() => indexersList.refetch()}
            isRetrying={indexersList.isFetching}
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
            onCreate={() => navigate('/cadastros-base/indexadores/novo')}
          />
        </Box>
      </TableProvider>

      <FilterSideIndexers
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
