// src/pages/BaseRegistrations/TypeTitles/index.tsx
// -----------------------------------------------------------------------------
// Tela de LISTAGEM (grid FLAT — sem hierarquia) de TIPOS DE TÍTULO
// (TypeTitle) — Cadastros Base / Financeiros.
// Rota: /cadastros-base/tipos-titulo (guardada por `typetitles_view`,
// registrada em src/router/index.tsx — este arquivo não mexe em rota/menu).
//
// Padrão modular BaseRegistrations (referência: DiagnosisPregnancy) — grid via
// `useCustomGridQuery` inline (paginação REAL server-side, sem hook wrapper
// intermediário); HeaderTable → botões de ação (Add respeita
// typetitles_create); FilterSideTypeTitles → drawer (search/is_enabled/type)
// com re-hidratação ao reabrir; delete via useRequest + DeleteConfirmDialog
// (respeita typetitles_delete; onError GENÉRICO do useRequest já exibe a
// `message` real do 422 "Tipo de título está em uso e não pode ser excluído."
// vinda do backend — sem precisar decodificar `errors.in_use[]`).
//
// Colunas `type_label`/`factor_label` vêm PRONTAS do TypeTitleResource — não
// recriar o mapeamento Pagar/Receber/Ambas ou Soma/Diminui no client.
// -----------------------------------------------------------------------------

import { useMemo, useState, type ElementType } from 'react';

import { Badge, Box, Flex, Icon, Text, useDisclosure, VStack } from '@chakra-ui/react';
import { createColumnHelper } from '@tanstack/react-table';
import { FiEdit, FiFileText, FiTrash2 } from 'react-icons/fi';
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

import {
  deleteTypeTitle,
  listTypeTitles,
} from '@/services/v2/BaseRegistrations/typeTitles-service';

import type {
  TypeTitleFilterForm,
  TypeTitleListItem,
} from '@/@types/v2/BaseRegistrations/typeTitles';

import { FilterSideTypeTitles } from './FilterSideTypeTitles';
import { HeaderTable } from './HeaderTable';

// Chave de storage da personalização de grid desta tela. Estável e
// independente do idioma (só IDs de coluna são persistidos).
const TYPE_TITLES_GRID_STORAGE_KEY = 'GBCerneBaseRegistrationsTypeTitles';

