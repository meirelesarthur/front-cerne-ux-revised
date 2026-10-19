// src/pages/Operacional/Reproducao/EstacaoDeMonta/index.tsx
// -----------------------------------------------------------------------------
// Tela de LISTAGEM (grid) de ESTAÇÃO DE MONTA — Operacional / Reprodução
// (item de menu já existente, `ope-pec-rep`).
//
// Rota: /operacional/reproducao (guardada por `breeding-seasons_view`,
// registrada em src/router/index.tsx — este arquivo não mexe em rota/menu).
//
// Estrutura mirror `Administrativo/Faltas/index.tsx` (grid paginado REAL de
// servidor via `useEstacoesDeMontaList` + `FilterSideEstacaoDeMonta` com
// re-hidratação, `useRequest` para exclusão, `onError` GENÉRICO — 422 de
// negócio (FK filha) exibido tal como vem do servidor, mirror
// `GAP-EM-03`/armadilha 4 da Tarefa 12).
//
// Colunas (contrato de tela §4.2): Código/Data Cadastro/Data Inicial/Data
// Final/Responsável/Descrição/Ações. Sem coluna de ordenação clicável (API
// não expõe `sort`) e sem `days`/`weeks` (só existem no Resource de detalhe).
// -----------------------------------------------------------------------------

import { useMemo, useState } from 'react';

import type { ElementType } from 'react';

import { Box, Flex, Icon, Text, useDisclosure, VStack } from '@chakra-ui/react';
import { createColumnHelper } from '@tanstack/react-table';
import { FiEye, FiEdit, FiHeart, FiTrash2 } from 'react-icons/fi';
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

import { deleteBreedingSeason } from '@/services/v2/BreedingSeasons/breeding-season-service';

import type { BreedingSeasonFilterForm, BreedingSeasonListItem } from '@/@types/v2/BreedingSeasons';

import { FilterSideEstacaoDeMonta } from './FilterSideEstacaoDeMonta';
import { useEstacoesDeMontaList } from './useEstacoesDeMonta';

const ESTACAO_DE_MONTA_STORAGE_KEY =
  'OperacionalReproducaoEstacaoDeMonta' + queryKey.breedingSeasons.breedingSeasonsList;
const ESTACAO_DE_MONTA_LIST_ROUTE = '/operacional/reproducao';

