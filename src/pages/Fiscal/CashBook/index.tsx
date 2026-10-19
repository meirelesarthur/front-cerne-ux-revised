// src/pages/Fiscal/CashBook/index.tsx
// -----------------------------------------------------------------------------
// Tela de LISTAGEM (grid paginado) de CashBook (LCDPR — Livro Caixa Digital
// do Produtor Rural, domínio Fiscal, execução 045, TASK-LCDPR-FE-02).
// Consome `GET /api/v1/cash-books` (`CONTRATO-API-LCDPR.md §1`), ordenado
// `year desc` (server-side, sem outra ordenação suportada pelo backend).
//
// Farm-scoped via `X-Farm-Id` (sem `registrationId` de contexto pai) — mirror
// estrutural `CadastrosBase/Contador/index.tsx` (grid flat + `Actions`
// dropdown + `DeleteConfirmDialog`), adaptado para as 3 ações extras
// (Visualizar/Baixar TXT/Imprimir Relatório) gated por permissão (`LM-I-04`).
//
// Exclusão via `useMutation` DEDICADO (mesmo racional de `Contador/index.tsx`
// — mensagem de erro do backend pode não ser um 422 estruturado de campo).
// -----------------------------------------------------------------------------

import { useMemo, useState } from 'react';

import { Box, EmptyState, Icon, Text, useDisclosure, VStack } from '@chakra-ui/react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createColumnHelper } from '@tanstack/react-table';
import { FiBook, FiDownload, FiEye, FiPrinter, FiTrash2 } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';

import { Actions } from '@/components/Action';
import { Button } from '@/components/Button';
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
import { downloadBlob } from '@/utils/downloadBlob';
import { extractApiErrorMessage } from '@/utils/extractApiErrorMessage';

import { queryKey } from '@/constants/query-key';

import {
  deleteCashBook,
  downloadCashBookReport,
  downloadCashBookTxt,
} from '@/services/v2/Fiscal/CashBook/cash-book-service';

import type { CashBookFilterForm, CashBookListItem } from '@/@types/v2/Fiscal/cashBook';

import { FilterSideCashBook } from './FilterSideCashBook';
import { HeaderTable } from './HeaderTable';
import { useCashBooksList } from './useCashBooks';

