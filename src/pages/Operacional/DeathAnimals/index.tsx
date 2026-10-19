// src/pages/Operacional/DeathAnimals/index.tsx
// -----------------------------------------------------------------------------
// Tela de LISTAGEM (grid) de MORTES (DeathAnimal) — Operacional/Pecuária.
// Rota: `/operacional/mortes` (guardada por `death_animals_view`, registrada
// em `src/router/index.tsx`).
//
// Estrutura mirror `FeedlotYards/index.tsx` (sibling estrutural PRIMÁRIO —
// grid paginada + form + detalhe + exclusão + rota/menu novos, greenfield),
// SEM cálculo derivado (`FeedlotYard.area`) — todas as colunas vêm diretas do
// Resource.
//
// Colunas (ordem exata do legado, `LST-01..05`): Código / Animal / Causa /
// Data. `Animal` e `Causa` são FK aninhadas — `animal?.identification` com
// fallback i18n quando `null` (mirror `Rebanho/index.tsx`, `table.batchEmpty`
// de `Animal`); `cause.description` NÃO é nullable (`cause_id` NOT NULL na
// tabela) — sem fallback necessário. Ordenação SEMPRE `code desc`
// (server-side, `LST-04`) — NÃO adicionar ordenação client-side por data,
// mudaria comportamento não pedido.
//
// Exclusão: `useRequest` genérico + `DeleteConfirmDialog`, SEM `onError`
// customizado — nenhum 422 de negócio documentado para esta exclusão
// (diferente de `FeedlotYard`/setores vinculados); sucesso reverte
// `Animal.status` para `ACTIVE` no servidor (`SFX-02`), a tela só invalida
// cache e mostra toast.
// -----------------------------------------------------------------------------

import { useMemo, useState, type ElementType } from 'react';

import { Box, Flex, Icon, Text, useDisclosure, VStack } from '@chakra-ui/react';
import { createColumnHelper } from '@tanstack/react-table';
import { FiClipboard, FiEdit, FiEye, FiTrash2 } from 'react-icons/fi';
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

import { queryKey } from '@/constants/query-key';

import { deleteDeathAnimal } from '@/services/v2/DeathAnimals/death-animal-service';

import type { DeathAnimalFilterForm, DeathAnimalListItem } from '@/@types/v2/DeathAnimals';

import { FilterSideDeathAnimals } from './FilterSideDeathAnimals';
import { HeaderTable } from './HeaderTable';
import { useDeathAnimalsList } from './useDeathAnimals';

// Chave de storage desta tela — paginação (`userPaginatedQuery`) e
// personalização de grid (`useGridSettings`) derivam da MESMA expressão
// (mirror `FEEDLOT_YARDS_STORAGE_KEY`), nunca literal cru repetido.
const DEATH_ANIMALS_STORAGE_KEY = 'OperacionalDeathAnimals' + queryKey.deathAnimals.deathAnimals;

