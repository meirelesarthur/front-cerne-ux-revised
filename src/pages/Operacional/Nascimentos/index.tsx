// src/pages/Operacional/Nascimentos/index.tsx
// -----------------------------------------------------------------------------
// Tela de LISTAGEM (grid) de NASCIMENTOS — Operacional > Pecuária
// (TASK-NASC-FE-01, item de menu NOVO `ope-pec-nas` → `birth_animals_view`).
//
// Rota: /operacional/nascimentos (guardada por `birth_animals_view`,
// registrada em src/router/index.tsx).
//
// Referência UX (UX-GAP confirmado, `GAP-NASCIMENTOS-FE-01` — tela ausente no
// design system `cerne`, decisão do dono: mirror estrutural do módulo
// Romaneios para listagem/detalhe/gate):
//   GB.Cerne.UX @ 24bd91603a6ee4e19b58fa5efe2221835c83e306
//   Molde de código na SPA (sibling-first): src/pages/Operacional/Romaneios/index.tsx
//
// 7 colunas + ações (frontend-contract-nascimentos.md §5.1) — Código · Mãe ·
// ID Pai/Sêmen · Bezerro · Raça · Peso · Data · Ações. Ordenação fixa
// `orderBy code desc` já aplicada pelo servidor.
//
// Sem Zustand — fazenda ativa já vem do AuthContext via interceptor;
// paginação/filtro por `userPaginatedQuery`.
// -----------------------------------------------------------------------------

import { useMemo, useState, type ElementType } from 'react';

import { Box, Flex, Text, useDisclosure } from '@chakra-ui/react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createColumnHelper } from '@tanstack/react-table';
import { FiFileText } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';

import { ContainerGrid } from '@/components/ContainerGrid';
import { DeleteConfirmDialog } from '@/components/DeleteConfirmDialog';
import { HeaderGrid } from '@/components/HeaderGrid';
import { Table } from '@/components/Table';
import { toaster } from '@/components/ui/toaster';

import { TableProvider } from '@/contexts/TableContext';

import { useLanguage } from '@/hooks/useLanguage';
import { userPaginatedQuery } from '@/hooks/usePaginatedQueryStorage';
import { usePermissions } from '@/hooks/usePermissions';

import { checkLoadingStatus } from '@/utils/checkLoadingStatus';
import { extractApiErrorMessage } from '@/utils/extractApiErrorMessage';
import formatDate from '@/utils/formatDate';
import { styleColumTable } from '@/utils/style-colum-table';

import { queryKey } from '@/constants/query-key';

import { deleteBirthAnimal } from '@/services/v2/BirthAnimals/birth-animal-service';

import type { BirthAnimalFilterForm, BirthAnimalListItem } from '@/@types/v2/BirthAnimals';

import { BirthAnimalActionsMenu } from './BirthAnimalActionsMenu';
import { FilterSideNascimentos } from './FilterSideNascimentos';
import { HeaderTable } from './HeaderTable';
import { useBirthAnimalsList } from './useBirthAnimals';

import { PageHeader } from '@/components/ui/PageHeader';

const PAGE_SIZE_OPTIONS = [10, 30, 50, 100];

