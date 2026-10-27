// src/pages/CadastrosBase/Vacinas/index.tsx
// -----------------------------------------------------------------------------
// Tela de LISTAGEM (grid flat, sem hierarquia) de VACINAS — Cadastros Base.
// Rota: /cadastros-base/vacinas (guardada por `vaccine_view`, registrada em
// src/router/index.tsx antes do catch-all /cadastros-base/*).
//
// Estrutura idêntica a CadastrosBase/Racas/index.tsx (grid paginado +
// HeaderTable + FilterSide + delete via useRequest + DeleteConfirmDialog).
// `GET /vaccines` pagina de verdade (meta real) e o filtro por Espécie é
// SERVER-SIDE (`specie_uuid` na querystring, via `useVaccineList`/
// `vaccine-service.ts`) — a tela consome `items`/`pagination` direto da
// resposta, sem filtragem em memória.
//
// Sem flags `can_edit`/`can_delete` por item no `VaccineResource` — a
// autorização das ações de linha é 100% por permissão GLOBAL
// (`vaccine_edit`/`vaccine_delete`), mesmo padrão de Racas/index.tsx.
//
// Exclusão DEFINITIVA (`Vaccine` não usa SoftDeletes) — o
// `DeleteConfirmDialog` recebe copy própria (`warningText`) deixando isso
// explícito, em vez do aviso genérico padrão do componente.
//
// Coluna "Espécie" trata `specie === null` (Vacina sem Espécie associada,
// D2 — campo opcional) com o fallback "—", mesmo padrão de Racas/index.tsx —
// aqui esse caminho é ESPERADO, não só defensivo.
// -----------------------------------------------------------------------------

import { ElementType, useMemo, useState } from 'react';

import { Badge, Box, Flex, Icon, Text, useDisclosure } from '@chakra-ui/react';
import { createColumnHelper } from '@tanstack/react-table';
import { FiActivity, FiEdit, FiTrash2 } from 'react-icons/fi';
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

import { deleteVaccine } from '@/services/v2/Vaccines/vaccine-service';

import type { VaccineFilterForm, VaccineListItem } from '@/@types/v2/Vaccines';

import { FilterSideVacinas } from './FilterSideVacinas';
import { HeaderTable } from './HeaderTable';
import { useVaccineList } from './useVaccines';

import { PageHeader } from '@/components/ui/PageHeader';

import { ListToolbar } from '@/components/ui/ListToolbar';
import { useListSearch } from '@/hooks/useListSearch';

export default function VacinasList() {
  const { languageGB } = useLanguage();
  const navigate = useNavigate();
  const { can } = usePermissions();
  const text = languageGB.vaccines.vaccine;

  const canCreate = can('vaccine_create');
  const canEdit = can('vaccine_edit');
  const canDelete = can('vaccine_delete');

  const defaultQueryOptions = useMemo(
    () => ({
      pageSize: 10,
      storageKey: 'CadastrosBaseVacinas' + queryKey.vaccines.list,
    }),
    []
  );

  const { paginatedQuery, handlePaginatedQuery, handleFilterChange, handleResetFilter } =
    userPaginatedQuery<VaccineFilterForm>(defaultQueryOptions);
  const listSearch = useListSearch(paginatedQuery.filter, handleFilterChange);

  // ---- Estado de filtro (drawer) ------------------------------------------
  const { open: isFilterOpen, onOpen: onOpenFilter, onClose: onCloseFilter } = useDisclosure();

  const filtersApplied = useMemo(
    () =>
      Object.entries(paginatedQuery.filter ?? {})
        // Chaves `*_label` (ex.: `specie_label`) são DISPLAY-ONLY —
        // persistidas só para re-hidratar o label do SelectAsyncPaginate no
        // drawer, nunca enviadas à API — e não devem inflar o badge
        // "Filtros(N)".
        .filter(([key]) => !key.endsWith('_label'))
        .map(([, v]) => v)
        .filter((v) => v !== undefined && v !== null && v !== '' && v !== false).length,
    [paginatedQuery.filter]
  );

  // ---- Estado de exclusão --------------------------------------------------
  const [toDelete, setToDelete] = useState<VaccineListItem | null>(null);
  const {
    open: isOpenDeleteDialog,
    onOpen: onOpenDeleteDialog,
    onClose: onCloseDeleteDialog,
  } = useDisclosure();

  const vaccinesList = useVaccineList({
    paginatedQuery,
    setPaginatedQuery: handlePaginatedQuery,
    filter: paginatedQuery.filter ?? undefined,
  });

  const deleteMutation = useRequest({
    asyncFunction: async ({ vaccineUuid }: { vaccineUuid: string }) => {
      return await deleteVaccine(vaccineUuid);
    },
    queryKey: queryKey.vaccines.list,
    queryKey2: queryKey.vaccines.detail,
    // `useRequest`'s TypesRequest não tem variante "delete" — "update" é a
    // opção compilável usada pelo mesmo motivo em Racas/CondicoesPagamento (o
    // texto exibido vem de `personalizedMessage`, o rótulo genérico
    // associado a "update" nunca aparece ao usuário).
    typesRequest: 'update',
    entityName: text.singularLabel,
    personalizedMessage: text.list.deletedToast,
    actionSuccess: () => {
      onCloseDeleteDialog();
      setToDelete(null);
    },
  });

  const handleDeleteClick = (vaccine: VaccineListItem) => {
    setToDelete(vaccine);
    onOpenDeleteDialog();
  };

  const handleConfirmDelete = () => {
    if (toDelete) {
      deleteMutation.mutate({ vaccineUuid: toDelete.uuid });
    }
  };

  const isDeleting = deleteMutation.isPending;

  // ---- Itens da página atual — filtro por Espécie é SERVER-SIDE ----------
  // (`specie_uuid` já vai na querystring de `/vaccines` via `useVaccineList`/
  // `vaccine-service.ts` — nenhuma filtragem em memória).
  const items = vaccinesList.data?.data?.items ?? [];

  const columnHelper = createColumnHelper<VaccineListItem>();
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
                  onClick={() => navigate(`/cadastros-base/vacinas/${row.original.uuid}`)}
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

  const isLoading = checkLoadingStatus([vaccinesList]);
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
          <PageHeader title={text.list.pageTitle} description={text.list.pageSubtitle} />
        </HeaderGrid>

        <ListToolbar
          search={listSearch.value}
          onSearch={listSearch.onChange}
          searchPlaceholder={languageGB.defaltStrings.searchList}
          onOpenFilter={onOpenFilter}
          filtersApplied={filtersApplied - (paginatedQuery.filter?.search ? 1 : 0)}
        />

        <Box>
          <Table
            isLoading={isLoading}
            isError={vaccinesList.isError}
            error={vaccinesList.error}
            isEmpty={isEmpty}
            onRetry={() => vaccinesList.refetch()}
            isRetrying={vaccinesList.isFetching}
            emptyIcon={FiActivity as ElementType}
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
            onCreate={() => navigate('/cadastros-base/vacinas/novo')}
          />
        </Box>
      </TableProvider>

      <FilterSideVacinas
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
