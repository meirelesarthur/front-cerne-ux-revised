// src/pages/BaseRegistrations/Groupers/index.tsx
// -----------------------------------------------------------------------------
// Tela de LISTAGEM de Agrupadores (Grouper) — Cadastros Base / Financeiro.
// Rota: /cadastros-base/agrupadores (guardada por `groupers_view` — roteamento
// real em TASK-FE-032, inalterado nesta Tarefa). TASK-FE-911 (Ajuste 1).
//
// TASK-FE-911 REESCREVE a tela (REFAZ TASK-FE-030/033) — o dev odiou a árvore
// com toggle expandir/colapsar + paginação SOB DEMANDA dentro de cada nó
// expandido. Agora é UM SÓ MODO, mirror exato de `CentroCusto/index.tsx` e do
// precedente `Categorias/index.tsx` (TASK-FE-340): lista PLANA de TODOS os
// nós (backend sempre achatado, TASK-BE-433), com paginação ÚNICA no topo via
// `TableProvider`/`Table` padrão do projeto (5/10/25/50/100, default 10).
//
// DIFERENÇA vs. os 2 precedentes (que só alcançam 2 níveis reais, GAP-FE-100,
// por isso usam indentação BINÁRIA `pl={row.original.parent ? 4 : 0}`):
// Agrupadores tem até 4 níveis reais (`depth` 0-3, `MAX_CREATE_DEPTH=3`) — a
// indentação da coluna "Nome" aqui é por PROFUNDIDADE REAL, reaproveitando a
// fórmula que vivia em `GrouperTreeNode` (`indent = 4 + depth * 6`), agora
// migrada para este arquivo junto com `MAX_CREATE_DEPTH`/`TYPE_BADGE_PALETTE`
// (o arquivo `GrouperTreeView.tsx` — árvore recursiva + `GrouperPaginationBar`
// + `GrouperChildrenBranch` — foi DELETADO; único consumidor confirmado por
// grep era este arquivo).
//
// Ações por linha preservadas com as MESMAS regras de antes: editar
// (`canEdit`); criar descendente (`canCreate && node.depth < MAX_CREATE_DEPTH`);
// excluir (`canDelete && node.children_count === 0`).
//
// Exclusão: `useRequest` genérico — o `onError` dele já exibe a `message` do
// 422 de FK (descendente com `FinancialCategory` vinculada). Invalida só
// `list`+`detail` (sem o predicate de invalidação por `groupers-children-*`
// do modo árvore antigo — não existe mais query de filhos sob demanda).
// -----------------------------------------------------------------------------

import { ElementType, useMemo, useState } from 'react';

import { Badge, Box, Flex, HStack, Icon, Text, useDisclosure, VStack } from '@chakra-ui/react';
import { createColumnHelper } from '@tanstack/react-table';
import { FiEdit, FiFolder, FiGitBranch, FiPlus, FiTrash2 } from 'react-icons/fi';
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

import { deleteGrouper, listGroupers } from '@/services/v2/Groupers/grouper-service';

import type { GrouperFilterForm, GrouperListItem, GrouperType } from '@/@types/v2/Groupers';

import { FilterSideGroupers } from './FilterSideGroupers';
import { HeaderTable } from './HeaderTable';

/** Limite de PROFUNDIDADE para exibir "Criar descendente" — replica a regra de
 *  UI do legado (Doc Bruta §4 "Limite de profundidade exibido na UI"): esconde
 *  o link além do 4º nível. `depth` é 0-based (raiz = 0), então só nós com
 *  depth < 3 podem gerar um filho (que nasce em depth+1 <= 3 → 4 níveis). O
 *  backend (D6, TASK-BE-051) é a guarda REAL (422 explícito); isto é só UX.
 *  Migrado de `GrouperTreeView.tsx` (deletado nesta Tarefa). */
export const MAX_CREATE_DEPTH = 3;