function formatCurrencyBRL(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export default function BirthAnimalsList() {
  const { languageGB } = useLanguage();
  const navigate = useNavigate();
  const { can } = usePermissions();
  const text = languageGB.birthAnimals.birthAnimal;

  const canView = can('birth_animals_view');
  const canEdit = can('birth_animals_edit');
  const canDelete = can('birth_animals_delete');

  const defaultQueryOptions = useMemo(
    () => ({
      pageSize: 10,
      storageKey: 'OperacionalNascimentos' + queryKey.birthAnimals.birthAnimalsList,
    }),
    []
  );

  const { paginatedQuery, handlePaginatedQuery, handleFilterChange, handleResetFilter } =
    userPaginatedQuery<BirthAnimalFilterForm & { breed_label?: string }>(defaultQueryOptions);

  const { open: isFilterOpen, onOpen: onOpenFilter, onClose: onCloseFilter } = useDisclosure();

  // `breed_label` é companion DISPLAY-ONLY de re-hidratação do
  // `SelectAsyncPaginate` — nunca conta como filtro aplicado (mesma regra de
  // `Operacional/Romaneios/index.tsx`).
  const filtersApplied = useMemo(
    () =>
      Object.entries(paginatedQuery.filter ?? {})
        .filter(([key]) => !key.endsWith('_label'))
        .filter(([, v]) => v !== undefined && v !== null && v !== '').length,
    [paginatedQuery.filter]
  );

  const birthAnimalsList = useBirthAnimalsList({
    paginatedQuery,
    setPaginatedQuery: handlePaginatedQuery,
    filter: paginatedQuery.filter ?? undefined,
  });

  // ---- Estado de exclusão --------------------------------------------------
  const queryClient = useQueryClient();
  const [toDelete, setToDelete] = useState<BirthAnimalListItem | null>(null);
  const {
    open: isOpenDeleteDialog,
    onOpen: onOpenDeleteDialog,
    onClose: onCloseDeleteDialog,
  } = useDisclosure();

  const deleteMutation = useMutation({
    mutationFn: async (uuid: string) => deleteBirthAnimal(uuid),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [queryKey.birthAnimals.birthAnimalsList] });

      toaster.success({
        title: text.singularLabel,
        description: text.list.deletedToast,
        duration: 7000,
      });

      onCloseDeleteDialog();
      setToDelete(null);
    },
    onError: (error) => {
      toaster.error({
        title: text.singularLabel,
        description: extractApiErrorMessage(error) ?? languageGB.common.errorLog.unknownError,
        duration: 7000,
      });
    },
  });

  const isDeleting = deleteMutation.isPending;

  function handleDeleteClick(item: BirthAnimalListItem) {
    setToDelete(item);
    onOpenDeleteDialog();
  }

  function handleConfirmDelete() {
    if (toDelete) {
      deleteMutation.mutate(toDelete.uuid);
    }
  }

  const columnHelper = createColumnHelper<BirthAnimalListItem>();
  const defaultColumns = useMemo(
    () => [
      columnHelper.accessor('code', {
        header: text.list.table.code,
        cell: ({ row }) => <Text fontWeight="medium">{row.original.code}</Text>,
        meta: styleColumTable.sm,
      }),
      columnHelper.display({
        id: 'mother',
        header: text.list.table.mother,
        cell: ({ row }) => <Text lineClamp="1">{row.original.mother?.identification ?? '-'}</Text>,
      }),
      columnHelper.accessor('father_text', {
        header: text.list.table.fatherText,
        cell: ({ row }) => (
          <Text fontSize="sm" lineClamp="1">
            {row.original.father_text || '-'}
          </Text>
        ),
        meta: styleColumTable.sm,
      }),
      columnHelper.display({
        id: 'newborn',
        header: text.list.table.newborn,
        cell: ({ row }) => <Text lineClamp="1">{row.original.newborn?.identification ?? '-'}</Text>,
      }),
      columnHelper.display({
        id: 'breed',
        header: text.list.table.breed,
        cell: ({ row }) => <Text fontSize="sm">{row.original.breed?.description ?? '-'}</Text>,
      }),
      columnHelper.accessor('weight', {
        header: text.list.table.weight,
        cell: ({ row }) => <Text fontSize="sm">{formatCurrencyBRL(row.original.weight)}</Text>,
        meta: styleColumTable.sm,
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
        cell: ({ row }) => {
          const item = row.original;
          return (
            <Flex justify="flex-end">
              <BirthAnimalActionsMenu
                canView={canView}
                canEdit={canEdit}
                canDelete={canDelete}
                hasWeaning={item.has_weaning}
                isDeleting={isDeleting}
                labels={{
                  view: text.list.actions.view,
                  edit: text.list.actions.edit,
                  delete: text.list.actions.delete,
                  editDisabledTooltip: text.list.actions.editDisabledTooltip,
                  deleteDisabledTooltip: text.list.actions.deleteDisabledTooltip,
                }}
                onView={() => navigate(`/operacional/nascimentos/${item.uuid}`)}
                onEdit={() => navigate(`/operacional/nascimentos/${item.uuid}/editar`)}
                onDelete={() => handleDeleteClick(item)}
              />
            </Flex>
          );
        },
        meta: styleColumTable.sm,
      }),
    ],
    [navigate, isDeleting, text, canView, canEdit, canDelete]
  );

  const isLoading = checkLoadingStatus([birthAnimalsList]);
  const items = birthAnimalsList.data?.data?.items;
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
            isError={birthAnimalsList.isError}
            error={birthAnimalsList.error}
            isEmpty={isEmpty}
            onRetry={() => birthAnimalsList.refetch()}
            isRetrying={birthAnimalsList.isFetching}
            retryLabel={text.list.error.retry}
            emptyIcon={FiFileText as ElementType}
            emptyTitle={
              filtersApplied > 0 ? text.list.emptyState.titleFiltered : text.list.emptyState.titleEmpty
            }
            emptyDescription={
              filtersApplied > 0
                ? text.list.emptyState.descriptionFiltered
                : text.list.emptyState.descriptionEmpty
            }
            canCreate={false}
            pageSizeOptions={PAGE_SIZE_OPTIONS}
          />
        </Box>
      </TableProvider>

      <FilterSideNascimentos
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
        title={text.deleteDialog.title}
        description={
          toDelete
            ? text.deleteDialog.descriptionTemplate.replace('{code}', String(toDelete.code))
            : undefined
        }
        hideQuestionMark
        tone="danger"
      />
    </ContainerGrid>
  );
}
