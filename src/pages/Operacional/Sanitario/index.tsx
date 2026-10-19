// src/pages/Operacional/Sanitario/index.tsx
// -----------------------------------------------------------------------------
// Tela de LISTAGEM (grid) de SANITÁRIO — Operacional > Pecuária > Manejo
// (F-062, TASK-SAN-FE-02, `san-screen-list`/`san-list-table`/`san-filter-form`).
//
// Rota: /operacional/sanitario (guardada por `sanitary_view`, registrada só
// na Tarefa 33 — este arquivo NÃO toca `src/router/index.tsx`).
//
// Casca de GRID de verdade — `ContainerGrid` + `TableProvider` + `HeaderGrid`
// + `Table`, mirror `Weaning/index.tsx`/`Acasalamento/index.tsx` (UX-GAP já
// decidido pelo dono — seguir-pelo-padrão, contrato-tela §10).
//
// Colunas — `GAP-FE-SAN-01` FECHADO nesta Tarefa: o default proposto
// (Código/Data/Lote/Responsável) foi CONFIRMADO contra o código real de
// `SanitaryListResource` (leitura direta do worktree da API) e DIVERGE — o
// Resource devolve SOMENTE `uuid`/`code`/`date`/`time_control`/`created_at`
// (SEM `batch`/`user`, que só existem no detalhe, fora do escopo desta
// Tarefa). Colunas fechadas: Código · Data · Ações — ver Histórico da Tarefa
// para a divergência completa.
//
// Ordenação fixa `code desc` (regra 1 da Tarefa, mirror `EvolucaoRebanho`/
// `mode_matrix`) — `enableSorting: false` em toda coluna de dado, sem
// controle de ordenação clicável.
//
// Exclusão (`EP-SAN-05`) — `DELETE /sanitaries/{uuid}` responde
// `204 No Content` (`ApiResponse::noContent()`, confirmado por leitura direta
// do Controller), SEM envelope/`message` — o toast de sucesso usa o texto
// ESTÁTICO do dicionário (`text.list.deletedToast`), mirror
// `Weaning/index.tsx` (mesma decisão, mesmo achado).
//
// Sem Zustand — fazenda ativa já vem do `AuthContext`; paginação/filtro por
// `userPaginatedQuery`, `storageKey` = `titleModule + queryKey + activeFarmUuid`
// (regra 5 da Tarefa, mirror `Acasalamento/index.tsx`).
// -----------------------------------------------------------------------------

import { useMemo, useState } from 'react';

import type { ElementType } from 'react';

import { Box, Flex, Text, useDisclosure, VStack } from '@chakra-ui/react';
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

import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/hooks/useLanguage';
import { userPaginatedQuery } from '@/hooks/usePaginatedQueryStorage';
import { usePermissions } from '@/hooks/usePermissions';

import { checkLoadingStatus } from '@/utils/checkLoadingStatus';
import { extractApiErrorMessage } from '@/utils/extractApiErrorMessage';
import formatDate from '@/utils/formatDate';
import { styleColumTable } from '@/utils/style-colum-table';

import { queryKey } from '@/constants/query-key';

import { deleteSanitary } from '@/services/v2/Sanitaries/sanitaries-service';

import type { SanitaryFilterForm, SanitaryListItem } from '@/@types/v2/Sanitaries';

import { FilterSideSanitario } from './FilterSideSanitario';
import { HeaderTable } from './HeaderTable';
import { SanitarioActionsMenu } from './SanitarioActionsMenu';
import { useSanitariosList } from './useSanitarios';

const SANITARIO_LIST_ROUTE = '/operacional/sanitario';