/** Cor do badge de `type` por enum (puramente visual, tokens Chakra — não
 *  recria o rótulo, que já vem pronto em `type_label` do Resource). Migrado
 *  de `GrouperTreeView.tsx` (deletado nesta Tarefa). */
export const TYPE_BADGE_PALETTE: Record<GrouperType, string> = {
  1: 'orange', // Custo
  2: 'green', // Receita
  3: 'purple', // Depreciação
  4: 'blue', // Financeiro
};

// Chave de storage desta tela. Paginação (`userPaginatedQuery`) e
// personalização de grid (`useGridSettings`) derivam da MESMA expressão para
// nunca divergirem (mesmo padrão de CentroCusto/index.tsx).
const GROUPERS_STORAGE_KEY = 'CadastrosBaseAgrupadores' + queryKey.groupers.list;

export default function GroupersList() {
  const { languageGB } = useLanguage();
  const navigate = useNavigate();
  const { can } = usePermissions();
  const text = languageGB.groupers.grouper;

  const canCreate = can('groupers_create');
  const canEdit = can('groupers_edit');
  const canDelete = can('groupers_delete');

  const defaultQueryOptions = useMemo(
    () => ({
      pageSize: 10,
      storageKey: GROUPERS_STORAGE_KEY,
    }),
    []
  );

  const { paginatedQuery, handlePaginatedQuery, handleFilterChange, handleResetFilter } =
    userPaginatedQuery<GrouperFilterForm>(defaultQueryOptions);

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
  const [toDelete, setToDelete] = useState<GrouperListItem | null>(null);
  const {
    open: isOpenDeleteDialog,
    onOpen: onOpenDeleteDialog,
    onClose: onCloseDeleteDialog,
  } = useDisclosure();

  // Único modo de listagem — lista PLANA paginada no backend (mirror
  // `useCostCentersList`/`useFinancialCategoriesList`), com ou sem filtro do
  // drawer.
  const groupersList = useCustomGridQuery<GrouperListItem, GrouperFilterForm>({
    asyncFunction: listGroupers,
    queryKey: queryKey.groupers.list,
    paginatedQuery,
    setPaginatedQuery: handlePaginatedQuery,
    filterQuery: [],
    filter: paginatedQuery.filter ?? ({} as GrouperFilterForm),
  });

  const deleteMutation = useRequest({
    asyncFunction: async ({ grouperUuid }: { grouperUuid: string }) => deleteGrouper(grouperUuid),
    queryKey: queryKey.groupers.list,
    queryKey2: queryKey.groupers.detail,
    // `useRequest` não tem variante "delete" — mesmo precedente de
    // CostCenters/Categorias/GruposProduto (o rótulo genérico de "update"
    // nunca aparece: `personalizedMessage` sempre substitui).
    typesRequest: 'update',
    entityName: text.singularLabel,
    personalizedMessage: text.list.deletedToast,
    actionSuccess: () => {
      onCloseDeleteDialog();
      setToDelete(null);
    },
  });

  const isDeleting = deleteMutation.isPending;

  function handleEdit(node: GrouperListItem) {
    navigate(`/cadastros-base/agrupadores/${node.uuid}`);
  }

  function handleCreateChild(node: GrouperListItem) {
    navigate(`/cadastros-base/agrupadores/novo?parentUuid=${node.uuid}`);
  }

  function handleDeleteClick(node: GrouperListItem) {
    setToDelete(node);
    onOpenDeleteDialog();
  }

  function handleConfirmDelete() {
    if (toDelete) {
      deleteMutation.mutate({ grouperUuid: toDelete.uuid });
    }
  }

  const isLoading = checkLoadingStatus([groupersList]);
  const isError = groupersList.isError;
  const items = groupersList.data?.data?.items ?? [];
  const isEmpty = !isLoading && !isError && items.length === 0;

  // ---- Colunas da listagem plana (indentada por `depth` real, 0-3) --------
  const columnHelper = createColumnHelper<GrouperListItem>();
  const columns = useMemo(
    () => [
      columnHelper.accessor('code', {
        header: text.list.table.code,
        cell: ({ row }) => (
          <Text fontFamily="mono" fontSize="sm" color="fg.muted" lineClamp="1">
            {row.original.code}
          </Text>
        ),
        meta: { ...styleColumTable.sm, gridLabel: text.list.table.code },
      }),
      columnHelper.accessor('name', {
        header: text.list.table.name,
        enableHiding: false,
        meta: { gridLabel: text.list.table.name },
        // Indentação MULTI-NÍVEL (não binária como CentroCusto/Categorias —
        // Grouper alcança até 4 níveis reais, GAP-FE-100 não se aplica aqui).
        // Fórmula preservada de `GrouperTreeNode` (GrouperTreeView.tsx,
        // deletado nesta Tarefa): `4 + depth * 6`.
        cell: ({ row }) => (
          <Flex align="center" gap={2} pl={4 + row.original.depth * 6}>
            <Icon as={FiFolder} color="blue.400" boxSize={4} flexShrink={0} />
            <Text fontWeight="medium" lineClamp="1">
              {row.original.name}
            </Text>
          </Flex>
        ),
      }),
      columnHelper.display({
        id: 'type',
        header: text.list.table.type,
        cell: ({ row }) => (
          <HStack gap={1.5} wrap="wrap">
            <Badge
              colorPalette={TYPE_BADGE_PALETTE[row.original.type]}
              variant="subtle"
              py={1}
              px={2}
            >
              {row.original.type_label}
            </Badge>
            <Badge colorPalette="gray" variant="subtle" py={1} px={2}>
              {row.original.condition_label}
            </Badge>
          </HStack>
        ),
        meta: { gridLabel: text.list.table.type },
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
        cell: ({ row }) => {
          const node = row.original;
          const canShowCreateChild = canCreate && node.depth < MAX_CREATE_DEPTH;
          const canShowDelete = canDelete && node.children_count === 0;

          return (
            <Flex justify="flex-end">
              <Actions size="sm" languageGB={languageGB}>
                {canEdit && (
                  <Actions.Item icon={<Icon as={FiEdit} />} onClick={() => handleEdit(node)}>
                    {text.list.actions.edit}
                  </Actions.Item>
                )}
                {canShowCreateChild && (
                  <Actions.Item icon={<Icon as={FiPlus} />} onClick={() => handleCreateChild(node)}>
                    {text.list.actions.addChild}
                  </Actions.Item>
                )}
                {canShowDelete && (
                  <Actions.Item
                    icon={<Icon as={FiTrash2} />}
                    onClick={() => handleDeleteClick(node)}
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
        meta: {
          ...styleColumTable.sm,
          gridLabel: languageGB.defaltStrings.actions,
          gridOrder: 'fixed-end',
          gridDataColumn: false,
        },
      }),
    ],
    [text, canEdit, canCreate, canDelete, isDeleting, languageGB]
  );

  const gridSettings = useGridSettings<GrouperListItem>({
    storageKey: GROUPERS_STORAGE_KEY,
    storageScope: useGridStorageScope(),
    columns,
  });
  const { columnOrder, setColumnOrder, columnVisibility, setColumnVisibility } = gridSettings;

  return (
    <ContainerGrid>
      <TableProvider
        data={items}
        columns={columns}
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
            isError={groupersList.isError}
            error={groupersList.error}
            isEmpty={isEmpty}
            onRetry={() => groupersList.refetch()}
            isRetrying={groupersList.isFetching}
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
            canCreate={filtersApplied === 0 && canCreate}
            createLabel={text.list.emptyState.cta}
            onCreate={() => navigate('/cadastros-base/agrupadores/novo')}
          />
        </Box>
      </TableProvider>

      <FilterSideGroupers
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
        itemName={toDelete?.name}
        warningText={text.list.deleteConfirm.warning}
      />
    </ContainerGrid>
  );
}
