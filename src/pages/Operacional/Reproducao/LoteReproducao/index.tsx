// src/pages/Operacional/Reproducao/LoteReproducao/index.tsx
// -----------------------------------------------------------------------------
// Tela de LISTAGEM (grid) de LOTES/REPRODUÇÃO — Operacional / Reprodução
// (item de menu novo, `ope-pec-rep`, registrado na Tarefa 07).
//
// Rota: /operacional/lotes-reproducao (guardada por `breeding-batch_view`,
// registrada em src/router/index.tsx — este arquivo não mexe em rota/menu,
// contrato de tela §2).
//
// Estrutura mirror DIRETO de `EstacaoDeMonta/index.tsx` (mesmo submódulo,
// mesmo padrão de grid/filtro/exclusão): `useCustomGridQuery` SEM ID de
// contexto (mirror `useEstacoesDeMontaList`) + `FilterSideLoteReproducao` com
// re-hidratação + `useRequest` para exclusão, `onError` GENÉRICO — 422 de
// negócio (lote com acasalamento vinculado, achado #4 do backend) exibido
// tal como vem do servidor (contrato de tela §4, roteiro §"Riscos").
//
// Colunas (contrato de tela §4, LM-01 a LM-05): Código/Data/Responsável/
// Descrição/Ações. Sem coluna de ordenação clicável (API ordena fixo por
// `code desc`, mirror `BullSeedSeason`) e sem `breeding_season`/`batches`
// (só existem no Resource de detalhe/formulário, Tarefas 06/07).
//
// GATE de permissão — `breeding-batch_view/create/edit/delete`, NUNCA
// `batch_*` (achado #2/CLM-03 do backend, contrato de tela §2 — corrigido,
// não herdado do Blade legado).
// -----------------------------------------------------------------------------

import { useMemo, useState } from 'react';

import type { ElementType } from 'react';

import { Box, Flex, Icon, Text, useDisclosure } from '@chakra-ui/react';
import { createColumnHelper } from '@tanstack/react-table';
import { FiEdit, FiEye, FiPackage, FiTrash2 } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';

import { Actions } from '@/components/Action';
import { Button } from '@/components/Button';
import { ButtonFilter } from '@/components/ButtonFilter';
import { ContainerGrid } from '@/components/ContainerGrid';
import { DeleteConfirmDialog } from '@/components/DeleteConfirmDialog';
import { HeaderGrid } from '@/components/HeaderGrid';
import { Table } from '@/components/Table';

import { TableProvider } from '@/contexts/TableContext';

import { useCustomGridQuery } from '@/hooks/useCustomGridQuery';
import { useLanguage } from '@/hooks/useLanguage';
import { userPaginatedQuery } from '@/hooks/usePaginatedQueryStorage';
import { usePermissions } from '@/hooks/usePermissions';
import { useRequest } from '@/hooks/useRequest';

import { checkLoadingStatus } from '@/utils/checkLoadingStatus';
import formatDate from '@/utils/formatDate';
import { styleColumTable } from '@/utils/style-colum-table';

import { queryKey } from '@/constants/query-key';

import {
  deleteBreedingBatch,
  listBreedingBatches,
} from '@/services/v2/BreedingBatch/breeding-batch-service';

import type { BreedingBatchFilterRequest, BreedingBatchListItem } from '@/@types/v2/BreedingBatch';

import { FilterSideLoteReproducao } from './FilterSideLoteReproducao';

import { PageHeader } from '@/components/ui/PageHeader';

const LOTE_REPRODUCAO_STORAGE_KEY =
  'OperacionalReproducaoLoteReproducao' + queryKey.breedingBatches.breedingBatchesList;
const LOTE_REPRODUCAO_LIST_ROUTE = '/operacional/lotes-reproducao';

