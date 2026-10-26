// src/pages/Operacional/FechamentoSemana/index.tsx
// -----------------------------------------------------------------------------
// Tela de LISTAGEM (grid) de FECHAMENTO SEMANA — Operacional. TASK-FE-FS-02
// (contrato de tela §3, FID-G3F SR-01/SR-05/SB-01/SB-02/SB-03/SF-03/SH-02/
// SE-02).
//
// Rota: `/operacional/fechamento-semana` (guardada por `closing_weeks_view`,
// registrada em `src/router/index.tsx`).
//
// SEM `FilterSide`/`ButtonFilter` — fidelidade ao legado (CL-006: a listagem
// não tem campo de busca/filtro). Mirror estrutural de
// `Administrativo/RegistroEventos/index.tsx` (mesma ausência de filtro) +
// exclusão via `useMutation` direto de `Operacional/Carregamento/index.tsx`
// (NÃO `useDeleted` v2, por instrução da Tarefa).
//
// Colunas (list_manifest LM-01..05): Código · Semana · Dt. Início · Dt. Fim ·
// Ações. Ordem fixa `code DESC` (o servidor já entrega ordenado,
// `latest('code')`) — SEM ordenação clicável em nenhuma coluna (CL-006).
// -----------------------------------------------------------------------------

import { useMemo, useState, type ElementType } from 'react';

import { Box, Flex, Icon, Text, useDisclosure } from '@chakra-ui/react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createColumnHelper } from '@tanstack/react-table';
import { FiCalendar, FiEye, FiTrash2 } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';

import { Actions } from '@/components/Action';
import { ContainerGrid } from '@/components/ContainerGrid';
import { DeleteConfirmDialog } from '@/components/DeleteConfirmDialog';
import { HeaderGrid } from '@/components/HeaderGrid';
import { Table } from '@/components/Table';
import { toaster } from '@/components/ui/toaster';

import { TableProvider } from '@/contexts/TableContext';

import { useLanguage } from '@/hooks/useLanguage';
import { userPaginatedQuery } from '@/hooks/usePaginatedQueryStorage';
import { usePermissions } from '@/hooks/usePermissions';

import { checkLoadingStatus } from '@/utils/checkLoadingStatus';
import { extractApiErrorMessage } from '@/utils/extractApiErrorMessage';
import formatDate from '@/utils/formatDate';
import { styleColumTable } from '@/utils/style-colum-table';

import { queryKey } from '@/constants/query-key';

import { deleteClosingWeek } from '@/services/v2/FechamentoSemana/closing-week-service';

import type { ClosingWeekListItem } from '@/@types/v2/FechamentoSemana';

import { HeaderTable } from './HeaderTable';
import { useClosingWeeksList } from './useFechamentoSemana';

import { PageHeader } from '@/components/ui/PageHeader';

// Seletor de itens por página — 10/30/50/100, mirror `Carregamento/index.tsx`.
// NUNCA 200: o servidor valida `per_page` como `max:100`.
const PAGE_SIZE_OPTIONS = [10, 30, 50, 100];

