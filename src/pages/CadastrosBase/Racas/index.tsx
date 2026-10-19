// src/pages/CadastrosBase/Racas/index.tsx
// -----------------------------------------------------------------------------
// Tela de LISTAGEM (grid flat, sem hierarquia) de RAÇAS — Cadastros Base.
// Rota: /cadastros-base/racas (guardada por `breeds_view`, registrada em
// src/router/index.tsx antes do catch-all /cadastros-base/*).
//
// Estrutura idêntica a CadastrosBase/CentroCusto/index.tsx e
// CadastrosBase/Perfil/index.tsx (grid paginado + HeaderTable + FilterSide +
// delete via useRequest + DeleteConfirmDialog). TASK-BREED-FRONT-PAG: `GET
// /breeds` agora pagina de verdade (meta real) e o filtro por Espécie virou
// SERVER-SIDE (`specie_uuid` na querystring, via `useBreedsList`/
// `breed-service.ts`) — a tela consome `items`/`pagination` direto da
// resposta, sem filtragem em memória.
//
// Sem flags `can_edit`/`can_delete` por item no `BreedResource` (diferente de
// CostCenter/DEC-005) — autorização das ações de linha é 100% por permissão
// GLOBAL (`breeds_edit`/`breeds_delete`), mesmo padrão de Perfil/index.tsx.
//
// Exclusão DEFINITIVA (`Breed` não usa SoftDeletes) — o `DeleteConfirmDialog`
// recebe copy própria (`warningText`) deixando isso explícito, em vez do
// aviso genérico padrão do componente.
// -----------------------------------------------------------------------------

import { ElementType, useMemo, useState } from 'react';

import { Badge, Box, Flex, Icon, Text, useDisclosure, VStack } from '@chakra-ui/react';
import { createColumnHelper } from '@tanstack/react-table';
import { FiEdit, FiTrash2, FiUsers } from 'react-icons/fi';
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

import { deleteBreed } from '@/services/v2/Breeds/breed-service';

import type { BreedFilterForm, BreedListItem } from '@/@types/v2/Breeds/breed';

import { FilterSideRacas } from './FilterSideRacas';
import { HeaderTable } from './HeaderTable';
import { useBreedsList } from './useBreeds';

export default function RacasList() {
  const { languageGB } = useLanguage();
  const navigate = useNavigate();
  const { can } = usePermissions();
  const text = languageGB.breeds.breed;

  const canCreate = can('breeds_create');
  const canEdit = can('breeds_edit');
  const canDelete = can('breeds_delete');

  const defaultQueryOptions = useMemo(
    () => ({
      pageSize: 10,
      storageKey: 'CadastrosBaseRacas' + queryKey.breeds.list,
    }),
    []
  );

  const { paginatedQuery, handlePaginatedQuery, handleFilterChange, handleResetFilter } =
    userPaginatedQuery<BreedFilterForm>(defaultQueryOptions);

  // ---- Estado de filtro (drawer) ------------------------------------------
  const { open: isFilterOpen, onOpen: onOpenFilter, onClose: onCloseFilter } = useDisclosure();

  const filtersApplied = useMemo(
    () =>
      Object.entries(paginatedQuery.filter ?? {})
        // Chaves `*_label` (ex.: `specie_label`, TASK-BREED-FILTER-FIX) são
        // DISPLAY-ONLY — persistidas só para re-hidratar o label do
        // SelectAsyncPaginate no drawer, nunca enviadas à API — e não devem
        // inflar o badge "Filtros(N)" (regra genérica, reutilizável por
        // qualquer filtro futuro que siga o mesmo padrão `*_label`).
        .filter(([key]) => !key.endsWith('_label'))
        .map(([, v]) => v)
        .filter((v) => v !== undefined && v !== null && v !== '' && v !== false).length,
    [paginatedQuery.filter]
  );

  // ---- Estado de exclusão --------------------------------------------------
  const [toDelete, setToDelete] = useState<BreedListItem | null>(null);
  const {
    open: isOpenDeleteDialog,
    onOpen: onOpenDeleteDialog,
    onClose: onCloseDeleteDialog,
  } = useDisclosure();

  const breedsList = useBreedsList({
    paginatedQuery,
    setPaginatedQuery: handlePaginatedQuery,
    filter: paginatedQuery.filter ?? undefined,
  });

  const deleteMutation = useRequest({
    asyncFunction: async ({ breedUuid }: { breedUuid: string }) => {
      return await deleteBreed(breedUuid);
    },
    queryKey: queryKey.breeds.list,
    queryKey2: queryKey.breeds.detail,
    // `useRequest`'s TypesRequest não tem variante "delete" — "update" é a
    // opção compilável usada pelo mesmo motivo em CostCenters/Perfil (o
    // texto exibido vem de `personalizedMessage`, o rótulo genérico
    // associado a "update" nunca aparece ao usuário).
    typesRequest: 'update',
    entityName: text.singularLabel,
    personalizedMessage: text.list.deletedToast,
    actionSuccess: () => {
      onCloseDeleteDialog();
      setToDelete(null);
    },
  });

  const handleDeleteClick = (breed: BreedListItem) => {
    setToDelete(breed);
    onOpenDeleteDialog();
  };

  const handleConfirmDelete = () => {
    if (toDelete) {
      deleteMutation.mutate({ breedUuid: toDelete.uuid });
    }
  };

  const isDeleting = deleteMutation.isPending;

  // ---- Itens da página atual — filtro por Espécie é SERVER-SIDE agora -----
  // (TASK-BREED-FRONT-PAG: `specie_uuid` já vai na querystring de `/breeds`
  // via `useBreedsList`/`breed-service.ts` — nenhuma filtragem em memória).
  const items = breedsList.data?.data?.items ?? [];

  const columnHelper = createColumnHelper<BreedListItem>();
  const defaultColumns = useMemo(
    () => [
      columnHelper.accessor('description', {
        header: text.list.table.description,
        cell: ({ row }) => (
          <Text fontWeight="medium" lineClamp="1">
            {row.original.description}
          </Text>
        ),
      }),
      columnHelper.accessor((row) => row.specie?.description ?? '', {
        id: 'specie',
        header: text.list.table.specie,
        cell: ({ row }) =>
          row.original.specie ? (
            <Text fontSize="sm" color="fg.muted" lineClamp="1">
              {row.original.specie.description}
            </Text>
          ) : (
            <Text fontSize="sm" color="fg.muted">
              —
            </Text>
          ),
        meta: styleColumTable.md,
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
                  onClick={() => navigate(`/cadastros-base/racas/${row.original.uuid}`)}
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

  const isLoading = checkLoadingStatus([breedsList]);
  const isEmpty = !isLoading && items.length === 0;

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
            isError={breedsList.isError}
            error={breedsList.error}
            isEmpty={isEmpty}
            onRetry={() => breedsList.refetch()}
            isRetrying={breedsList.isFetching}
            emptyIcon={FiUsers as ElementType}
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
            onCreate={() => navigate('/cadastros-base/racas/novo')}
          />
        </Box>
      </TableProvider>

      <FilterSideRacas
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
        title={text.list.deleteConfirm.title}
        itemName={toDelete?.description}
        warningText={text.list.deleteConfirm.warning}
      />
    </ContainerGrid>
  );
}
