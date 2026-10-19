// src/pages/CadastrosBase/Produtos/Classes/index.tsx
// -----------------------------------------------------------------------------
// Tela de LISTAGEM (grid flat, sem hierarquia) de CLASSES DE PRODUTO (Kind) —
// Cadastros Base / Estrutura, execução 024. Rota:
// /cadastros-base/produtos/classes (guardada por `kinds_view`, a
// permissão REAL do backend confirmada contra o banco — TASK-FE-916 corrigiu
// o nome fantasma `product_kinds_view` que GAP-FE-123 havia tratado como
// real —, wiring de rota real em TASK-FE-463).
//
// Sem referência UX dedicada no `cerne` (UX-GAP, Kind-Frontend-Contrato.md
// §2) — segue o padrão single-page consolidado de catálogos simples do
// próprio fork (GruposProduto/Racas: grid paginado + HeaderTable + FilterSide
// + delete via useRequest + DeleteConfirmDialog), NÃO o wizard de
// ProdutoForm.tsx.
//
// Sem flags `can_edit`/`can_delete` por item no `KindResource` — autorização
// das ações de linha é 100% por permissão GLOBAL (`kinds_edit`/
// `kinds_delete` — nome real; `product_kinds_*` era fantasma, TASK-FE-916).
// -----------------------------------------------------------------------------

import { ElementType, useMemo, useState } from 'react';

import { Badge, Box, Flex, Icon, Text, useDisclosure, VStack } from '@chakra-ui/react';
import { createColumnHelper } from '@tanstack/react-table';
import { FiEdit, FiLayers, FiTrash2 } from 'react-icons/fi';
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

import { deleteKind } from '@/services/v2/Kinds/kind-service';

import type { KindFilterForm, KindListItem } from '@/@types/v2/Kinds';

import { FilterSideClasses } from './FilterSideClasses';
import { HeaderTable } from './HeaderTable';
import { useKindsList } from './useKinds';

export default function ClassesList() {
  const { languageGB } = useLanguage();
  const navigate = useNavigate();
  const { can } = usePermissions();
  const text = languageGB.kinds.kind;

  // Permissões REAIS do backend (kinds_*, confirmadas contra o banco em
  // TASK-FE-916 — `product_kinds_*` era nome fantasma).
  const canCreate = can('kinds_create');
  const canEdit = can('kinds_edit');
  const canDelete = can('kinds_delete');

  const defaultQueryOptions = useMemo(
    () => ({
      pageSize: 10,
      storageKey: 'CadastrosBaseProdutosClasses' + queryKey.kinds.list,
    }),
    []
  );

  const { paginatedQuery, handlePaginatedQuery, handleFilterChange, handleResetFilter } =
    userPaginatedQuery<KindFilterForm>(defaultQueryOptions);

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
  const [toDelete, setToDelete] = useState<KindListItem | null>(null);
  const {
    open: isOpenDeleteDialog,
    onOpen: onOpenDeleteDialog,
    onClose: onCloseDeleteDialog,
  } = useDisclosure();

  const kindsList = useKindsList({
    paginatedQuery,
    setPaginatedQuery: handlePaginatedQuery,
    filter: paginatedQuery.filter ?? undefined,
  });

  const deleteMutation = useRequest({
    asyncFunction: async ({ kindUuid }: { kindUuid: string }) => {
      return await deleteKind(kindUuid);
    },
    queryKey: queryKey.kinds.list,
    queryKey2: queryKey.kinds.detail,
    // `useRequest`'s TypesRequest não tem variante "delete" — "update" é a
    // opção compilável usada pelo mesmo motivo em Racas/GruposProduto (o
    // texto exibido vem de `personalizedMessage`). O `onError` GLOBAL deste
    // hook já exibe a mensagem de negócio real (422 de FK em uso — Classe
    // vinculada a produtos).
    typesRequest: 'update',
    entityName: text.singularLabel,
    personalizedMessage: text.list.deletedToast,
    actionSuccess: () => {
      onCloseDeleteDialog();
      setToDelete(null);
    },
  });

  const handleDeleteClick = (kind: KindListItem) => {
    setToDelete(kind);
    onOpenDeleteDialog();
  };

  const handleConfirmDelete = () => {
    if (toDelete) {
      deleteMutation.mutate({ kindUuid: toDelete.uuid });
    }
  };

  const isDeleting = deleteMutation.isPending;

  const items = kindsList.data?.data?.items ?? [];

  const columnHelper = createColumnHelper<KindListItem>();
  const defaultColumns = useMemo(
    () => [
      columnHelper.accessor('name', {
        header: text.list.table.name,
        cell: ({ row }) => (
          <Text fontWeight="medium" lineClamp="1">
            {row.original.name}
          </Text>
        ),
      }),
      columnHelper.accessor((row) => row.category?.description ?? '', {
        id: 'category',
        header: text.list.table.category,
        cell: ({ row }) =>
          row.original.category ? (
            <Text fontSize="sm" color="fg.muted" lineClamp="1">
              {row.original.category.description}
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
                  onClick={() => navigate(`/cadastros-base/produtos/classes/${row.original.uuid}`)}
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

  const isLoading = checkLoadingStatus([kindsList]);
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
            isError={kindsList.isError}
            error={kindsList.error}
            isEmpty={isEmpty}
            onRetry={() => kindsList.refetch()}
            isRetrying={kindsList.isFetching}
            emptyIcon={FiLayers as ElementType}
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
            onCreate={() => navigate('/cadastros-base/produtos/classes/novo')}
          />
        </Box>
      </TableProvider>

      <FilterSideClasses
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
        itemName={toDelete?.name}
        warningText={text.list.deleteConfirm.warning}
      />
    </ContainerGrid>
  );
}