export default function FechamentoSemanaList() {
  const { languageGB } = useLanguage();
  const navigate = useNavigate();
  const { can } = usePermissions();
  const text = languageGB.fechamentoSemana.closingWeek;

  const canView = can('closing_weeks_view');
  const canDelete = can('closing_weeks_delete');
  const canCreate = can('closing_weeks_create');

  const defaultQueryOptions = useMemo(
    () => ({
      pageSize: 10,
      storageKey: 'OperacionalFechamentoSemana' + queryKey.fechamentoSemana.closingWeeks,
    }),
    []
  );

  const { paginatedQuery, handlePaginatedQuery } = userPaginatedQuery(defaultQueryOptions);

  const closingWeeksList = useClosingWeeksList({
    paginatedQuery,
    setPaginatedQuery: handlePaginatedQuery,
  });

  // ---- Estado de exclusão --------------------------------------------------
  const queryClient = useQueryClient();
  const [toDelete, setToDelete] = useState<ClosingWeekListItem | null>(null);
  const {
    open: isOpenDeleteDialog,
    onOpen: onOpenDeleteDialog,
    onClose: onCloseDeleteDialog,
  } = useDisclosure();

  const deleteMutation = useMutation({
    mutationFn: async (uuid: string) => deleteClosingWeek(uuid),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [queryKey.fechamentoSemana.closingWeeks] });

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

  function handleDeleteClick(item: ClosingWeekListItem) {
    setToDelete(item);
    onOpenDeleteDialog();
  }

  function handleConfirmDelete() {
    if (toDelete) {
      deleteMutation.mutate(toDelete.uuid);
    }
  }

  const columnHelper = createColumnHelper<ClosingWeekListItem>();
  const defaultColumns = useMemo(
    () => [
      columnHelper.accessor('code', {
        header: text.list.table.code,
        cell: ({ row }) => <Text fontWeight="medium">{row.original.code}</Text>,
        enableSorting: false,
        meta: styleColumTable.sm,
      }),
      columnHelper.accessor('week', {
        header: text.list.table.week,
        cell: ({ row }) => <Text fontSize="sm">{row.original.week}</Text>,
        enableSorting: false,
        meta: styleColumTable.sm,
      }),
      columnHelper.accessor('start_date', {
        header: text.list.table.startDate,
        cell: ({ row }) => <Text fontSize="sm">{formatDate(row.original.start_date)}</Text>,
        enableSorting: false,
        meta: styleColumTable.date,
      }),
      columnHelper.accessor('end_date', {
        header: text.list.table.endDate,
        cell: ({ row }) => <Text fontSize="sm">{formatDate(row.original.end_date)}</Text>,
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
              <Actions size="sm">
                {canView && (
                  <Actions.Item
                    icon={<Icon as={FiEye} />}
                    onClick={() => navigate(`/operacional/fechamento-semana/${item.uuid}`)}
                  >
                    {text.list.actions.view}
                  </Actions.Item>
                )}
                {canDelete && (
                  <Actions.Item
                    icon={<Icon as={FiTrash2} />}
                    tone="danger"
                    onClick={() => handleDeleteClick(item)}
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
    [navigate, isDeleting, text, canView, canDelete]
  );

  const isLoading = checkLoadingStatus([closingWeeksList]);
  const items = closingWeeksList.data?.data?.items;
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
        <HeaderGrid header={<HeaderTable languageGB={languageGB} />}>
          <PageHeader title={text.list.pageTitle} description={text.list.pageSubtitle} />
        </HeaderGrid>

        <Box mt={6}>
          <Table
            isLoading={isLoading}
            pageSizeOptions={PAGE_SIZE_OPTIONS}
            isError={closingWeeksList.isError}
            error={closingWeeksList.error}
            onRetry={() => closingWeeksList.refetch()}
            isRetrying={closingWeeksList.isFetching}
            retryLabel={text.list.error.retry}
            isEmpty={isEmpty}
            emptyIcon={FiCalendar as ElementType}
            emptyTitle={text.list.emptyState.titleEmpty}
            emptyDescription={text.list.emptyState.descriptionEmpty}
            canCreate={canCreate}
            createLabel={text.list.emptyState.cta}
            onCreate={() => navigate('/operacional/fechamento-semana/novo')}
          />
        </Box>
      </TableProvider>

      <DeleteConfirmDialog
        isOpen={isOpenDeleteDialog}
        onClose={() => {
          onCloseDeleteDialog();
          setToDelete(null);
        }}
        onConfirm={handleConfirmDelete}
        isLoading={isDeleting}
        title={text.deleteDialog.title}
        description={
          toDelete
            ? text.deleteDialog.descriptionTemplate.replace('{code}', toDelete.code)
            : undefined
        }
        hideQuestionMark
        tone="danger"
      />
    </ContainerGrid>
  );
}
