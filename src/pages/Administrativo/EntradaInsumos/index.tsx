// src/pages/Administrativo/EntradaInsumos/index.tsx
// -----------------------------------------------------------------------------
// Tela de LISTAGEM (grid) de Entrada de Insumos — esteira 037,
// TASK-IE-FE-05. Mirror estrutural de `Invoices/index.tsx`
// (`useCustomGridQuery` sem ID de contexto, `userPaginatedQuery`,
// `DeleteConfirmDialog`, `EmptyState` com CTA condicional). Colunas: código,
// data, fazenda, proprietário, responsável, valor total, ações (Ver →
// `/administrativo/entrada-insumos/:uuid/detalhe`; Editar →
// `/administrativo/entrada-insumos/:uuid`; Excluir).
// `items` NUNCA aparece aqui — ausente na listagem (Lei 8 do roteiro).
//
// Correção AD F-084 (Execução 063) — "Ver" e "Editar" deixaram de ser a
// MESMA ação/rota (antes as duas apontavam para `CreateOrUpdateEntradaInsumos`
// direto, sem tela de leitura própria). Mirror `Produtos/Catalogo/index.tsx`
// (ícones Ver/Editar separados, `canEdit` já existia declarado aqui mas
// nunca tinha sido usado em nenhum botão).
//
// F-084 (RODADA FINAL, item 1) — ícones inline substituídos pelo menu kebab
// (3 pontinhos) compartilhado `Actions`/`Actions.Item` (`@/components/Action`),
// MESMO componente que `Produtos/Catalogo/index.tsx` já usa — Ver/Editar/
// Excluir (nessa ordem), gated pelas mesmas permissões.
// -----------------------------------------------------------------------------

import { ElementType, useMemo, useState } from 'react';

import { Box, Flex, Icon, Text, useDisclosure, VStack } from '@chakra-ui/react';
import { createColumnHelper } from '@tanstack/react-table';
import { FiEdit, FiEye, FiPackage, FiTrash2 } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';

import { Actions } from '@/components/Action';
import { ButtonAdd } from '@/components/ButtonAdd';
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

import { deleteInputEntry, listInputEntries } from '@/services/v2/InputEntries/input-entry-service';

import type { InputEntryFilterForm, InputEntryListItem } from '@/@types/v2/InputEntries';

import { FilterSideEntradaInsumos } from './FilterSideEntradaInsumos';

