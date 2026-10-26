// src/pages/BaseRegistrations/TaxRules/index.tsx
// -----------------------------------------------------------------------------
// Tela de LISTAGEM (grid flat, sem hierarquia) de REGRAS FISCAIS — Cadastros
// Base. Rota: /cadastros-base/regras-fiscais (guardada por `tax-rules_view`,
// registrada em src/router/index.tsx antes do catch-all /cadastros-base/*,
// TASK-FE-114).
//
// Estrutura idêntica a CadastrosBase/Vacinas/index.tsx (grid paginado +
// HeaderTable + FilterSide + delete via useRequest + DeleteConfirmDialog).
// `GET /tax-rules` pagina de verdade (meta real, default 10) — a tela consome
// `items`/`pagination` direto da resposta, sem filtragem em memória.
//
// Colunas: Nome | Status | Ações (mirror do legado, Doc Bruta §4 — só listava
// `name`). Sem flags `can_edit`/`can_delete` por item no `TaxRuleResource` —
// autorização das ações de linha é 100% por permissão GLOBAL
// (`tax-rules_edit`/`tax-rules_delete`).
//
// Exclusão FÍSICA, sem guarda de FK (`nullOnDelete()` físico confirmado no
// contrato de API §2.2) — `DeleteConfirmDialog` com aviso de definitividade
// simples, nenhum tratamento especial de 422 "em uso".
// -----------------------------------------------------------------------------

import { useMemo, useState, type ElementType } from 'react';

import { Badge, Box, Flex, Icon, Text, useDisclosure } from '@chakra-ui/react';
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

import { deleteTaxRule, listTaxRules } from '@/services/v2/TaxRules/tax-rule-service';

import type { TaxRuleFilterForm, TaxRuleListItem } from '@/@types/v2/TaxRules';

import { FilterSideTaxRules } from './FilterSideTaxRules';
import { HeaderTable } from './HeaderTable';

import { PageHeader } from '@/components/ui/PageHeader';

// Chave de storage desta tela. Paginação (`userPaginatedQuery`) e
// personalização de grid (`useGridSettings`) derivam da MESMA expressão para
// nunca divergirem — nada de literal cru repetido (DEC-007 §12).
const TAX_RULES_STORAGE_KEY = 'CadastrosBaseRegrasFiscais' + queryKey.taxRules.list;

export default function TaxRulesList() {
  const { languageGB } = useLanguage();
  const navigate = useNavigate();
  const { can } = usePermissions();
  const text = languageGB.taxRules.taxRule;

  const canCreate = can('tax-rules_create');
  const canEdit = can('tax-rules_edit');
  const canDelete = can('tax-rules_delete');

  const defaultQueryOptions = useMemo(
    () => ({
      pageSize: 10,
      storageKey: TAX_RULES_STORAGE_KEY,
    }),
    []
  );

  const { paginatedQuery, handlePaginatedQuery, handleFilterChange, handleResetFilter } =
    userPaginatedQuery<TaxRuleFilterForm>(defaultQueryOptions);

  // ---- Estado de filtro (drawer) ------------------------------------------
  const { open: isFilterOpen, onOpen: onOpenFilter, onClose: onCloseFilter } = useDisclosure();

  const filtersApplied = useMemo(
    () =>
      Object.entries(paginatedQuery.filter ?? {})
        .map(([, v]) => v)
        .filter((v) => v !== undefined && v !== null && v !== '' && v !== false).length,
    [paginatedQuery.filter]
  );

  // ---- Estado de exclusão --------------------------------------------------
  const [toDelete, setToDelete] = useState<TaxRuleListItem | null>(null);
  const {
    open: isOpenDeleteDialog,
    onOpen: onOpenDeleteDialog,
    onClose: onCloseDeleteDialog,
  } = useDisclosure();

  const taxRulesList = useCustomGridQuery<TaxRuleListItem, TaxRuleFilterForm>({
    asyncFunction: listTaxRules,
    queryKey: queryKey.taxRules.list,
    paginatedQuery,
    setPaginatedQuery: handlePaginatedQuery,
    filterQuery: [],
    filter: paginatedQuery.filter ?? ({} as TaxRuleFilterForm),
  });

  const deleteMutation = useRequest({
    asyncFunction: async ({ taxRuleUuid }: { taxRuleUuid: string }) => {
      return await deleteTaxRule(taxRuleUuid);
    },
    queryKey: queryKey.taxRules.list,
    queryKey2: queryKey.taxRules.detail,
    // `useRequest`'s TypesRequest não tem variante "delete" — "update" é a
    // opção compilável usada pelo mesmo motivo em Vacinas/CondicoesPagamento
    // (o texto exibido vem de `personalizedMessage`, o rótulo genérico
    // associado a "update" nunca aparece ao usuário).
    typesRequest: 'update',
    entityName: text.singularLabel,
    personalizedMessage: text.list.deleteConfirm.title,
    actionSuccess: () => {
      onCloseDeleteDialog();
      setToDelete(null);
    },
  });

  const handleDeleteClick = (taxRule: TaxRuleListItem) => {
    setToDelete(taxRule);
    onOpenDeleteDialog();
  };

  const handleConfirmDelete = () => {
    if (toDelete) {
      deleteMutation.mutate({ taxRuleUuid: toDelete.uuid });
    }
  };

  const isDeleting = deleteMutation.isPending;

  const items = taxRulesList.data?.data?.items ?? [];

  const columnHelper = createColumnHelper<TaxRuleListItem>();
  const defaultColumns = useMemo(
    () => [
      columnHelper.accessor('name', {
        header: text.list.columns.name,
        enableHiding: false,
        meta: { gridLabel: text.list.columns.name },
        cell: ({ row }) => (
          <Text fontWeight="medium" lineClamp="1">
            {row.original.name}
          </Text>
        ),
      }),
      columnHelper.accessor('is_enabled', {
        header: text.list.columns.status,
        cell: ({ row }) => (
          <Badge
            colorPalette={row.original.is_enabled ? 'green' : 'gray'}
            variant="subtle"
            py={1}
            px={3}
          >
            {row.original.is_enabled ? text.list.statusActive : text.list.statusInactive}
          </Badge>
        ),
        meta: { ...styleColumTable.sm, gridLabel: text.list.columns.status },
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
                  onClick={() => navigate(`/cadastros-base/regras-fiscais/${row.original.uuid}`)}
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
    [navigate, isDeleting, text, canEdit, canDelete, languageGB.defaltStrings.actions]
  );

  const gridSettings = useGridSettings<TaxRuleListItem>({
    storageKey: TAX_RULES_STORAGE_KEY,
    storageScope: useGridStorageScope(),
    columns: defaultColumns,
  });
  const { columnOrder, setColumnOrder, columnVisibility, setColumnVisibility } = gridSettings;

  const isLoading = checkLoadingStatus([taxRulesList]);
  const isEmpty = !isLoading && items.length === 0;

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
          <PageHeader title={text.list.pageTitle} description={text.list.pageSubtitle} />
        </HeaderGrid>

        <Box mt={6}>
          <Table
            isLoading={isLoading}
            isError={taxRulesList.isError}
            error={taxRulesList.error}
            isEmpty={isEmpty}
            onRetry={() => taxRulesList.refetch()}
            isRetrying={taxRulesList.isFetching}
            emptyIcon={FiFileText as ElementType}
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
            onCreate={() => navigate('/cadastros-base/regras-fiscais/novo')}
          />
        </Box>
      </TableProvider>

      <FilterSideTaxRules
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
