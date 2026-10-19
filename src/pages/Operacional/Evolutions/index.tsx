// src/pages/Operacional/Evolutions/index.tsx
// -----------------------------------------------------------------------------
// Tela de LISTAGEM (grid) de EVOLUÇÃO/REBANHO — Operacional > Pecuária >
// Transferências (Tarefa 26, spa-contract-evolucao-rebanho.md §4).
//
// Rota: /operacional/evolucao-rebanho (guardada por `evolutions_view`,
// registrada em src/router/index.tsx, ANTES do catch-all /operacional/*).
//
// UX-GAP confirmado pelo dono (`GAP-EVO-FE-01`) — sem tela própria no design
// system `cerne`, seguir o padrão vigente do fork: esqueleto canônico de
// `Operacional/Separations/index.tsx` (ContainerGrid + TableProvider +
// HeaderGrid + Table + FilterSide), descartando exclusão/`ButtonAdd`
// (módulo 100% somente-leitura, mirror `Administrativo/SaldoEstoque`).
//
// 5 colunas (Animal · Data de Nascimento · Data da Evolução · Categoria
// Anterior · Próxima Categoria) — a coluna "Data de Nascimento" (`LST-02`,
// `GAP-EVO-FE-03`) já está disponível no `EvolutionResource` (aditivo
// aplicado no backend), incluída na posição do legado, entre "Animal" e
// "Data da Evolução". Sem coluna de ações, sem ordenação clicável
// (`enableSorting: false` — a API ordena fixo `date DESC, created_at DESC`
// e não expõe `sort`), sem CTA "Novo" no vazio (as evoluções são geradas
// pelo job diário, sem UI de criação).
//
// Paginação FIXA em 10 (`GAP-EVO-FE-05`/armadilha confirmada — o backend
// ignora `per_page`, `pageSizeOptions={[10]}` obrigatório).
//
// Datas normalizadas via `formatDate(value.slice(0, 10))` — defensivo
// (o backend já serializa `->toDateString()`, sem fuso, mas o `slice` é
// no-op inofensivo e mantém a tela resiliente a uma regressão futura do
// Resource, mirror da orientação do contrato §4.5).
// -----------------------------------------------------------------------------

import { useMemo, type ElementType } from 'react';

import { Box, Text, useDisclosure, VStack } from '@chakra-ui/react';
import { createColumnHelper } from '@tanstack/react-table';
import { FiFileText } from 'react-icons/fi';

import { ContainerGrid } from '@/components/ContainerGrid';
import { HeaderGrid } from '@/components/HeaderGrid';
import { Table } from '@/components/Table';

import { TableProvider } from '@/contexts/TableContext';

import { useLanguage } from '@/hooks/useLanguage';
import { userPaginatedQuery } from '@/hooks/usePaginatedQueryStorage';

import { checkLoadingStatus } from '@/utils/checkLoadingStatus';
import formatDate from '@/utils/formatDate';
import { styleColumTable } from '@/utils/style-colum-table';

import { queryKey } from '@/constants/query-key';

import type { EvolutionFilterRequest, EvolutionListItem } from '@/@types/v2/Evolutions';

import { FilterSideEvolutions } from './FilterSideEvolutions';
import { HeaderTable } from './HeaderTable';
import { useEvolutionsList } from './useEvolutions';

const PAGE_SIZE_OPTIONS = [10];

export default function EvolutionsList() {
  const { languageGB } = useLanguage();
  const text = languageGB.evolutions.evolution;

  const defaultQueryOptions = useMemo(
    () => ({
      pageSize: 10,
      storageKey: 'OperacionalEvolucaoRebanho' + queryKey.evolutions.evolutionsList,
    }),
    []
  );

  const { paginatedQuery, handlePaginatedQuery, handleFilterChange, handleResetFilter } =
    userPaginatedQuery<EvolutionFilterRequest>(defaultQueryOptions);

  const { open: isFilterOpen, onOpen: onOpenFilter, onClose: onCloseFilter } = useDisclosure();

  // `animal_label` é companion DISPLAY-ONLY de re-hidratação do
  // `SelectAsyncPaginate` — nunca conta como filtro aplicado (mirror
  // `Separations/index.tsx`).
  const filtersApplied = useMemo(
    () =>
      Object.entries(paginatedQuery.filter ?? {})
        .filter(([key]) => !key.endsWith('_label'))
        .filter(([, v]) => v !== undefined && v !== null && v !== '').length,
    [paginatedQuery.filter]
  );

  const evolutionsList = useEvolutionsList({
    paginatedQuery,
    setPaginatedQuery: handlePaginatedQuery,
    filter: paginatedQuery.filter ?? undefined,
  });

  const columnHelper = createColumnHelper<EvolutionListItem>();
  const defaultColumns = useMemo(
    () => [
      columnHelper.accessor((row) => row.animal.identification, {
        id: 'animal',
        header: text.list.table.animal,
        enableSorting: false,
        cell: ({ row }) => <Text fontWeight="medium">{row.original.animal.identification}</Text>,
        meta: styleColumTable.lg,
      }),
      columnHelper.accessor((row) => row.animal.birth_date ?? '', {
        id: 'birth_date',
        header: text.list.table.birthDate,
        enableSorting: false,
        cell: ({ row }) => (
          <Text fontSize="sm">
            {row.original.animal.birth_date
              ? formatDate(row.original.animal.birth_date.slice(0, 10))
              : '—'}
          </Text>
        ),
        meta: styleColumTable.date,
      }),
      columnHelper.accessor('date', {
        header: text.list.table.date,
        enableSorting: false,
        cell: ({ row }) => <Text fontSize="sm">{formatDate(row.original.date.slice(0, 10))}</Text>,
        meta: styleColumTable.date,
      }),
      columnHelper.accessor((row) => row.category_old?.description ?? '', {
        id: 'category_old',
        header: text.list.table.categoryOld,
        enableSorting: false,
        cell: ({ row }) => (
          <Text fontSize="sm">{row.original.category_old?.description ?? '—'}</Text>
        ),
        meta: styleColumTable.md,
      }),
      columnHelper.accessor((row) => row.category_next.description, {
        id: 'category_next',
        header: text.list.table.categoryNext,
        enableSorting: false,
        cell: ({ row }) => <Text fontSize="sm">{row.original.category_next.description}</Text>,
        meta: styleColumTable.md,
      }),
    ],
    [text]
  );

  const isLoading = checkLoadingStatus([evolutionsList]);
  const items = evolutionsList.data?.data?.items;
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
          <Table
            isLoading={isLoading}
            pageSizeOptions={PAGE_SIZE_OPTIONS}
            isError={evolutionsList.isError}
            error={evolutionsList.error}
            onRetry={() => evolutionsList.refetch()}
            isRetrying={evolutionsList.isFetching}
            retryLabel={text.list.error.retry}
            isEmpty={isEmpty}
            emptyIcon={FiFileText as ElementType}
            emptyTitle={filtersApplied > 0 ? text.list.emptyFiltered.title : text.list.empty.title}
            emptyDescription={
              filtersApplied > 0 ? text.list.emptyFiltered.description : text.list.empty.description
            }
          />
        </Box>
      </TableProvider>

      <FilterSideEvolutions
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