export default function SanitarioList() {
  const { languageGB } = useLanguage();
  const navigate = useNavigate();
  const { can } = usePermissions();
  const { activeFarmUuid } = useAuth();
  const queryClient = useQueryClient();
  const text = languageGB.sanitary.sanitary;

  const canView = can('sanitary_view');
  const canEdit = can('sanitary_edit');
  const canDelete = can('sanitary_delete');

  // storageKey (regra 5 da Tarefa) = titleModule + queryKey + fazenda ativa —
  // nunca prefixar `storageKeyGB`, o hook já faz.
  const defaultQueryOptions = useMemo(
    () => ({
      pageSize: 10,
      storageKey: text.titleModule + queryKey.sanitary.sanitaries + (activeFarmUuid ?? ''),
    }),
    [text.titleModule, activeFarmUuid]
  );

  const { paginatedQuery, handlePaginatedQuery, handleFilterChange, handleResetFilter } =
    userPaginatedQuery<SanitaryFilterForm>(defaultQueryOptions);

  // ---- Estado de filtro (drawer) ------------------------------------------
  const { open: isFilterOpen, onOpen: onOpenFilter, onClose: onCloseFilter } = useDisclosure();

  // `_label` é companion DISPLAY-ONLY de re-hidratação do `SelectAsyncPaginate`
  // — nunca conta como filtro aplicado (mesma regra de `Weaning`/`Separations`).
  const filtersApplied = useMemo(
    () =>
      Object.entries(paginatedQuery.filter ?? {})
        .filter(([key]) => !key.endsWith('_label'))
        .filter(([, v]) => v !== undefined && v !== null && v !== '').length,
    [paginatedQuery.filter]
  );

  const sanitariosList = useSanitariosList({
    paginatedQuery,
    setPaginatedQuery: handlePaginatedQuery,
    filter: paginatedQuery.filter ?? undefined,
  });

  // ---- Estado de exclusão --------------------------------------------------
  const [toDelete, setToDelete] = useState<SanitaryListItem | null>(null);
  const {
    open: isOpenDeleteDialog,
    onOpen: onOpenDeleteDialog,
    onClose: onCloseDeleteDialog,
  } = useDisclosure();

  const deleteMutation = useMutation({
    mutationFn: async (uuid: string) => deleteSanitary(uuid),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [queryKey.sanitary.sanitaries] });

      // `DELETE EP-SAN-05` responde 204 sem envelope (ver nota de cabeçalho)
      // — toast usa o texto ESTÁTICO do dicionário, nunca `response.message`.
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

  function handleDeleteClick(item: SanitaryListItem) {
    setToDelete(item);
    onOpenDeleteDialog();
  }

  function handleConfirmDelete() {
    if (toDelete) deleteMutation.mutate(toDelete.uuid);
  }

  const columnHelper = createColumnHelper<SanitaryListItem>();
  const defaultColumns = useMemo(
    () => [
      columnHelper.accessor('code', {
        header: text.list.table.code,
        cell: ({ row }) => <Text fontWeight="medium">{row.original.code}</Text>,
        enableSorting: false,
        meta: styleColumTable.sm,
      }),
      columnHelper.accessor('date', {
        header: text.list.table.date,
        cell: ({ row }) => <Text fontSize="sm">{formatDate(row.original.date)}</Text>,
        enableSorting: false,
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
              <SanitarioActionsMenu
                canView={canView}
                canEdit={canEdit}
                canDelete={canDelete}
                isDeleting={isDeleting}
                labels={{
                  view: text.list.actions.view,
                  edit: text.list.actions.edit,
                  delete: text.list.actions.delete,
                }}
                onView={() => navigate(`${SANITARIO_LIST_ROUTE}/${item.uuid}`)}
                onEdit={() => navigate(`${SANITARIO_LIST_ROUTE}/${item.uuid}/editar`)}
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

  const isLoading = checkLoadingStatus([sanitariosList]);
  const items = sanitariosList.data?.data?.items;
  const isEmpty = !isLoading && !sanitariosList.isError && (items?.length ?? 0) === 0;

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
            isError={sanitariosList.isError}
            error={sanitariosList.error}
            isEmpty={isEmpty}
            onRetry={() => sanitariosList.refetch()}
            isRetrying={sanitariosList.isFetching}
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
          />
        </Box>
      </TableProvider>

      <FilterSideSanitario
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
        title={text.list.deleteDialog.title}
        description={
          toDelete
            ? text.list.deleteDialog.descriptionTemplate.replace('{code}', String(toDelete.code))
            : undefined
        }
        hideQuestionMark
        tone="danger"
      />
    </ContainerGrid>
  );
}
