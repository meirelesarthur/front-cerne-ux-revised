// src/pages/CadastrosBase/Categorias/index.tsx
// -----------------------------------------------------------------------------
// Tela de LISTAGEM de Categorias Financeiras (FinancialCategory) — Cadastros
// Base / Financeiro. Rota: /cadastros-base/categorias (guardada por
// `financialcategories_view` — roteamento real em TASK-FE-313). TASK-FE-311.
//
// TASK-FE-340 (REFAZ a TASK-FE-339, achado G reprovado pelo dev) — a tela
// tinha DOIS MODOS (árvore com toggle expandir/colapsar por padrão + grid
// achatado só quando havia filtro). O dev reprovou o rodapé de paginação que
// a TASK-FE-339 apenas ACRESCENTOU à árvore: ele quer a MESMA listagem, no
// MESMO ESTILO do Centro de Custo (`CentroCusto/index.tsx`) — uma lista
// PLANA de TODOS os nós (sintético + analítico), indentada por nível,
// SEM chevron/expandir-colapsar, com o rodapé de paginação padrão do
// projeto (`Table`/`TableProvider`, 5/10/25/50/100, default 10).
//
// Por isso este arquivo passou a ter UM SÓ MODO — igual ao CC: SEMPRE
// `GET /financial-categories` paginado no backend (`useFinancialCategoriesList`),
// SEMPRE `TableProvider`/`Table` padrão, com ou sem filtro do drawer
// (search/is_enabled/classification, contrato §6.1) — o filtro só estreita o
// resultado do MESMO endpoint, nunca troca de fonte de dados. Indentação por
// nível replica EXATAMENTE `CentroCusto/index.tsx` (`pl={row.original.parent
// ? 4 : 0}`): aqui o equivalente é `parent_uuid` (a árvore desta API só
// alcança profundidade 2 — grupo global — e 3 — folha do tenant, GAP-FE-100,
// ou seja, sempre 2 níveis reais, igual ao CC).
//
// REMOVIDO nesta tarefa (superado pela TASK-FE-340):
//   - `FinancialCategoryTreeView` (árvore com toggle expandir/colapsar) e o
//     arquivo inteiro `FinancialCategoryTreeView.tsx` (sem outro consumidor).
//   - `FinancialCategoryPaginationBar`/windowing client-side dos nós-RAIZ
//     introduzidos pela TASK-FE-339 (o rodapé agora é o padrão do `Table`,
//     paginado no BACKEND via `useFinancialCategoriesList`, sem windowing).
//   - `useFinancialCategoryTree` (`GET /financial-categories/tree`) DEIXOU de
//     ser consumido POR ESTA TELA — o hook em si NÃO foi tocado (`useFinancialCategories.tsx`),
//     porque `CategoryTreeSelector.tsx` (multiselect de Categoria↔Centro de
//     Custo, TASK-FE-316/317) continua usando o MESMO endpoint/hook para o
//     seletor em árvore do formulário — fora de escopo desta tarefa.
//
// Exclusão: `useRequest` genérico — o `onError` dele já exibe a `message` do
// 422 de FK (guarda estruturada desde TASK-BE-340/commit `8203b8815`, GAP-FE-101
// resolvido no backend). Invalida `list`+`detail` (a listagem) e também a
// `tree` key — não porque esta tela a exiba, mas porque `CategoryTreeSelector`
// (consumidor cross-page do mesmo cache) precisa ver a exclusão refletida.
// -----------------------------------------------------------------------------

import { useMemo, useState } from 'react';

import { Badge, Box, Flex, HStack, Icon, Text, useDisclosure } from '@chakra-ui/react';
import { useQueryClient } from '@tanstack/react-query';
import { createColumnHelper } from '@tanstack/react-table';
import type { ElementType } from 'react';
import { FiEdit, FiFolder, FiGitBranch, FiPlus, FiTrash2 } from 'react-icons/fi';
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

