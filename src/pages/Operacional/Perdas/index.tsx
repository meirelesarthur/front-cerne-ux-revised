// src/pages/Operacional/Perdas/index.tsx
// -----------------------------------------------------------------------------
// Tela de LISTAGEM/FILTRO de PERDAS (LossAnimal) — Operacional / Pecuária.
// Feature F-043, execução 040 (TASK-FE-2773). Rota `/operacional/perdas`
// (guardada por `loss_animals_view`, registrada em `src/router/index.tsx`).
//
// Sibling estrutural PRIMÁRIO (contrato de tela §7.2): `src/pages/
// CadastrosBase/CausaMortePerda/index.tsx` (mesma casca — `CausaMortePerda`
// NÃO tem filtro, então o `FilterSide` aqui é composição NOVA seguindo o
// Contrato B do catálogo, mirror `FilterSideWeaning`/`FilterSideLoteReproducao`).
//
// Colunas (LST-002..007 do legado): Código, Animal (`animal.identification`),
// Causa (`cause.description`), Data, Ações (dropdown Visualizar/Editar/
// Excluir). Exclusão DEFINITIVA (sem soft delete) — `DeleteConfirmDialog` com
// `warningText` explícito.
// -----------------------------------------------------------------------------

import { useMemo, useState, type ElementType } from 'react';

import { Box, Flex, Icon, Text, useDisclosure } from '@chakra-ui/react';
import { createColumnHelper } from '@tanstack/react-table';
import { FiAlertTriangle, FiEdit, FiEye, FiTrash2 } from 'react-icons/fi';
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
import formatDate from '@/utils/formatDate';
import { styleColumTable } from '@/utils/style-colum-table';

import { queryKey } from '@/constants/query-key';

import { deleteLossAnimal } from '@/services/v2/Operacional/Pecuaria/lossAnimal-service';

import type {
  LossAnimalData,
  LossAnimalFilterForm,
  LossAnimalFilterRequest,
} from '@/@types/v2/Operacional/Pecuaria/lossAnimal';

import { FilterSideLossAnimal } from './FilterSideLossAnimal';
import { HeaderTable } from './HeaderTable';
import { useLossAnimalsList } from './useLossAnimals';

import { PageHeader } from '@/components/ui/PageHeader';

