// src/pages/Operacional/Reproducao/BullSeedSeason/index.tsx
// -----------------------------------------------------------------------------
// Tela de LISTAGEM (grid) de TOUROS/SÊMEN/EMBRIÃO — Operacional / Reprodução
// (item de menu FILHO NOVO `ope-pec-rep-bss`, `GAP-BSS-FE-01`).
//
// Rota: /operacional/touros-semen-embriao (guardada por
// `bull-seed-season_view`, registrada em src/router/index.tsx — este
// arquivo não mexe em rota/menu).
//
// Estrutura mirror DIRETO de `EstacaoDeMonta/index.tsx` (mesmo submódulo):
// grid paginado REAL de servidor via `useBullSeedSeasonsList`
// (`useCustomGridQuery`, sem ID de contexto) + `FilterSideBullSeedSeason`
// com re-hidratação (Contrato B) + dropdown de ações + `useRequest` para
// exclusão, `onError` GENÉRICO — 422 de negócio (FK filha) exibido tal como
// vem do servidor (contrato de tela §4.5, armadilha 4 da Tarefa 24).
//
// Colunas (contrato de tela §4.2): Código/Data/Estação de Monta/
// Responsável/Descrição/Ações. Sem coluna de ordenação clicável (API usa
// `orderBy('id')` determinístico, sem `sort` exposto) e sem busca textual
// (armadilha 2 — `BullSeedSeasonFilterRequest` só tem `start_date`/
// `end_date`).
// -----------------------------------------------------------------------------

import { useMemo, useState } from 'react';

import type { ElementType } from 'react';

import { Box, Flex, Icon, Text, useDisclosure, VStack } from '@chakra-ui/react';
import { createColumnHelper } from '@tanstack/react-table';
import { FiDroplet, FiEye, FiEdit, FiTrash2 } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';

import { Actions } from '@/components/Action';
import { Button } from '@/components/Button';
import { ButtonFilter } from '@/components/ButtonFilter';
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
import formatDate from '@/utils/formatDate';
import { styleColumTable } from '@/utils/style-colum-table';

import { queryKey } from '@/constants/query-key';

import { deleteBullSeedSeason } from '@/services/v2/BullSeedSeason/bull-seed-season-service';

import type {
  BullSeedSeasonFilterRequest,
  BullSeedSeasonListItem,
} from '@/@types/v2/BullSeedSeason';

import { FilterSideBullSeedSeason } from './FilterSideBullSeedSeason';
import { useBullSeedSeasonsList } from './useBullSeedSeasons';

const BULL_SEED_SEASON_STORAGE_KEY =
  'OperacionalReproducaoBullSeedSeason' + queryKey.bullSeedSeason.bullSeedSeasonsList;
const BULL_SEED_SEASON_LIST_ROUTE = '/operacional/touros-semen-embriao';

