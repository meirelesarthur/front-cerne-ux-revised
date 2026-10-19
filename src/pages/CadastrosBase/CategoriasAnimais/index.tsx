// src/pages/CadastrosBase/CategoriasAnimais/index.tsx
// -----------------------------------------------------------------------------
// Tela de LISTAGEM (grid flat, sem hierarquia) de CATEGORIAS ANIMAIS —
// Cadastros Base / Pecuários, execução 025. Rota:
// /cadastros-base/categorias-animais (guardada por `categoryanimals_view`,
// wiring de rota real em `TASK-FE-544` — CHOKEPOINT, fora do escopo desta
// Tarefa).
//
// Sem referência UX dedicada no `cerne` (UX-GAP, Contrato §2) — segue o
// molde PRIMÁRIO `CadastrosBase/Racas` (grid paginado + envelope-adapter +
// Select de Espécie assíncrono) combinado com o drawer de filtro
// `<Form formFilter>` de `Produtos/Classes`/`Fazendas` (decisão explícita do
// dev — NUNCA `<VStack as="form">`, que é como `Racas` implementa hoje).
//
// Sem flags `can_edit`/`can_delete` por item no `CategoryAnimalResource` —
// autorização das ações de linha é 100% por permissão GLOBAL
// (`categoryanimals_edit`/`_delete`, grafia REAL do backend confirmada
// contra o banco — TASK-BE-897/TASK-FE-916: `category_animals_*`, com
// underscore entre "category" e "animals", era nome FANTASMA que nunca
// existiu na tabela `permissions`).
//
// Exclusão DEFINITIVA (`CategoryAnimal` não usa SoftDeletes) — o
// `DeleteConfirmDialog` recebe copy própria (`warningText`) deixando isso
// explícito, mesma decisão de `Racas`/`Kind`.
// -----------------------------------------------------------------------------

import { useMemo, useState } from 'react';

import { Badge, Box, Flex, Icon, Text, useDisclosure, VStack } from '@chakra-ui/react';
import { createColumnHelper } from '@tanstack/react-table';
import type { ElementType } from 'react';
import { FiEdit, FiGrid, FiTrash2 } from 'react-icons/fi';
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

import { genderColor } from '@/constants/pecuaria/categoryAnimal/options/gender-options';
import { queryKey } from '@/constants/query-key';

import { deleteCategoryAnimal } from '@/services/v2/CategoryAnimals/category-animal-service';

import type { LanguageDate } from '@/@types/language';
import type { CategoryAnimalFilterForm, CategoryAnimalListItem } from '@/@types/v2/CategoryAnimals';

import { FilterSideCategoriasAnimais } from './FilterSideCategoriasAnimais';
import { HeaderTable } from './HeaderTable';
import { useCategoryAnimalsList } from './useCategoryAnimals';

// Formata a coluna "Faixa etária" — 3 casos (Contrato §3.4 / Risco #1 da
// Tarefa): ambos nulos ("—"), só um presente ("a partir de X meses"/"até Y
// meses"), ambos presentes ("de X a Y meses"). Função pura local, sem
// depender de lib de formatação nova.
function formatAgeRange(
  startMonth: number | null,
  endMonth: number | null,
  table: LanguageDate['categoryAnimals']['categoryAnimal']['list']['table']
): string {
  if (startMonth === null && endMonth === null) return table.ageRangeEmpty;
  if (startMonth !== null && endMonth !== null) {
    return table.ageRangeBetween
      .replace('{start}', String(startMonth))
      .replace('{end}', String(endMonth));
  }
  if (startMonth !== null) {
    return table.ageRangeFrom.replace('{months}', String(startMonth));
  }
  return table.ageRangeTo.replace('{months}', String(endMonth));
}