export default function LossAnimalList() {
  const { languageGB } = useLanguage();
  const navigate = useNavigate();
  const { can } = usePermissions();
  const text = languageGB.lossAnimals.lossAnimal;

  const canCreate = can('loss_animals_create');
  const canEdit = can('loss_animals_edit');
  const canDelete = can('loss_animals_delete');

  const defaultQueryOptions = useMemo(
    () => ({
      pageSize: 10,
      storageKey: 'OperacionalPerdas' + queryKey.lossAnimals.lossAnimals,
    }),
    []
  );

  const { paginatedQuery, handlePaginatedQuery, handleFilterChange, handleResetFilter } =
    userPaginatedQuery<LossAnimalFilterForm>(defaultQueryOptions);

  const { open: isFilterOpen, onOpen: onOpenFilter, onClose: onCloseFilter } = useDisclosure();

  // `*_label` companions são display-only de re-hidratação do `Select`/
  // `SelectAsyncPaginate` — nunca contam como filtro aplicado.
  const filtersApplied = useMemo(
    () =>
      Object.entries(paginatedQuery.filter ?? {})
        .filter(([key]) => !key.endsWith('_label'))
        .filter(([, v]) => v !== undefined && v !== null && v !== '').length,
    [paginatedQuery.filter]
  );

  const lossAnimalsFilter: LossAnimalFilterRequest = {
    animal_uuid: paginatedQuery.filter?.animal_uuid?.value,
    cause_uuid: paginatedQuery.filter?.cause_uuid?.value,
    start_date: paginatedQuery.filter?.start_date ?? undefined,
    end_date: paginatedQuery.filter?.end_date ?? undefined,
  };

  const lossAnimalsList = useLossAnimalsList({
    paginatedQuery,
    setPaginatedQuery: handlePaginatedQuery,
    filter: lossAnimalsFilter,
  });

  // ---- Estado de exclusão --------------------------------------------------
  const [toDelete, setToDelete] = useState<LossAnimalData | null>(null);
  const {
    open: isOpenDeleteDialog,
    onOpen: onOpenDeleteDialog,
    onClose: onCloseDeleteDialog,
  } = useDisclosure();

  // `useRequest` — `typesRequest` só aceita `'create'|'update'` — delete usa
  // 'update' internamente (quirk real do hook, mirror `CausaMortePerda`).
  const deleteMutation = useRequest({
    asyncFunction: async ({ lossAnimalUuid }: { lossAnimalUuid: string }) => {
      return await deleteLossAnimal(lossAnimalUuid);
    },
    queryKey: queryKey.lossAnimals.lossAnimals,
    queryKey2: queryKey.lossAnimals.lossAnimal,
    typesRequest: 'update',
    entityName: text.singularLabel,
    personalizedMessage: text.list.deletedToast,
    actionSuccess: () => {
      onCloseDeleteDialog();
      setToDelete(null);
    },
  });

  const isDeleting = deleteMutation.isPending;

  function handleDeleteClick(item: LossAnimalData) {
    setToDelete(item);
    onOpenDeleteDialog();
  }

  function handleConfirmDelete() {
    if (toDelete) {
      deleteMutation.mutate({ lossAnimalUuid: toDelete.uuid });
    }
  }

  const columnHelper = createColumnHelper<LossAnimalData>();
  const defaultColumns = useMemo(
    () => [
      columnHelper.accessor('code', {
        header: text.list.table.code,
        cell: ({ row }) => <Text fontWeight="medium">{row.original.code}</Text>,
        meta: styleColumTable.sm,
      }),
      columnHelper.display({
        id: 'animal',
        header: text.list.table.animal,
        cell: ({ row }) => (
          <Text fontWeight="medium" lineClamp="1">
            {row.original.animal?.identification ?? '-'}
          </Text>
        ),
      }),
      // FID-G5 (execução 040) — legado exibe `animal->category->description`.
      // Optional chaining + fallback '—' — a API expõe `category` aninhado
      // em trabalho paralelo; sem dado inventado.
      columnHelper.display({
        id: 'category',
        header: text.list.table.category,
        cell: ({ row }) => (
          <Text fontSize="sm" color="fg.muted" lineClamp="1">
            {row.original.animal?.category?.description ?? '—'}
          </Text>
        ),
      }),
      columnHelper.display({
        id: 'cause',
        header: text.list.table.cause,
        cell: ({ row }) => (
          <Text fontSize="sm" color="fg.muted" lineClamp="1">
            {row.original.cause.description}
          </Text>
        ),
      }),
      columnHelper.accessor('date', {
        header: text.list.table.date,
        cell: ({ row }) => <Text fontSize="sm">{formatDate(row.original.date)}</Text>,
        meta: styleColumTable.date,
      }),
      columnHelper.display({
        id: 'acoes',
        header: '',
        enableHiding: false,
        enableSorting: false,
        cell: ({ row }) => (
          <Flex justify="flex-end">
            <Actions size="sm">
              <Actions.Item
                icon={<Icon as={FiEye} />}
                onClick={() => navigate(`/operacional/perdas/${row.original.uuid}`)}
              >
                {text.list.actions.view}
              </Actions.Item>
              {canEdit && (
                <Actions.Item
                  icon={<Icon as={FiEdit} />}
                  onClick={() => navigate(`/operacional/perdas/${row.original.uuid}/editar`)}
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

  const isLoading = checkLoadingStatus([lossAnimalsList]);
  const items = lossAnimalsList.data?.data?.items;
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
            <HeaderTable
              canCreate={canCreate}
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
            isError={lossAnimalsList.isError}
            error={lossAnimalsList.error}
            isEmpty={isEmpty}
            onRetry={() => lossAnimalsList.refetch()}
            isRetrying={lossAnimalsList.isFetching}
            retryLabel={languageGB.defaltStrings.tryAgain}
            emptyIcon={FiAlertTriangle as ElementType}
            emptyTitle={
              canCreate ? text.list.emptyState.titleEmpty : text.list.emptyState.titleEmptyNoCreate
            }
            emptyDescription={
              canCreate
                ? text.list.emptyState.descriptionEmpty
                : text.list.emptyState.descriptionEmptyNoCreate
            }
            canCreate={canCreate}
            createLabel={text.list.emptyState.cta}
            onCreate={() => navigate('/operacional/perdas/nova')}
          />
        </Box>
      </TableProvider>

      <FilterSideLossAnimal
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
        itemName={toDelete?.code}
      />
    </ContainerGrid>
  );
}
