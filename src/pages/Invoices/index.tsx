// src/pages/Invoices/index.tsx
// -----------------------------------------------------------------------------
// Tela de LISTAGEM (grid) de Invoice (Doc. Fiscal/Entrada) — domínio PRÓPRIO,
// TASK-FE-2762 (execução 033/Onda 3). Mirror estrutural de
// `CadastrosBase/PlanAccount/index.tsx` (grid+filtro+menu de ações via
// `Actions`) e `Planos/index.tsx` (domínio de 1ª classe).
//
// Colunas: Número/Série, Fornecedor, Dt. Emissão, Tipo, Vl. Total, Código.
// Coluna "Proprietário" (spec-visual §3) e "Emissão" (status ⚠/✅) OMITIDAS
// — a 1ª porque `GET /invoices` NÃO eager-carrega `proprietary`
// (`InvoiceRepository::listWithFilters`, confirmado por leitura direta —
// SEM MOCK), a 2ª porque não há campo real no contrato v1 (ver
// `@/@types/v2/Invoices`). "Gerar DANFE"/"Baixar XML"/"Relatório Pagamento"/
// "Documentos" também fora de escopo — ver `InvoiceActionsMenu.tsx`.
// -----------------------------------------------------------------------------

import { useMemo, useState } from 'react';

import { Badge, Box, Flex, Text, useDisclosure } from '@chakra-ui/react';
import { createColumnHelper } from '@tanstack/react-table';
import { FiFileText } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';

import type { ElementType } from 'react';

import { ButtonAdd } from '@/components/ButtonAdd';
import { ButtonFilter } from '@/components/ButtonFilter';
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

import { invoiceDocumentTypeOptions } from '@/constants/invoices/options/document-type-options';
import { queryKey } from '@/constants/query-key';

import { deleteInvoice } from '@/services/v2/Invoices/invoice-service';

import type { InvoiceFilterForm, InvoiceListItem } from '@/@types/v2/Invoices';

import { FilterSideInvoice } from './FilterSideInvoice';
import { InvoiceActionsMenu } from './InvoiceActionsMenu';
import { useInvoicesList } from './useInvoices';

import { PageHeader } from '@/components/ui/PageHeader';

