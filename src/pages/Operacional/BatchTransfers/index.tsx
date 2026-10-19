// src/pages/Operacional/BatchTransfers/index.tsx
// -----------------------------------------------------------------------------
// Tela de LISTAGEM de ANIMAIS ELEGÍVEIS para Transferência Animais/Lote
// (BatchTransfer, feature `426be835`, TASK-LOTE-FE-01, contrato §5). Mirror
// estrutural `CadastrosBase/Batches/index.tsx`.
//
// ⚠️ NÃO é histórico de transferências — o legado nunca teve essa listagem.
// Lista animais ATIVOS ELEGÍVEIS para transferir.
//
// Rota `/operacional/transferencia-animais-lote` (guardada por
// `transference_animal_batch`, registrada em `src/router/index.tsx`).
//
// 🔴 SEM coluna de ações e SEM seleção de linha — a grid legada não tem
// nenhuma das duas (`index.blade.php:68-74`, exatamente 5 `<th>`). SEM
// ordenação por coluna — o backend ordena fixo por `animals.id`.
// -----------------------------------------------------------------------------

import { useMemo } from 'react';

import { Text, useDisclosure, VStack } from '@chakra-ui/react';
import { createColumnHelper } from '@tanstack/react-table';
import { ArrowLeftRight } from 'lucide-react';

import { ContainerGrid } from '@/components/ContainerGrid';
import { HeaderGrid } from '@/components/HeaderGrid';
import { Table } from '@/components/Table';

import { TableProvider } from '@/contexts/TableContext';

import { useLanguage } from '@/hooks/useLanguage';
import { userPaginatedQuery } from '@/hooks/usePaginatedQueryStorage';

import { checkLoadingStatus } from '@/utils/checkLoadingStatus';
import { styleColumTable } from '@/utils/style-colum-table';

import { getBatchTransferTypeLabel } from '@/constants/BatchTransfers/batch-transfer-type';
import { queryKey } from '@/constants/query-key';

import type { BatchTransferFilterForm, EligibleAnimal } from '@/@types/v2/BatchTransfers';

import { FilterSideBatchTransfers } from './FilterSideBatchTransfers';
import { HeaderTable } from './HeaderTable';
import { useBatchTransfersList } from './useBatchTransfers';

export default function BatchTransfersList() {
  const { languageGB } = useLanguage();
  const text = languageGB.batchTransfers.batchTransfer;

  const defaultQueryOptions = useMemo(
    () => ({
      pageSize: 10,
      storageKey: 'OperacionalBatchTransfers' + queryKey.batchTransfers.eligibleAnimals,
    }),
    []
  );

  const { paginatedQuery, handlePaginatedQuery, handleFilterChange, handleResetFilter } =
    userPaginatedQuery<BatchTransferFilterForm>(defaultQueryOptions);

  const { open: isFilterOpen, onOpen: onOpenFilter, onClose: onCloseFilter } = useDisclosure();

  const filtersApplied = useMemo(
    () =>
      Object.entries(paginatedQuery.filter ?? {})
        .filter(([key]) => !key.endsWith('_label'))
        .map(([, v]) => v)
        .filter((v) => v !== undefined && v !== null && v !== '' && v !== false).length,
    [paginatedQuery.filter]
  );

  const eligibleAnimalsList = useBatchTransfersList({
    paginatedQuery,
    setPaginatedQuery: handlePaginatedQuery,
    filter: paginatedQuery.filter ?? undefined,
  });

  const items = eligibleAnimalsList.data?.data?.items ?? [];
  const total = eligibleAnimalsList.data?.data?.pagination?.total ?? 0;

  const columnHelper = createColumnHelper<EligibleAnimal>();
  const defaultColumns = useMemo(
    () => [
      columnHelper.accessor('type', {
        header: text.list.table.type,
        // 🔴 Mapper OBRIGATÓRIO — nunca o valor cru (contrato §5.2).
        cell: ({ row }) => (
          <Text fontSize="sm" lineClamp="1">
            {getBatchTransferTypeLabel(row.original.type, languageGB)}
          </Text>
        ),
        meta: styleColumTable.sm,
      }),
      columnHelper.accessor('identification', {
        header: text.list.table.identification,
        cell: ({ row }) => (
          <Text fontWeight="medium" lineClamp="1">
            {row.original.identification}
          </Text>
        ),
      }),
      columnHelper.accessor('age', {
        header: text.list.table.age,
        // String JÁ FORMATADA pelo servidor — renderizar sem reformatar.
        cell: ({ row }) => (
          <Text fontSize="sm" color="fg.muted">
            {row.original.age ?? '—'}
          </Text>
        ),
        meta: styleColumTable.md,
      }),
      columnHelper.accessor('category', {
        header: text.list.table.category,
        cell: ({ row }) => (
          <Text fontSize="sm" color="fg.muted" lineClamp="1">
            {row.original.category ?? '—'}
          </Text>
        ),
        meta: styleColumTable.md,
      }),
      columnHelper.accessor('batch', {
        header: text.list.table.batch,
        cell: ({ row }) => (
          <Text fontSize="sm" color="fg.muted" lineClamp="1">
            {row.original.batch ?? '—'}
          </Text>
        ),
        meta: styleColumTable.md,
      }),
    ],
    [text, languageGB]
  );

  const isLoading = checkLoadingStatus([eligibleAnimalsList]);
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
            <Text fontSize="sm" color="fg.muted">
              {text.list.totalCountLabel}: {total}
            </Text>
          </VStack>
        </HeaderGrid>

        <VStack mt={6} align="stretch" gap={3}>
          <Table
            isLoading={isLoading}
            isError={eligibleAnimalsList.isError}
            error={eligibleAnimalsList.error}
            isEmpty={isEmpty}
            onRetry={() => eligibleAnimalsList.refetch()}
            isRetrying={eligibleAnimalsList.isFetching}
            retryLabel={text.list.error.retry}
            emptyIcon={ArrowLeftRight}
            emptyTitle={text.list.emptyState.title}
            emptyDescription={text.list.emptyState.description}
            canCreate={false}
          />
        </VStack>
      </TableProvider>

      <FilterSideBatchTransfers
        isOpen={isFilterOpen}
        onClose={onCloseFilter}
        handleFilterChange={handleFilterChange}
        handleReset={handleResetFilter}
        filter={paginatedQuery.filter}
        languageGB={languageGB}
      />
    </ContainerGrid>
  );
}