export default function CategoriasAnimaisList() {
  const { languageGB } = useLanguage();
  const navigate = useNavigate();
  const { can } = usePermissions();
  const text = languageGB.categoryAnimals.categoryAnimal;

  // Permissões REAIS do backend (categoryanimals_*, confirmadas contra o
  // banco em TASK-FE-916 — Contrato §3.3).
  const canCreate = can('categoryanimals_create');
  const canEdit = can('categoryanimals_edit');
  const canDelete = can('categoryanimals_delete');

  const defaultQueryOptions = useMemo(
    () => ({
      pageSize: 10,
      storageKey: 'CadastrosBaseCategoriasAnimais' + queryKey.categoryAnimals.categoryAnimalsList,
    }),
    []
  );

  const { paginatedQuery, handlePaginatedQuery, handleFilterChange, handleResetFilter } =
    userPaginatedQuery<CategoryAnimalFilterForm>(defaultQueryOptions);

  // ---- Estado de filtro (drawer) ------------------------------------------
  const { open: isFilterOpen, onOpen: onOpenFilter, onClose: onCloseFilter } = useDisclosure();

  const filtersApplied = useMemo(
    () =>
      Object.entries(paginatedQuery.filter ?? {})
        // Chaves `*_label` (ex.: `specie_label`) são DISPLAY-ONLY —
        // persistidas só para re-hidratar o label do SelectAsyncPaginate no
        // drawer, nunca enviadas à API — e não devem inflar o badge
        // "Filtros(N)" (mesma regra genérica de `Racas/index.tsx`).
        .filter(([key]) => !key.endsWith('_label'))
        .map(([, v]) => v)
        .filter((v) => v !== undefined && v !== null && v !== '' && v !== false).length,
    [paginatedQuery.filter]
  );

  // ---- Estado de exclusão --------------------------------------------------
  const [toDelete, setToDelete] = useState<CategoryAnimalListItem | null>(null);
  const {
    open: isOpenDeleteDialog,
    onOpen: onOpenDeleteDialog,
    onClose: onCloseDeleteDialog,
  } = useDisclosure();

  const categoryAnimalsList = useCategoryAnimalsList({
    paginatedQuery,
    setPaginatedQuery: handlePaginatedQuery,
    filter: paginatedQuery.filter ?? undefined,
  });

  const deleteMutation = useRequest({
    asyncFunction: async ({ categoryAnimalUuid }: { categoryAnimalUuid: string }) => {
      return await deleteCategoryAnimal(categoryAnimalUuid);
    },
    queryKey: queryKey.categoryAnimals.categoryAnimalsList,
    queryKey2: queryKey.categoryAnimals.categoryAnimal,
    // `useRequest`'s TypesRequest não tem variante "delete" — "update" é a
    // opção compilável usada pelo mesmo motivo em Racas/Classes (o texto
    // exibido vem de `personalizedMessage`). Sem guarda de FK estruturada
    // confirmada no backend (`GAP-BE-253`) — o `onError` GLOBAL deste hook
    // já exibe a `message` do envelope (provável 500 cru).
    typesRequest: 'update',
    entityName: text.singularLabel,
    personalizedMessage: text.list.deletedToast,
    actionSuccess: () => {
      onCloseDeleteDialog();
      setToDelete(null);
    },
  });

  const handleDeleteClick = (categoryAnimal: CategoryAnimalListItem) => {
    setToDelete(categoryAnimal);
    onOpenDeleteDialog();
  };

  const handleConfirmDelete = () => {
    if (toDelete) {
      deleteMutation.mutate({ categoryAnimalUuid: toDelete.uuid });
    }
  };

  const isDeleting = deleteMutation.isPending;

  const items = categoryAnimalsList.data?.data?.items ?? [];

  const columnHelper = createColumnHelper<CategoryAnimalListItem>();
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
              {text.list.table.specieEmpty}
            </Text>
          ),
        meta: styleColumTable.md,
      }),
      columnHelper.accessor('gender', {
        header: text.list.table.gender,
        cell: ({ row }) => (
          <Badge colorPalette={genderColor[row.original.gender]} variant="subtle" py={1} px={3}>
            {row.original.gender_label}
          </Badge>
        ),
        meta: styleColumTable.sm,
      }),
      columnHelper.display({
        id: 'ageRange',
        header: text.list.table.ageRange,
        cell: ({ row }) => (
          <Text fontSize="sm" color="fg.muted">
            {formatAgeRange(row.original.start_month, row.original.end_month, text.list.table)}
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
                  onClick={() =>
                    navigate(`/cadastros-base/categorias-animais/${row.original.uuid}`)
                  }
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

  const isLoading = checkLoadingStatus([categoryAnimalsList]);
  const isError = categoryAnimalsList.isError;
  const isEmpty = !isLoading && !isError && items.length === 0;

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
            isError={isError}
            error={categoryAnimalsList.error}
            isEmpty={isEmpty}
            onRetry={() => categoryAnimalsList.refetch()}
            isRetrying={categoryAnimalsList.isFetching}
            emptyIcon={FiGrid as ElementType}
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
            onCreate={() => navigate('/cadastros-base/categorias-animais/novo')}
          />
        </Box>
      </TableProvider>

      <FilterSideCategoriasAnimais
        isOpen={isFilterOpen}
        onClose={onCloseFilter}
        handleFilterChange={(applied) => handleFilterChange(applied)}
        handleReset={() => handleResetFilter()}
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