export default function EstacaoDeMontaList() {
  const { languageGB } = useLanguage();
  const navigate = useNavigate();
  const { can } = usePermissions();
  const text = languageGB.breedingSeasons.breedingSeason;

  const canView = can('breeding-seasons_view');
  const canEdit = can('breeding-seasons_edit');
  const canCreate = can('breeding-seasons_create');
  const canDelete = can('breeding-seasons_delete');

  const defaultQueryOptions = useMemo(
    () => ({
      pageSize: 10,
      storageKey: ESTACAO_DE_MONTA_STORAGE_KEY,
    }),
    []
  );

  const { paginatedQuery, handlePaginatedQuery, handleFilterChange, handleResetFilter } =
    userPaginatedQuery<BreedingSeasonFilterForm>(defaultQueryOptions);

  // ---- Estado de filtro (drawer) ------------------------------------------
  const { open: isFilterOpen, onOpen: onOpenFilter, onClose: onCloseFilter } = useDisclosure();

  const filtersApplied = useMemo(
    () =>
      Object.values(paginatedQuery.filter ?? {}).filter(
        (v) => v !== undefined && v !== null && v !== ''
      ).length,
    [paginatedQuery.filter]
  );

  const estacoesDeMontaList = useEstacoesDeMontaList({
    paginatedQuery,
    setPaginatedQuery: handlePaginatedQuery,
    filter: paginatedQuery.filter ?? undefined,
  });

  // ---- Estado de exclusão --------------------------------------------------
  const [toDelete, setToDelete] = useState<BreedingSeasonListItem | null>(null);
  const {
    open: isOpenDeleteDialog,
    onOpen: onOpenDeleteDialog,
    onClose: onCloseDeleteDialog,
  } = useDisclosure();

  // `onError` NÃO customizado — usa o tratamento genérico interno do
  // `useRequest`, que já lê `errors`/`message` do envelope 422 e exibe a
  // mensagem do servidor tal como vem (armadilha 4 da Tarefa 12,
  // `GAP-EM-03`: FK filha vira 422 de negócio, nunca uma mensagem genérica
  // fabricada aqui).
  const deleteMutation = useRequest({
    asyncFunction: async ({ breedingSeasonUuid }: { breedingSeasonUuid: string }) => {
      return await deleteBreedingSeason(breedingSeasonUuid);
    },
    queryKey: queryKey.breedingSeasons.breedingSeasonsList,
    queryKey2: queryKey.breedingSeasons.breedingSeason,
    typesRequest: 'update',
    entityName: text.singularLabel,
    personalizedMessage: text.list.deletedToast,
    actionSuccess: () => {
      onCloseDeleteDialog();
      setToDelete(null);
    },
  });

  const isDeleting = deleteMutation.isPending;

  function handleDeleteClick(item: BreedingSeasonListItem) {
    setToDelete(item);
    onOpenDeleteDialog();
  }

  function handleConfirmDelete() {
    if (toDelete) {
      deleteMutation.mutate({ breedingSeasonUuid: toDelete.uuid });
    }
  }

  const columnHelper = createColumnHelper<BreedingSeasonListItem>();
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
      columnHelper.accessor('start_date', {
        header: text.list.table.startDate,
        cell: ({ row }) => (
          <Text fontSize="sm" color="fg.muted">
            {formatDate(row.original.start_date)}
          </Text>
        ),
        meta: styleColumTable.date,
      }),
      columnHelper.accessor('end_date', {
        header: text.list.table.endDate,
        cell: ({ row }) => (
          <Text fontSize="sm" color="fg.muted">
            {formatDate(row.original.end_date)}
          </Text>
        ),
        meta: styleColumTable.date,
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
                  onClick={() => navigate(`${ESTACAO_DE_MONTA_LIST_ROUTE}/${row.original.uuid}`)}
                >
                  {text.list.actions.view}
                </Actions.Item>
              )}
              {canEdit && (
                <Actions.Item
                  icon={<Icon as={FiEdit} />}
                  onClick={() =>
                    navigate(`${ESTACAO_DE_MONTA_LIST_ROUTE}/${row.original.uuid}/editar`)
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

  const isLoading = checkLoadingStatus([estacoesDeMontaList]);
  const items = estacoesDeMontaList.data?.data?.items;
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
                  onClick={() => navigate(`${ESTACAO_DE_MONTA_LIST_ROUTE}/nova`)}
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
            isError={estacoesDeMontaList.isError}
            error={estacoesDeMontaList.error}
            isEmpty={isEmpty}
            onRetry={() => estacoesDeMontaList.refetch()}
            isRetrying={estacoesDeMontaList.isFetching}
            emptyIcon={FiHeart as ElementType}
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
            onCreate={() => navigate(`${ESTACAO_DE_MONTA_LIST_ROUTE}/nova`)}
          />
        </Box>
      </TableProvider>

      <FilterSideEstacaoDeMonta
        isOpen={isFilterOpen}
        onClose={onCloseFilter}
        handleFilterChange={handleFilterChange}
        handleReset={handleResetFilter}
        filter={paginatedQuery.filter}
        languageGB={languageGB}
      />

      {/* Componente genérico compõe "{description} {itemName}?" — a copy
          exata do contrato ("<code> será excluída permanentemente...") não
          cabe nessa ordem fixa; usamos `title`+`itemName` (mirror
          `Faltas/index.tsx`) para não forçar um patch local no componente
          (Lei 2). */}
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