export default function CashBookList() {
  const { languageGB } = useLanguage();
  const navigate = useNavigate();
  const { can } = usePermissions();
  const text = languageGB.cashBooks.cashBook;

  const canCreate = can('cash-book_create');

  const defaultQueryOptions = useMemo(
    () => ({
      pageSize: 10,
      storageKey: 'FiscalCashBook' + queryKey.cashBooks.cashBooksList,
    }),
    []
  );

  const { paginatedQuery, handlePaginatedQuery, handleFilterChange, handleResetFilter } =
    userPaginatedQuery<CashBookFilterForm>(defaultQueryOptions);

  const { open: isFilterOpen, onOpen: onOpenFilter, onClose: onCloseFilter } = useDisclosure();

  const filtersApplied = useMemo(
    () =>
      Object.entries(paginatedQuery.filter ?? {}).filter(
        ([, v]) => v !== undefined && v !== null && v !== ''
      ).length,
    [paginatedQuery.filter]
  );

  const cashBooksList = useCashBooksList({
    paginatedQuery,
    setPaginatedQuery: handlePaginatedQuery,
    filter: paginatedQuery.filter ?? undefined,
  });

  // ---- Downloads (leitura, sem mutation — loading POR LINHA) --------------
  const [downloadingTxtUuid, setDownloadingTxtUuid] = useState<string | null>(null);
  const [downloadingReportUuid, setDownloadingReportUuid] = useState<string | null>(null);

  // `CashBookListResource` não expõe `filename` (payload enxuto de listagem)
  // — nome derivado de `year` como fallback honesto (não é o `filename`
  // real gerado no backend, que só o Detalhe conhece).
  async function handleDownloadTxt(row: CashBookListItem) {
    setDownloadingTxtUuid(row.uuid);
    try {
      const blob = await downloadCashBookTxt(row.uuid);
      downloadBlob(blob, `livro-caixa-${row.year}.txt`);
    } catch {
      toaster.error({ title: text.singularLabel, description: text.list.downloadTxtError });
    } finally {
      setDownloadingTxtUuid(null);
    }
  }

  async function handlePrintReport(row: CashBookListItem) {
    setDownloadingReportUuid(row.uuid);
    try {
      const blob = await downloadCashBookReport(row.uuid);
      downloadBlob(blob, `livro-caixa-${row.year}.pdf`);
    } catch {
      toaster.error({ title: text.singularLabel, description: text.list.downloadReportError });
    } finally {
      setDownloadingReportUuid(null);
    }
  }

  // ---- Estado de exclusão --------------------------------------------------
  const queryClient = useQueryClient();
  const [toDelete, setToDelete] = useState<CashBookListItem | null>(null);
  const {
    open: isOpenDeleteDialog,
    onOpen: onOpenDeleteDialog,
    onClose: onCloseDeleteDialog,
  } = useDisclosure();

  const deleteMutation = useMutation({
    mutationFn: async (uuid: string) => await deleteCashBook(uuid),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [queryKey.cashBooks.cashBooksList] });
      toaster.success({
        title: text.singularLabel,
        description: text.list.deleteSuccess,
        duration: 7000,
      });
      onCloseDeleteDialog();
      setToDelete(null);
    },
    onError: (error) => {
      toaster.error({
        title: text.singularLabel,
        description: extractApiErrorMessage(error) || text.list.deleteError,
        duration: 7000,
      });
    },
  });

  const isDeleting = deleteMutation.isPending;

  function handleDeleteClick(row: CashBookListItem) {
    setToDelete(row);
    onOpenDeleteDialog();
  }

  function handleConfirmDelete() {
    if (toDelete) {
      deleteMutation.mutate(toDelete.uuid);
    }
  }

  // ---- Colunas (EXATAMENTE 4, LM-I-01..04) --------------------------------
  const columnHelper = createColumnHelper<CashBookListItem>();
  const defaultColumns = useMemo(
    () => [
      columnHelper.accessor('year', {
        header: text.list.table.year,
        cell: ({ row }) => <Text fontWeight="medium">{row.original.year}</Text>,
      }),
      columnHelper.accessor('proprietary_label', {
        header: text.list.table.proprietary,
        cell: ({ row }) => <Text lineClamp="1">{row.original.proprietary_label}</Text>,
      }),
      columnHelper.accessor('contador_label', {
        header: text.list.table.contador,
        cell: ({ row }) => (
          <Text fontSize="sm" color="fg.muted" lineClamp="1">
            {row.original.contador_label}
          </Text>
        ),
      }),
      columnHelper.display({
        id: 'acoes',
        header: '',
        cell: ({ row }) => (
          <Actions size="sm" languageGB={languageGB}>
            {can('cash-book_view') && (
              <Actions.Item
                icon={<Icon as={FiEye} />}
                onClick={() => navigate(`/fiscal/livro-caixa/${row.original.uuid}`)}
              >
                {text.list.actions.view}
              </Actions.Item>
            )}
            {can('cash-book_view') && (
              <Actions.Item
                icon={<Icon as={FiDownload} />}
                onClick={() => handleDownloadTxt(row.original)}
                disabled={downloadingTxtUuid === row.original.uuid}
              >
                {text.list.actions.downloadTxt}
              </Actions.Item>
            )}
            {can('cash-book_view') && (
              <Actions.Item
                icon={<Icon as={FiPrinter} />}
                onClick={() => handlePrintReport(row.original)}
                disabled={downloadingReportUuid === row.original.uuid}
              >
                {text.list.actions.printReport}
              </Actions.Item>
            )}
            {can('cash-book_delete') && (
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
        ),
      }),
    ],
    [navigate, can, languageGB, text, downloadingTxtUuid, downloadingReportUuid, isDeleting]
  );

  const isLoading = checkLoadingStatus([cashBooksList]);
  const items = cashBooksList.data?.data?.items;
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
          {isEmpty && !cashBooksList.isError ? (
            <EmptyState.Root>
              <EmptyState.Content>
                <EmptyState.Indicator>
                  <Icon as={FiBook} boxSize={8} color="fg.muted" />
                </EmptyState.Indicator>
                <VStack textAlign="center" gap={1}>
                  <EmptyState.Title>
                    {filtersApplied > 0
                      ? text.list.emptyState.titleFiltered
                      : text.list.emptyState.titleEmpty}
                  </EmptyState.Title>
                  <EmptyState.Description>
                    {filtersApplied > 0
                      ? text.list.emptyState.descriptionFiltered
                      : text.list.emptyState.descriptionEmpty}
                  </EmptyState.Description>
                </VStack>
                {filtersApplied === 0 && canCreate && (
                  <Button
                    title={text.list.emptyState.cta}
                    onClick={() => navigate('/fiscal/livro-caixa/create')}
                  />
                )}
              </EmptyState.Content>
            </EmptyState.Root>
          ) : (
            <Table
              isLoading={isLoading}
              isError={cashBooksList.isError}
              error={cashBooksList.error}
              onRetry={() => cashBooksList.refetch()}
              isRetrying={cashBooksList.isFetching}
            />
          )}
        </Box>
      </TableProvider>

      <FilterSideCashBook
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
        itemName={toDelete ? String(toDelete.year) : undefined}
      />
    </ContainerGrid>
  );
}