export default function EntradaInsumosList() {
  const { languageGB } = useLanguage();
  const navigate = useNavigate();
  const { can } = usePermissions();
  const text = languageGB.inputEntries.inputEntry;

  const canCreate = can('input_entries_create');
  const canEdit = can('input_entries_edit');
  const canDelete = can('input_entries_delete');
  const canView = can('input_entries_view');

  const defaultQueryOptions = useMemo(
    () => ({
      pageSize: 10,
      storageKey: 'EntradaInsumos' + queryKey.inputEntries.inputEntries,
    }),
    []
  );

  const { paginatedQuery, handlePaginatedQuery, handleFilterChange, handleResetFilter } =
    userPaginatedQuery<InputEntryFilterForm>(defaultQueryOptions);

  const { open: isFilterOpen, onOpen: onOpenFilter, onClose: onCloseFilter } = useDisclosure();

  const filtersApplied = useMemo(
    () =>
      Object.entries(paginatedQuery.filter ?? {}).filter(
        ([, v]) => v !== undefined && v !== null && v !== ''
      ).length,
    [paginatedQuery.filter]
  );

  const [toDelete, setToDelete] = useState<InputEntryListItem | null>(null);
  const {
    open: isOpenDeleteDialog,
    onOpen: onOpenDeleteDialog,
    onClose: onCloseDeleteDialog,
  } = useDisclosure();

  const inputEntriesList = useCustomGridQuery<InputEntryListItem, InputEntryFilterForm>({
    asyncFunction: listInputEntries,
    queryKey: queryKey.inputEntries.inputEntries,
    paginatedQuery,
    setPaginatedQuery: handlePaginatedQuery,
    filterQuery: [],
    filter: paginatedQuery.filter ?? ({} as InputEntryFilterForm),
  });

  const deleteMutation = useRequest({
    asyncFunction: async ({ inputEntryUuid }: { inputEntryUuid: string }) => {
      return await deleteInputEntry(inputEntryUuid);
    },
    queryKey: queryKey.inputEntries.inputEntries,
    queryKey2: queryKey.inputEntries.inputEntry,
    typesRequest: 'update',
    entityName: text.singularLabel,
    personalizedMessage: text.list.deletedToast,
    actionSuccess: () => {
      onCloseDeleteDialog();
      setToDelete(null);
    },
  });

  const isDeleting = deleteMutation.isPending;

  function handleDeleteClick(inputEntry: InputEntryListItem) {
    setToDelete(inputEntry);
    onOpenDeleteDialog();
  }

  function handleConfirmDelete() {
    if (toDelete) {
      deleteMutation.mutate({ inputEntryUuid: toDelete.uuid });
    }
  }

  const columnHelper = createColumnHelper<InputEntryListItem>();
  const defaultColumns = useMemo(
    () => [
      columnHelper.accessor('code', {
        header: text.list.table.code,
        cell: ({ row }) => (
          <Text fontFamily="mono" fontSize="sm">
            {row.original.code}
          </Text>
        ),
        meta: styleColumTable.sm,
      }),
      columnHelper.accessor('date', {
        header: text.list.table.date,
        cell: ({ row }) => <Text fontSize="sm">{formatDate(row.original.date)}</Text>,
        meta: styleColumTable.sm,
      }),
      columnHelper.accessor('farm', {
        header: text.list.table.farm,
        cell: ({ row }) => <Text lineClamp="1">{row.original.farm?.description ?? '—'}</Text>,
      }),
      columnHelper.accessor('proprietary', {
        header: text.list.table.proprietary,
        cell: ({ row }) => <Text lineClamp="1">{row.original.proprietary?.name ?? '—'}</Text>,
      }),
      columnHelper.accessor('user', {
        header: text.list.table.user,
        cell: ({ row }) => <Text lineClamp="1">{row.original.user?.name ?? '—'}</Text>,
      }),
      columnHelper.accessor('total_amount', {
        header: text.list.table.totalAmount,
        cell: ({ row }) => (
          <Text fontSize="sm">
            {row.original.total_amount.toLocaleString('pt-BR', {
              style: 'currency',
              currency: 'BRL',
            })}
          </Text>
        ),
        meta: styleColumTable.sm,
      }),
      // F-084 (RODADA FINAL, item 1) — kebab (3 pontinhos) compartilhado, NÃO
      // ícones inline. Mirror EXATO do componente reusado por
      // `Produtos/Catalogo/index.tsx` (`Actions`/`Actions.Item`,
      // `src/components/Action.tsx:217-220` — `Menu.Root`/`BiDotsVerticalRounded`,
      // Chakra v3), com as 3 ações (Ver/Editar/Excluir, nessa ordem) mirror
      // `Administrativo/Devolucao/index.tsx:319-364` (mesmo padrão de
      // Excluir com `tone="danger"`).
      columnHelper.display({
        id: 'acoes',
        header: '',
        cell: ({ row }) => (
          <Flex justify="flex-end">
            <Actions size="sm">
              {canView && (
                <Actions.Item
                  icon={<Icon as={FiEye} />}
                  onClick={() =>
                    navigate(`/administrativo/entrada-insumos/${row.original.uuid}/detalhe`)
                  }
                >
                  {text.list.actions.view}
                </Actions.Item>
              )}
              {canEdit && (
                <Actions.Item
                  icon={<Icon as={FiEdit} />}
                  onClick={() => navigate(`/administrativo/entrada-insumos/${row.original.uuid}`)}
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
        meta: styleColumTable.sm,
      }),
    ],
    [navigate, isDeleting, text, canView, canEdit, canDelete]
  );

  const isLoading = checkLoadingStatus([inputEntriesList]);
  const items = inputEntriesList.data?.data?.items;
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
            <Flex gap={2} align="center">
              {canCreate && (
                <ButtonAdd
                  onClick={() => navigate('/administrativo/entrada-insumos/novo')}
                  languageGB={languageGB}
                />
              )}
              <ButtonFilter filtersApplied={filtersApplied} onClick={onOpenFilter} />
            </Flex>
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
            isError={inputEntriesList.isError}
            error={inputEntriesList.error}
            isEmpty={isEmpty}
            onRetry={() => inputEntriesList.refetch()}
            isRetrying={inputEntriesList.isFetching}
            emptyIcon={FiPackage as ElementType}
            emptyTitle={
              filtersApplied > 0
                ? text.list.emptyState.titleFiltered
                : text.list.emptyState.titleEmpty
            }
            emptyDescription={
              filtersApplied > 0
                ? text.list.emptyState.descriptionFiltered
                : text.list.emptyState.descriptionEmpty
            }
            canCreate={filtersApplied === 0 && canCreate}
            createLabel={text.list.emptyState.cta}
            onCreate={() => navigate('/administrativo/entrada-insumos/novo')}
          />
        </Box>
      </TableProvider>

      <FilterSideEntradaInsumos
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
        itemName={toDelete?.code}
      />
    </ContainerGrid>
  );
}