export default function LoteReproducaoList() {
  const { languageGB } = useLanguage();
  const navigate = useNavigate();
  const { can } = usePermissions();
  const text = languageGB.breedingBatches.breedingBatch;

  const canView = can('breeding-batch_view');
  const canEdit = can('breeding-batch_edit');
  const canCreate = can('breeding-batch_create');
  const canDelete = can('breeding-batch_delete');

  const defaultQueryOptions = useMemo(
    () => ({
      pageSize: 10,
      storageKey: LOTE_REPRODUCAO_STORAGE_KEY,
    }),
    []
  );

  const { paginatedQuery, handlePaginatedQuery, handleFilterChange, handleResetFilter } =
    userPaginatedQuery<BreedingBatchFilterRequest>(defaultQueryOptions);

  // ---- Estado de filtro (drawer) ------------------------------------------
  const { open: isFilterOpen, onOpen: onOpenFilter, onClose: onCloseFilter } = useDisclosure();

  const filtersApplied = useMemo(
    () =>
      Object.values(paginatedQuery.filter ?? {}).filter(
        (v) => v !== undefined && v !== null && v !== ''
      ).length,
    [paginatedQuery.filter]
  );

  const lotesReproducaoList = useCustomGridQuery<BreedingBatchListItem, BreedingBatchFilterRequest>(
    {
      asyncFunction: listBreedingBatches,
      queryKey: queryKey.breedingBatches.breedingBatchesList,
      paginatedQuery,
      setPaginatedQuery: handlePaginatedQuery,
      filterQuery: [],
      filter: paginatedQuery.filter ?? ({} as BreedingBatchFilterRequest),
    }
  );

  // ---- Estado de exclusão --------------------------------------------------
  const [toDelete, setToDelete] = useState<BreedingBatchListItem | null>(null);
  const {
    open: isOpenDeleteDialog,
    onOpen: onOpenDeleteDialog,
    onClose: onCloseDeleteDialog,
  } = useDisclosure();

  // `onError` NÃO customizado — usa o tratamento genérico interno do
  // `useRequest`, que já lê `errors`/`message` do envelope 422 e exibe a
  // mensagem do servidor tal como vem (achado #4 do backend: lote com
  // acasalamento vinculado vira 422 de negócio, nunca uma mensagem genérica
  // fabricada aqui — roteiro §"Riscos").
  const deleteMutation = useRequest({
    asyncFunction: async ({ breedingBatchUuid }: { breedingBatchUuid: string }) => {
      return await deleteBreedingBatch(breedingBatchUuid);
    },
    queryKey: queryKey.breedingBatches.breedingBatchesList,
    queryKey2: queryKey.breedingBatches.breedingBatch,
    typesRequest: 'update',
    entityName: text.singularLabel,
    personalizedMessage: text.list.deletedToast,
    actionSuccess: () => {
      onCloseDeleteDialog();
      setToDelete(null);
    },
  });

  const isDeleting = deleteMutation.isPending;

  function handleDeleteClick(item: BreedingBatchListItem) {
    setToDelete(item);
    onOpenDeleteDialog();
  }

  function handleConfirmDelete() {
    if (toDelete) {
      deleteMutation.mutate({ breedingBatchUuid: toDelete.uuid });
    }
  }

  const columnHelper = createColumnHelper<BreedingBatchListItem>();
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
                  onClick={() => navigate(`${LOTE_REPRODUCAO_LIST_ROUTE}/${row.original.uuid}`)}
                >
                  {text.list.actions.view}
                </Actions.Item>
              )}
              {canEdit && (
                <Actions.Item
                  icon={<Icon as={FiEdit} />}
                  onClick={() =>
                    navigate(`${LOTE_REPRODUCAO_LIST_ROUTE}/${row.original.uuid}/editar`)
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

  const isLoading = checkLoadingStatus([lotesReproducaoList]);
  const items = lotesReproducaoList.data?.data?.items;
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
                  onClick={() => navigate(`${LOTE_REPRODUCAO_LIST_ROUTE}/nova`)}
                />
              )}
              <ButtonFilter filtersApplied={filtersApplied} onClick={onOpenFilter} />
            </>
          }
        >
          <PageHeader title={text.list.pageTitle} description={text.list.pageSubtitle} />
        </HeaderGrid>

        <Box mt={6}>
          <Table
            isLoading={isLoading}
            isError={lotesReproducaoList.isError}
            error={lotesReproducaoList.error}
            isEmpty={isEmpty}
            onRetry={() => lotesReproducaoList.refetch()}
            isRetrying={lotesReproducaoList.isFetching}
            emptyIcon={FiPackage as ElementType}
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
            onCreate={() => navigate(`${LOTE_REPRODUCAO_LIST_ROUTE}/nova`)}
          />
        </Box>
      </TableProvider>

      <FilterSideLoteReproducao
        isOpen={isFilterOpen}
        onClose={onCloseFilter}
        handleFilterChange={handleFilterChange}
        handleReset={handleResetFilter}
        filter={paginatedQuery.filter}
        languageGB={languageGB}
      />

      {/* Componente genérico compõe "{description} {itemName}?" — a copy
          exata do contrato ("<code> será excluído permanentemente...") não
          cabe nessa ordem fixa; usamos `title`+`itemName` (mirror
          `EstacaoDeMonta/index.tsx`/`Faltas/index.tsx`) para não forçar um
          patch local no componente (Lei 2). */}
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