export default function InvoicesList() {
  const { languageGB } = useLanguage();
  const navigate = useNavigate();
  const { can } = usePermissions();
  const text = languageGB.invoices.invoice;

  const canCreate = can('invoices_create');
  const canEdit = can('invoices_edit');
  const canDelete = can('invoices_delete');
  const canView = can('invoices_view');

  const defaultQueryOptions = useMemo(
    () => ({
      pageSize: 10,
      storageKey: 'Invoices' + queryKey.invoices.invoices,
    }),
    []
  );

  const { paginatedQuery, handlePaginatedQuery, handleFilterChange, handleResetFilter } =
    userPaginatedQuery<InvoiceFilterForm>(defaultQueryOptions);

  const { open: isFilterOpen, onOpen: onOpenFilter, onClose: onCloseFilter } = useDisclosure();

  const filtersApplied = useMemo(
    () =>
      Object.entries(paginatedQuery.filter ?? {}).filter(
        ([, v]) => v !== undefined && v !== null && v !== ''
      ).length,
    [paginatedQuery.filter]
  );

  const [toDelete, setToDelete] = useState<InvoiceListItem | null>(null);
  const {
    open: isOpenDeleteDialog,
    onOpen: onOpenDeleteDialog,
    onClose: onCloseDeleteDialog,
  } = useDisclosure();

  const invoicesList = useInvoicesList({
    paginatedQuery,
    setPaginatedQuery: handlePaginatedQuery,
    filter: paginatedQuery.filter ?? undefined,
  });

  // 422 quando alguma parcela já foi movimentada (Expense.amount != balance)
  // — `useRequest.onError` já lê a mensagem REAL do backend (`resData.message`),
  // sem tratamento dedicado (não é erro por campo, é regra de negócio única).
  const deleteMutation = useRequest({
    asyncFunction: async ({ invoiceUuid }: { invoiceUuid: string }) => {
      return await deleteInvoice(invoiceUuid);
    },
    queryKey: queryKey.invoices.invoices,
    queryKey2: queryKey.invoices.invoice,
    typesRequest: 'update',
    entityName: text.singularLabel,
    personalizedMessage: text.list.deletedToast,
    actionSuccess: () => {
      onCloseDeleteDialog();
      setToDelete(null);
    },
  });

  const isDeleting = deleteMutation.isPending;

  function handleDeleteClick(invoice: InvoiceListItem) {
    setToDelete(invoice);
    onOpenDeleteDialog();
  }

  function handleConfirmDelete() {
    if (toDelete) {
      deleteMutation.mutate({ invoiceUuid: toDelete.uuid });
    }
  }

  const columnHelper = createColumnHelper<InvoiceListItem>();
  const defaultColumns = useMemo(
    () => [
      columnHelper.accessor('number', {
        header: text.list.table.number,
        cell: ({ row }) => (
          <Text fontWeight="medium">
            {row.original.number}
            {row.original.series ? `/${row.original.series}` : ''}
          </Text>
        ),
        meta: styleColumTable.sm,
      }),
      columnHelper.accessor('provider', {
        header: text.list.table.provider,
        cell: ({ row }) => <Text lineClamp="1">{row.original.provider?.name ?? '—'}</Text>,
      }),
      columnHelper.accessor('dt_emission', {
        header: text.list.table.dtEmission,
        cell: ({ row }) => <Text fontSize="sm">{row.original.dt_emission}</Text>,
        meta: styleColumTable.sm,
      }),
      columnHelper.accessor('type', {
        header: text.list.table.type,
        cell: ({ row }) => (
          <Badge colorPalette="info" variant="subtle">
            {invoiceDocumentTypeOptions.getLabel(row.original.type, languageGB)}
          </Badge>
        ),
        meta: styleColumTable.sm,
      }),
      columnHelper.accessor('vl_total', {
        header: text.list.table.vlTotal,
        cell: ({ row }) => (
          <Text fontSize="sm">
            {row.original.vl_total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          </Text>
        ),
        meta: styleColumTable.sm,
      }),
      columnHelper.accessor('code', {
        header: text.list.table.code,
        cell: ({ row }) => (
          <Text fontFamily="mono" fontSize="sm">
            {row.original.code ?? '—'}
          </Text>
        ),
        meta: styleColumTable.sm,
      }),
      columnHelper.display({
        id: 'acoes',
        header: '',
        cell: ({ row }) => (
          <Flex justify="flex-end">
            <InvoiceActionsMenu
              canView={canView}
              canEdit={canEdit}
              canDelete={canDelete}
              isDeleting={isDeleting}
              labels={text.list.actions}
              onView={() => navigate(`/administrativo/doc-fiscal/${row.original.uuid}/visualizar`)}
              onEdit={() => navigate(`/administrativo/doc-fiscal/${row.original.uuid}`)}
              onPrint={() => navigate(`/administrativo/doc-fiscal/${row.original.uuid}/visualizar`)}
              onDelete={() => handleDeleteClick(row.original)}
            />
          </Flex>
        ),
        meta: styleColumTable.sm,
      }),
    ],
    [navigate, isDeleting, text, canView, canEdit, canDelete, languageGB]
  );

  const isLoading = checkLoadingStatus([invoicesList]);
  const items = invoicesList.data?.data?.items;
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
                  onClick={() => navigate('/administrativo/doc-fiscal/novo')}
                  languageGB={languageGB}
                />
              )}
              <ButtonFilter filtersApplied={filtersApplied} onClick={onOpenFilter} />
            </Flex>
          }
        >
          <PageHeader title={text.list.pageTitle} description={text.list.pageSubtitle} />
        </HeaderGrid>

        <Box mt={6}>
          <Table
            isLoading={isLoading}
            isError={invoicesList.isError}
            error={invoicesList.error}
            isEmpty={isEmpty}
            onRetry={() => invoicesList.refetch()}
            isRetrying={invoicesList.isFetching}
            emptyIcon={FiFileText as ElementType}
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
            onCreate={() => navigate('/administrativo/doc-fiscal/novo')}
          />
        </Box>
      </TableProvider>

      <FilterSideInvoice
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
        itemName={toDelete?.number}
      />
    </ContainerGrid>
  );
}