import { deleteFinancialCategory } from '@/services/v2/FinancialCategories/financial-category-service';

import type {
  FinancialCategoryFilterForm,
  FinancialCategoryListItem,
} from '@/@types/v2/FinancialCategories';

import { FilterSideCategorias } from './FilterSideCategorias';
import { HeaderTable } from './HeaderTable';
import { useFinancialCategoriesList } from './useFinancialCategories';

import { PageHeader } from '@/components/ui/PageHeader';

export default function CategoriasFinanceirasList() {
  const { languageGB } = useLanguage();
  const navigate = useNavigate();
  const { can } = usePermissions();
  const queryClient = useQueryClient();
  const text = languageGB.financialCategories.financialCategory;

  const canCreate = can('financialcategories_create');

  const defaultQueryOptions = useMemo(
    () => ({
      pageSize: 10,
      storageKey: 'CadastrosBaseCategorias' + queryKey.financialCategories.list,
    }),
    []
  );

  const { paginatedQuery, handlePaginatedQuery, handleFilterChange, handleResetFilter } =
    userPaginatedQuery<FinancialCategoryFilterForm>(defaultQueryOptions);

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
  const [toDelete, setToDelete] = useState<{ uuid: string; description: string } | null>(null);
  const {
    open: isOpenDeleteDialog,
    onOpen: onOpenDeleteDialog,
    onClose: onCloseDeleteDialog,
  } = useDisclosure();

  // Único modo de listagem — lista PLANA paginada no backend (mesmo padrão
  // de `useCostCentersList`), com ou sem filtro do drawer.
  const financialCategoriesList = useFinancialCategoriesList({
    paginatedQuery,
    setPaginatedQuery: handlePaginatedQuery,
    filter: paginatedQuery.filter ?? undefined,
  });

  const deleteMutation = useRequest({
    asyncFunction: async ({ uuid }: { uuid: string }) => deleteFinancialCategory(uuid),
    queryKey: queryKey.financialCategories.list,
    queryKey2: queryKey.financialCategories.detail,
    // `useRequest` não tem variante "delete" — mesmo precedente de
    // Agrupadores/CostCenters (o rótulo genérico de "update" nunca aparece:
    // `personalizedMessage` sempre substitui).
    typesRequest: 'update',
    entityName: text.singularLabel,
    personalizedMessage: text.list.deletedToast,
    actionSuccess: () => {
      // Esta tela não exibe mais a árvore, mas `CategoryTreeSelector.tsx`
      // (multiselect de Categoria↔Centro de Custo, TASK-FE-316/317) consome
      // o MESMO cache de `GET /financial-categories/tree` — invalida para
      // essa exclusão refletir lá também.
      queryClient.invalidateQueries({ queryKey: [queryKey.financialCategories.tree] });
      onCloseDeleteDialog();
      setToDelete(null);
    },
  });

  const isDeleting = deleteMutation.isPending;

  function handleEdit(node: { uuid: string }) {
    navigate(`/cadastros-base/categorias/${node.uuid}`);
  }

  function handleCreateChild(node: { uuid: string }) {
    navigate(`/cadastros-base/categorias/novo?parentUuid=${node.uuid}`);
  }

  function handleDeleteClick(node: { uuid: string; description: string }) {
    setToDelete({ uuid: node.uuid, description: node.description });
    onOpenDeleteDialog();
  }

  function handleConfirmDelete() {
    if (toDelete) {
      deleteMutation.mutate({ uuid: toDelete.uuid });
    }
  }

  const isLoading = checkLoadingStatus([financialCategoriesList]);
  const isError = financialCategoriesList.isError;
  const items = financialCategoriesList.data?.data?.items ?? [];
  const isEmpty = !isLoading && !isError && items.length === 0;

  // ---- Colunas da listagem plana --------------------------------------------
  const columnHelper = createColumnHelper<FinancialCategoryListItem>();
  const columns = useMemo(
    () => [
      columnHelper.accessor('code', {
        header: text.list.table.code,
        cell: ({ row }) => (
          <Text fontFamily="mono" fontSize="sm" color="fg.muted" lineClamp="1">
            {row.original.code}
          </Text>
        ),
        meta: styleColumTable.sm,
      }),
      columnHelper.accessor('description', {
        header: text.list.table.description,
        // Indentação por nível espelhando `CentroCusto/index.tsx` — mesma
        // decisão `pl={row.original.parent ? 4 : 0}`, aqui via `parent_uuid`
        // (a API só alcança 2 níveis reais nesta listagem, GAP-FE-100).
        cell: ({ row }) => (
          <Flex align="center" gap={2} pl={row.original.parent_uuid ? 4 : 0}>
            <Icon as={FiFolder} color="blue.400" boxSize={4} flexShrink={0} />
            <Text fontWeight="medium" lineClamp="1">
              {row.original.description}
            </Text>
          </Flex>
        ),
      }),
      columnHelper.display({
        id: 'typeGrouper',
        header: text.list.table.typeGrouper,
        cell: ({ row }) => (
          <HStack gap={1.5} wrap="wrap">
            {row.original.type && (
              <Badge colorPalette="blue" variant="subtle" py={1} px={2}>
                {row.original.type.description}
              </Badge>
            )}
            {row.original.grouper && (
              <Badge colorPalette="gray" variant="subtle" py={1} px={2}>
                {row.original.grouper.name}
              </Badge>
            )}
          </HStack>
        ),
      }),
      columnHelper.display({
        id: 'classification',
        header: text.list.table.classification,
        cell: ({ row }) => (
          <Badge colorPalette="purple" variant="subtle" py={1} px={2}>
            {row.original.classification_label ?? '—'}
          </Badge>
        ),
        meta: styleColumTable.sm,
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
        meta: styleColumTable.sm,
      }),
      columnHelper.display({
        id: 'acoes',
        header: '',
        cell: ({ row }) => {
          const item = row.original;
          const canShowCreateChild = canCreate && item.class === 1;

          return (
            <Flex justify="flex-end">
              <Actions size="sm" languageGB={languageGB}>
                {item.can_edit && (
                  <Actions.Item icon={<Icon as={FiEdit} />} onClick={() => handleEdit(item)}>
                    {text.list.actions.edit}
                  </Actions.Item>
                )}
                {canShowCreateChild && (
                  <Actions.Item icon={<Icon as={FiPlus} />} onClick={() => handleCreateChild(item)}>
                    {text.list.actions.addChild}
                  </Actions.Item>
                )}
                {item.can_delete && (
                  <Actions.Item
                    icon={<Icon as={FiTrash2} />}
                    onClick={() => handleDeleteClick(item)}
                    color="red.400"
                    disabled={isDeleting}
                  >
                    {text.list.actions.delete}
                  </Actions.Item>
                )}
              </Actions>
            </Flex>
          );
        },
        meta: styleColumTable.sm,
      }),
    ],
    [text, canCreate, isDeleting, languageGB]
  );

  return (
    <ContainerGrid>
      <TableProvider
        data={items}
        columns={columns}
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
            isError={isError}
            error={financialCategoriesList.error}
            isEmpty={isEmpty}
            onRetry={() => financialCategoriesList.refetch()}
            isRetrying={financialCategoriesList.isFetching}
            retryLabel={text.list.error.retry}
            emptyIcon={FiGitBranch as ElementType}
            emptyTitle={
              filtersApplied > 0 ? text.list.emptyState.titleFiltered : text.list.emptyState.titleEmpty
            }
            emptyDescription={
              filtersApplied > 0
                ? text.list.emptyState.descriptionFiltered
                : text.list.emptyState.descriptionEmpty
            }
            canCreate={false}
          />
        </Box>
      </TableProvider>

      <FilterSideCategorias
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
