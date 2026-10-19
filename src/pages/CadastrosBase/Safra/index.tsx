// src/pages/CadastrosBase/Safra/index.tsx
// -----------------------------------------------------------------------------
// Tela de LISTAGEM (grid) de SAFRAS — Cadastros Base.
// Rota: /cadastros-base/safras (guardada por `harvests_view`,
// registrada em TASK-FE-011 — este arquivo não mexe em rota/menu).
//
// Estrutura idêntica a CadastrosBase/CentroCusto/index.tsx, COM UMA MUDANÇA
// DE COMPORTAMENTO DELIBERADA: o clique na linha (fora da coluna de ações)
// navega para o DETALHE (TASK-FE-010), não para a Edição — diferente de
// Centro de Custo, que não tem tela de Detalhe própria. Por isso a
// navegação-por-seleção-de-linha vive AQUI, no componente `RowClickToDetail`
// (renderizado dentro do `<TableProvider>`, único jeito de ler o contexto da
// tabela) — e NÃO em `HeaderTable.tsx` (que aqui só tem os botões de ação,
// ver nota lá).
//
// Fidelidade à Referência UX (GB.Cerne.UX/.../SafrasLista.tsx, commit
// 73b5fa86) COM adaptação ao contrato real: sem KPI bar (Total/Ativas/Safra
// Atual/Encerradas seriam agregados fabricados sobre 1 página só — GET
// /harvests pagina de verdade, per_page default 15, diferente do mock que
// calcula sobre o array completo em memória), sem filtro adicional além de
// search/is_enabled (HarvestFilterData não aceita mais nada) e sem o modal
// "Saiba Mais" (puramente decorativo, fora de escopo). Coluna "Semanas"
// MANTIDA (diferente do racional de CostCenters): o index já eager-carrega
// `weeks[]` completo (HarvestRepository::listWithFilters faz
// with(['weeks','periods'])), então `harvest.weeks.length` não custa
// requisição extra.
// -----------------------------------------------------------------------------

import { ElementType, useEffect, useMemo, useState } from 'react';

import { Badge, Box, Flex, Icon, Text, useDisclosure, VStack } from '@chakra-ui/react';
import { createColumnHelper } from '@tanstack/react-table';
import { FiCalendar, FiEdit, FiEye, FiTrash2 } from 'react-icons/fi';
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
import { useTable } from '@/hooks/useTable';

import { checkLoadingStatus } from '@/utils/checkLoadingStatus';
import formatDate from '@/utils/formatDate';
import { styleColumTable } from '@/utils/style-colum-table';

import { queryKey } from '@/constants/query-key';

import { deleteHarvest } from '@/services/v2/Harvests/harvest-service';

import type { Harvest, HarvestFilterForm } from '@/@types/v2/Harvests';

import { FilterSideSafra } from './FilterSideSafra';
import { HeaderTable } from './HeaderTable';
import { useHarvestsList } from './useHarvests';

// Observa a seleção de linha da grid — mesmo mecanismo de toggle usado por
// `Table.tsx` em todo o projeto: clique em qualquer célula fora da coluna de
// ações chama `row.getToggleSelectedHandler()` (Menu de Ações usa
// `stopPropagation`, então nunca dispara isso). Precisa estar DENTRO do
// `<TableProvider>` para ler `useTable()`. Vive aqui (não em
// `HeaderTable.tsx`) porque o destino é o Detalhe — decisão de TASK-FE-007.
function RowClickToDetail() {
  const navigate = useNavigate();
  const { table } = useTable();

  useEffect(() => {
    const selected = table?.getSelectedRowModel()?.rows[0]?.original as Harvest | undefined;
    if (selected?.uuid) {
      navigate(`/cadastros-base/safras/${selected.uuid}/detalhe`);
    }
  }, [table?.getSelectedRowModel()?.rows[0]?.original]);

  return null;
}