export default function DeathAnimalList() {
  const { languageGB } = useLanguage();
  const navigate = useNavigate();
  const { can } = usePermissions();
  const text = languageGB.deathAnimals.deathAnimal;

  const canCreate = can('death_animals_create');

  const defaultQueryOptions = useMemo(
    () => ({
      pageSize: 10,
      storageKey: DEATH_ANIMALS_STORAGE_KEY,
    }),
    []
  );

  const { paginatedQuery, handlePaginatedQuery, handleFilterChange, handleResetFilter } =
    userPaginatedQuery<DeathAnimalFilterForm>(defaultQueryOptions);

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
  const [toDelete, setToDelete] = useState<DeathAnimalListItem | null>(null);
  const {
    open: isOpenDeleteDialog,
    onOpen: onOpenDeleteDialog,
    onClose: onCloseDeleteDialog,
  } = useDisclosure();

  const deathAnimalsList = useDeathAnimalsList({
    paginatedQuery,
    setPaginatedQuery: handlePaginatedQuery,
    filter: {
      animal_identification: paginatedQuery.filter?.animal_identification,
      cause_uuid: paginatedQuery.filter?.cause_uuid,
      start_date: paginatedQuery.filter?.start_date,
      end_date: paginatedQuery.filter?.end_date,
    },
  });

  const deleteMutation = useRequest({
    asyncFunction: async ({ deathAnimalUuid }: { deathAnimalUuid: string }) =>
      deleteDeathAnimal(deathAnimalUuid),
    queryKey: queryKey.deathAnimals.deathAnimals,
    queryKey2: queryKey.deathAnimals.deathAnimal,
    // `useRequest`'s TypesRequest não tem variante "delete" (só update/create/
    // apply/export/revoke/restore) — "update" é a mesma convenção já usada por
    // `FeedlotYard/index.tsx` para exclusão. O texto do toast vem de
    // `personalizedMessage`, então o rótulo genérico de "update" nunca aparece
    // ao usuário.
    typesRequest: 'update',
    entityName: text.singularLabel,
    personalizedMessage: text.list.deletedToast,
    // SEM `onError` customizado — nenhum 422 de negócio documentado para esta
    // exclusão (diferente de `FeedlotYard`/setores vinculados); `destroy()`
    // sempre reverte `Animal.status` para `ACTIVE` no servidor.
    actionSuccess: () => {
      onCloseDeleteDialog();
      setToDelete(null);
    },
  });

  const isDeleting = deleteMutation.isPending;

  function handleDeleteClick(deathAnimal: DeathAnimalListItem) {
    setToDelete(deathAnimal);
    onOpenDeleteDialog();
  }

  function handleConfirmDelete() {
    if (toDelete) {
      deleteMutation.mutate({ deathAnimalUuid: toDelete.uuid });
    }
  }

  const columnHelper = createColumnHelper<DeathAnimalListItem>();
  const defaultColumns = useMemo(
    () => [
      // Ordem exata do legado (LST-01..05): Código / Animal / Causa / Data.
      columnHelper.accessor('code', {
        header: text.list.table.code,
        cell: ({ row }) => (
          <Text fontFamily="mono" fontSize="sm" fontWeight="medium">
            {row.original.code}
          </Text>
        ),
        meta: { ...styleColumTable.sm, gridLabel: text.list.table.code },
      }),
      columnHelper.accessor('animal', {
        header: text.list.table.animal,
        enableHiding: false,
        meta: { gridLabel: text.list.table.animal },
        // FK aninhada, pode ser `null` — fallback i18n (mirror `Rebanho/index.tsx`,
        // `table.batchEmpty` de `Animal`), nunca renderiza `undefined`/crash.
        cell: ({ row }) => (
          <Text fontWeight="medium" lineClamp="1">
            {row.original.animal?.identification ?? text.list.table.animalEmpty}
          </Text>
        ),
      }),
      columnHelper.accessor('cause', {
        header: text.list.table.cause,
        // `cause_id` é NOT NULL na tabela — sem fallback necessário aqui.
        cell: ({ row }) => <Text fontSize="sm">{row.original.cause.description}</Text>,
        meta: { gridLabel: text.list.table.cause },
      }),
      columnHelper.accessor('date', {
        header: text.list.table.date,
        cell: ({ row }) => <Text fontSize="sm">{formatDate(row.original.date)}</Text>,
        // Coluna "Data" presente, MAS sem `OrdeByColumn`/ordenação client-side
        // — `LST-04` confirma que o legado NUNCA ordenou por data. Ordenação
        // é SEMPRE `code desc`, fixa server-side.
        meta: { ...styleColumTable.date, gridLabel: text.list.table.date },
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
                onClick={() => navigate(`/operacional/mortes/${row.original.uuid}/detalhe`)}
              >
                {text.list.actions.view}
              </Actions.Item>
              {can('death_animals_edit') && (
                <Actions.Item
                  icon={<Icon as={FiEdit} />}
                  onClick={() => navigate(`/operacional/mortes/${row.original.uuid}`)}
                >
                  {text.list.actions.edit}
                </Actions.Item>
              )}
              {can('death_animals_delete') && (
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

  const gridSettings = useGridSettings<DeathAnimalListItem>({
    storageKey: DEATH_ANIMALS_STORAGE_KEY,
    storageScope: useGridStorageScope(),
    columns: defaultColumns,
  });
  const { columnOrder, setColumnOrder, columnVisibility, setColumnVisibility } = gridSettings;

  const isLoading = checkLoadingStatus([deathAnimalsList]);
  const items = deathAnimalsList.data?.data?.items;
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
            isError={deathAnimalsList.isError}
            error={deathAnimalsList.error}
            onRetry={() => deathAnimalsList.refetch()}
            isRetrying={deathAnimalsList.isFetching}
            isEmpty={isEmpty}
            emptyIcon={FiClipboard as ElementType}
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
            onCreate={() => navigate('/operacional/mortes/novo')}
          />
        </Box>
      </TableProvider>

      <FilterSideDeathAnimals
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
        itemName={toDelete?.code}
        tone="danger"
      />
    </ContainerGrid>
  );
}