export default function TypeTitlesList() {
  const { languageGB } = useLanguage();
  const navigate = useNavigate();
  const { can } = usePermissions();
  const text = languageGB.baseRegistrations.typeTitle;

  const canCreate = can('typetitles_create');
  const canEdit = can('typetitles_edit');
  const canDelete = can('typetitles_delete');

  const defaultQueryOptions = useMemo(
    () => ({
      pageSize: 10,
      storageKey: languageGB.baseRegistrations.titleModule + queryKey.baseRegistrations.typeTitles,
    }),
    []
  );

  const { paginatedQuery, handlePaginatedQuery, handleFilterChange, handleResetFilter } =
    userPaginatedQuery<TypeTitleFilterForm>(defaultQueryOptions);

  // ---- Estado de filtro (drawer) ------------------------------------------
  const { open: isFilterOpen, onOpen: onOpenFilter, onClose: onCloseFilter } = useDisclosure();

  // Sem campo companion/display-only nesta tela (nenhum Select assíncrono) —
  // conta só os filtros reais aplicados (search/is_enabled/type).
  const filtersApplied = useMemo(
    () =>
      Object.values(paginatedQuery.filter ?? {}).filter(
        (v) => v !== undefined && v !== null && v !== ''
      ).length,
    [paginatedQuery.filter]
  );

  // ---- Estado de exclusão --------------------------------------------------
  const [toDelete, setToDelete] = useState<TypeTitleListItem | null>(null);
  const {
    open: isOpenDeleteDialog,
    onOpen: onOpenDeleteDialog,
    onClose: onCloseDeleteDialog,
  } = useDisclosure();

  const typeTitlesList = useCustomGridQuery<TypeTitleListItem, TypeTitleFilterForm>({
    asyncFunction: listTypeTitles,
    queryKey: queryKey.baseRegistrations.typeTitles,
    paginatedQuery,
    setPaginatedQuery: handlePaginatedQuery,
    filterQuery: [],
    filter: paginatedQuery.filter ?? ({} as TypeTitleFilterForm),
  });

  const deleteMutation = useRequest({
    asyncFunction: async ({ typeTitleUuid }: { typeTitleUuid: string }) => {
      return await deleteTypeTitle(typeTitleUuid);
    },
    queryKey: queryKey.baseRegistrations.typeTitles,
    queryKey2: queryKey.baseRegistrations.typeTitle,
    // `useRequest`'s TypesRequest não tem variante "delete" — "update" é a
    // mesma convenção usada por CategoryMatrix/LowReason/Espécies para a
    // mesma operação. O texto exibido no toast vem de `personalizedMessage`,
    // então o rótulo genérico associado a "update" nunca aparece ao usuário.
    //
    // onError: NÃO customizado — usa o tratamento genérico interno do
    // useRequest (lê `message`/`error` do envelope). A API JÁ devolve 422
    // estruturado (BusinessRuleException) com a mensagem de negócio real
    // "Tipo de título está em uso e não pode ser excluído." quando há vínculo
    // FK real (expenses/incomes/transfers) — nenhum tratamento especial de
    // código é necessário.
    typesRequest: 'update',
    entityName: text.singularLabel,
    personalizedMessage: text.list.deletedToast,
    actionSuccess: () => {
      onCloseDeleteDialog();
      setToDelete(null);
    },
  });

  const handleDeleteClick = (typeTitle: TypeTitleListItem) => {
    setToDelete(typeTitle);
    onOpenDeleteDialog();
  };

  const handleConfirmDelete = () => {
    if (toDelete) {
      deleteMutation.mutate({ typeTitleUuid: toDelete.uuid });
    }
  };

  const isDeleting = deleteMutation.isPending;

  const columnHelper = createColumnHelper<TypeTitleListItem>();
  const defaultColumns = useMemo(
    () => [
      columnHelper.accessor('description', {
        header: text.list.table.description,
        cell: ({ row }) => (
          <Text fontWeight="medium" lineClamp="1">
            {row.original.description}
          </Text>
        ),
        meta: { gridLabel: text.list.table.description },
      }),
      // `type_label` vem PRONTO do TypeTitleResource — não recriar o
      // mapeamento Pagar/Receber/Ambas no client.
      columnHelper.accessor('type_label', {
        header: text.list.table.type,
        cell: ({ row }) => (
          <Text fontWeight="medium" lineClamp="1">
            {row.original.type_label}
          </Text>
        ),
        meta: { ...styleColumTable.sm, gridLabel: text.list.table.type },
      }),
      // `factor_label` vem PRONTO do TypeTitleResource — não recriar o
      // mapeamento Soma/Diminui no client.
      columnHelper.accessor('factor_label', {
        header: text.list.table.factor,
        cell: ({ row }) => (
          <Text fontWeight="medium" lineClamp="1">
            {row.original.factor_label}
          </Text>
        ),
        meta: { ...styleColumTable.sm, gridLabel: text.list.table.factor },
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
        cell: ({ row }) => (
          <Flex justify="flex-end">
            <Actions size="sm">
              {canEdit && (
                <Actions.Item
                  icon={<Icon as={FiEdit} />}
                  onClick={() => navigate(`/cadastros-base/tipos-titulo/${row.original.uuid}`)}
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
        meta: {
          ...styleColumTable.sm,
          gridLabel: languageGB.defaltStrings.actions,
          gridOrder: 'fixed-end',
          gridDataColumn: false,
        },
      }),
    ],
    [navigate, isDeleting, languageGB.defaltStrings.actions, text, canEdit, canDelete]
  );

  const gridSettings = useGridSettings<TypeTitleListItem>({
    storageKey: TYPE_TITLES_GRID_STORAGE_KEY,
    storageScope: useGridStorageScope(),
    columns: defaultColumns,
  });
  const { columnOrder, setColumnOrder, columnVisibility, setColumnVisibility } = gridSettings;

  const isLoading = checkLoadingStatus([typeTitlesList]);
  const items = typeTitlesList.data?.data?.items;
  const isEmpty = !isLoading && (items?.length ?? 0) === 0;

  return (
    <ContainerGrid>
      <TableProvider
        data={items}
        columns={defaultColumns}
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
            isError={typeTitlesList.isError}
            error={typeTitlesList.error}
            isEmpty={isEmpty}
            onRetry={() => typeTitlesList.refetch()}
            isRetrying={typeTitlesList.isFetching}
            emptyIcon={FiFileText as ElementType}
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
            onCreate={() => navigate('/cadastros-base/tipos-titulo/novo')}
          />
        </Box>
      </TableProvider>

      <FilterSideTypeTitles
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
        itemName={toDelete?.description}
      />
    </ContainerGrid>
  );
}