export default function BullSeedSeasonList() {
  const { languageGB } = useLanguage();
  const navigate = useNavigate();
  const { can } = usePermissions();
  const text = languageGB.bullSeedSeason.bullSeedSeason;

  const canView = can('bull-seed-season_view');
  const canEdit = can('bull-seed-season_edit');
  const canCreate = can('bull-seed-season_create');
  const canDelete = can('bull-seed-season_delete');

  const defaultQueryOptions = useMemo(
    () => ({
      pageSize: 10,
      storageKey: BULL_SEED_SEASON_STORAGE_KEY,
    }),
    []
  );

  const { paginatedQuery, handlePaginatedQuery, handleFilterChange, handleResetFilter } =
    userPaginatedQuery<BullSeedSeasonFilterRequest>(defaultQueryOptions);

  // ---- Estado de filtro (drawer) ------------------------------------------
  const { open: isFilterOpen, onOpen: onOpenFilter, onClose: onCloseFilter } = useDisclosure();

  const filtersApplied = useMemo(
    () =>
      Object.values(paginatedQuery.filter ?? {}).filter(
        (v) => v !== undefined && v !== null && v !== ''
      ).length,
    [paginatedQuery.filter]
  );

  const bullSeedSeasonsList = useBullSeedSeasonsList({
    paginatedQuery,
    setPaginatedQuery: handlePaginatedQuery,
    filter: paginatedQuery.filter ?? undefined,
  });

  // ---- Estado de exclusão --------------------------------------------------
  const [toDelete, setToDelete] = useState<BullSeedSeasonListItem | null>(null);
  const {
    open: isOpenDeleteDialog,
    onOpen: onOpenDeleteDialog,
    onClose: onCloseDeleteDialog,
  } = useDisclosure();

  // `onError` NÃO customizado — usa o tratamento genérico interno do
  // `useRequest`, que já lê `errors`/`message` do envelope 422 e exibe a
  // mensagem do servidor tal como vem (armadilha 4 da Tarefa 24: FK filha
  // vira 422 de negócio, nunca uma mensagem genérica fabricada aqui).
  const deleteMutation = useRequest({
    asyncFunction: async ({ bullSeedSeasonUuid }: { bullSeedSeasonUuid: string }) => {
      return await deleteBullSeedSeason(bullSeedSeasonUuid);
    },
    queryKey: queryKey.bullSeedSeason.bullSeedSeasonsList,
    queryKey2: queryKey.bullSeedSeason.bullSeedSeason,
    typesRequest: 'update',
    entityName: text.singularLabel,
    personalizedMessage: text.list.deletedToast,
    actionSuccess: () => {
      onCloseDeleteDialog();
      setToDelete(null);
    },
  });

  const isDeleting = deleteMutation.isPending;

  function handleDeleteClick(item: BullSeedSeasonListItem) {
    setToDelete(item);
    onOpenDeleteDialog();
  }

  function handleConfirmDelete() {
    if (toDelete) {
      deleteMutation.mutate({ bullSeedSeasonUuid: toDelete.uuid });
    }
  }

  const columnHelper = createColumnHelper<BullSeedSeasonListItem>();
  const defaultColumns = useMemo(
    () => [
      columnHelper.accessor('code', {
        header: text.list.table.code,
        cell: ({ row }) => <Text fontWeight="medium">{row.original.code}</Text>,
        meta: styleColumTable.sm,
      }),
      columnHelper.accessor('date', {
        header: text.list.table.date,
        cell: ({ row }) => (
          <Text fontSize="sm" color="fg.muted">
            {formatDate(row.original.date)}
          </Text>
        ),
        meta: styleColumTable.date,
      }),
      columnHelper.accessor((row) => row.breeding_season?.description, {
        id: 'breeding_season',
        header: text.list.table.breedingSeason,
        cell: ({ row }) => (
          <Text fontSize="sm" lineClamp="1">
            {row.original.breeding_season?.description || '—'}
          </Text>
        ),
        meta: styleColumTable.md,
      }),
      columnHelper.accessor('responsible_name', {
        header: text.list.table.responsible,
        cell: ({ row }) => (
          <Text fontSize="sm" lineClamp="1">
            {row.original.responsible_name || '—'}
          </Text>
        ),
        meta: styleColumTable.md,
      }),
      columnHelper.accessor('description', {
        header: text.list.table.description,
        cell: ({ row }) => (
          <Text fontSize="sm" color="fg.muted" lineClamp="1" title={row.original.description}>
            {row.original.description || '—'}
          </Text>
        ),
        meta: styleColumTable.lg,
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
                  onClick={() => navigate(`${BULL_SEED_SEASON_LIST_ROUTE}/${row.original.uuid}`)}
                >
                  {text.list.actions.view}
                </Actions.Item>
              )}
              {canEdit && (
                <Actions.Item
                  icon={<Icon as={FiEdit} />}
                  onClick={() =>
                    navigate(`${BULL_SEED_SEASON_LIST_ROUTE}/${row.original.uuid}/editar`)
                  }
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
    [navigate, isDeleting, text, canView, canEdit, canDelete, languageGB.defaltStrings.actions]
  );

  const isLoading = checkLoadingStatus([bullSeedSeasonsList]);
  const items = bullSeedSeasonsList.data?.data?.items;
  const isEmpty = !isLoading && (items?.length ?? 0) === 0;

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
            <>
              {canCreate && (
                <Button
                  title={text.list.newButton}
                  size="sm"
                  onClick={() => navigate(`${BULL_SEED_SEASON_LIST_ROUTE}/novo`)}
                />
              )}
              <ButtonFilter filtersApplied={filtersApplied} onClick={onOpenFilter} />
            </>
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
            isError={bullSeedSeasonsList.isError}
            error={bullSeedSeasonsList.error}
            isEmpty={isEmpty}
            onRetry={() => bullSeedSeasonsList.refetch()}
            isRetrying={bullSeedSeasonsList.isFetching}
            emptyIcon={FiDroplet as ElementType}
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
            onCreate={() => navigate(`${BULL_SEED_SEASON_LIST_ROUTE}/novo`)}
          />
        </Box>
      </TableProvider>

      <FilterSideBullSeedSeason
        isOpen={isFilterOpen}
        onClose={onCloseFilter}
        handleFilterChange={handleFilterChange}
        handleReset={handleResetFilter}
        filter={paginatedQuery.filter}
        languageGB={languageGB}
      />

      {/* Componente genérico compõe "{description} {itemName}?" — a copy
          exata do contrato ("Excluir registro de Touros/Sêmen/Embrião?")
          não cabe nessa ordem fixa; usamos `title`+`itemName` (mirror
          `EstacaoDeMonta/index.tsx`) para não forçar um patch local no
          componente (Lei 2). */}
      <DeleteConfirmDialog
        isOpen={isOpenDeleteDialog}
        onClose={() => {
          onCloseDeleteDialog();
          setToDelete(null);
        }}
        onConfirm={handleConfirmDelete}
        isLoading={isDeleting}
        title={text.list.deleteDialog.title}
        itemName={toDelete?.code}
        tone="danger"
      />
    </ContainerGrid>
  );
}