export default function SafraList() {
  const { languageGB } = useLanguage();
  const navigate = useNavigate();
  const { can } = usePermissions();
  const text = languageGB.harvests.harvest;

  const canCreate = can('harvests_create');
  const canEdit = can('harvests_edit');
  const canDelete = can('harvests_delete');

  const defaultQueryOptions = useMemo(
    () => ({
      pageSize: 10,
      storageKey: 'CadastrosBaseSafra' + queryKey.harvests.list,
    }),
    []
  );

  const { paginatedQuery, handlePaginatedQuery, handleFilterChange, handleResetFilter } =
    userPaginatedQuery<HarvestFilterForm>(defaultQueryOptions);

  // ---- Estado de filtro (drawer) ------------------------------------------
  const { open: isFilterOpen, onOpen: onOpenFilter, onClose: onCloseFilter } = useDisclosure();

  const filtersApplied = useMemo(
    () =>
      Object.values(paginatedQuery.filter ?? {}).filter(
        (v) => v !== undefined && v !== null && v !== '' && v !== false
      ).length,
    [paginatedQuery.filter]
  );

  // ---- Estado de exclusão --------------------------------------------------
  const [toDelete, setToDelete] = useState<Harvest | null>(null);
  const {
    open: isOpenDeleteDialog,
    onOpen: onOpenDeleteDialog,
    onClose: onCloseDeleteDialog,
  } = useDisclosure();

  const harvestsList = useHarvestsList({
    paginatedQuery,
    setPaginatedQuery: handlePaginatedQuery,
    filter: paginatedQuery.filter ?? undefined,
  });

  const deleteMutation = useRequest({
    asyncFunction: async ({ harvestUuid }: { harvestUuid: string }) => {
      return await deleteHarvest(harvestUuid);
    },
    queryKey: queryKey.harvests.list,
    queryKey2: queryKey.harvests.detail,
    // `useRequest`'s TypesRequest não tem variante "delete" (mesma observação
    // de CentroCusto/index.tsx) — o texto exibido no toast vem de
    // `personalizedMessage`, então o rótulo genérico de "update" nunca aparece.
    typesRequest: 'update',
    entityName: text.singularLabel,
    personalizedMessage: text.list.deletedToast,
    actionSuccess: () => {
      onCloseDeleteDialog();
      setToDelete(null);
    },
  });

  const handleDeleteClick = (harvest: Harvest) => {
    setToDelete(harvest);
    onOpenDeleteDialog();
  };

  const handleConfirmDelete = () => {
    if (toDelete) {
      deleteMutation.mutate({ harvestUuid: toDelete.uuid });
    }
  };

  const isDeleting = deleteMutation.isPending;

  const columnHelper = createColumnHelper<Harvest>();
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
      columnHelper.accessor('start_date', {
        header: text.list.table.startDate,
        cell: ({ row }) => (
          <Text fontSize="sm" color="fg.muted">
            {formatDate(row.original.start_date)}
          </Text>
        ),
        meta: styleColumTable.date,
      }),
      columnHelper.accessor('end_date', {
        header: text.list.table.endDate,
        cell: ({ row }) => (
          <Text fontSize="sm" color="fg.muted">
            {formatDate(row.original.end_date)}
          </Text>
        ),
        meta: styleColumTable.date,
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
      columnHelper.accessor('weeks', {
        header: text.list.table.weeks,
        cell: ({ row }) => (
          <Text fontSize="sm" color="fg.muted" textAlign="center">
            {`${row.original.weeks.length} ${text.list.table.weeksSuffix}`}
          </Text>
        ),
        meta: styleColumTable.sm,
      }),
      columnHelper.display({
        id: 'acoes',
        header: '',
        cell: ({ row }) => (
          <Flex justify="flex-end">
            <Actions size="sm">
              <Actions.Item
                icon={<Icon as={FiEye} />}
                onClick={() => navigate(`/cadastros-base/safras/${row.original.uuid}/detalhe`)}
              >
                {text.list.actions.view}
              </Actions.Item>
              {canEdit && (
                <Actions.Item
                  icon={<Icon as={FiEdit} />}
                  onClick={() => navigate(`/cadastros-base/safras/${row.original.uuid}`)}
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

  const isLoading = checkLoadingStatus([harvestsList]);
  const items = harvestsList.data?.data?.items;
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
        <RowClickToDetail />

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
            isError={harvestsList.isError}
            error={harvestsList.error}
            isEmpty={isEmpty}
            onRetry={() => harvestsList.refetch()}
            isRetrying={harvestsList.isFetching}
            emptyIcon={FiCalendar as ElementType}
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
            onCreate={() => navigate('/cadastros-base/safras/novo')}
          />
        </Box>
      </TableProvider>

      <FilterSideSafra
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
