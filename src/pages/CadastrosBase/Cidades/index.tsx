// src/pages/CadastrosBase/Cidades/index.tsx
// -----------------------------------------------------------------------------
// Tela de LISTAGEM (grid FLAT — sem hierarquia, COM paginação REAL — padrão
// do projeto 10/página, per_page enviado dinamicamente ao back conforme
// pageSize do grid —, COM filtro por Estado + busca, SEM ações) de CIDADES
// (City) — Cadastros
// Base / Geografia.
// Rota: /cadastros-base/cidades (guardada por `cities_view`, registrada em
// TASK-FE-024 — este arquivo não mexe em rota/menu).
//
// Fidelidade ao legado (TASK-FE-023, âncora `../agro365/resources/views/
// cities/index.blade.php`): grade legada com EXATAMENTE 2 colunas
// (Nome | Estado), SEM ação de linha. O FILTRO (Estado cascata + busca) é
// ACRÉSCIMO explicitamente pedido na task-packet do dev, implementado via
// `SelectAsyncPaginate` real (`listStates`, TASK-FE-021), NÃO uma lista
// estática. Mirror técnico de CadastrosBase/Estados/index.tsx (mesmo grid
// flat, mesma ausência de coluna de Ações/clique-para-detalhe) + casca de
// HeaderTable+FilterSide+filtersApplied+empty state "filtrado" de
// CadastrosBase/TecnicasDiagnostico/index.tsx — MENOS tudo que é escrita
// (create/edit/delete), que nenhum dos dois precedentes aplica aqui:
//   - grid via useCitiesList (TASK-FE-021 — paginação REAL, diferente do
//     adaptador single-page de useStatesList);
//   - HeaderTable → SÓ botão de filtro (sem ButtonAdd);
//   - FilterSideCidades → drawer com `state_uuid` (cascata) + `search`;
//   - SEM coluna de Ações, SEM DeleteConfirmDialog, SEM navegação ao
//     selecionar linha (zero rota de escrita/detalhe neste módulo).
//
// Diferença crítica vs. Estados: Cidades PAGINA DE VERDADE (10/página por
// padrão — ajuste dev 2026-07-23, era 50 —, meta real do backend) —
// `userPaginatedQuery`/`TableProvider` operam sobre a
// paginação real que `listCities` (city-service.ts, TASK-FE-021) já adapta
// corretamente do envelope `ApiResponse::paginated`.
// -----------------------------------------------------------------------------

import { useMemo } from 'react';

import { Box, Text, useDisclosure } from '@chakra-ui/react';
import { createColumnHelper } from '@tanstack/react-table';
import type { ElementType } from 'react';
import { FiMap } from 'react-icons/fi';

import { ContainerGrid } from '@/components/ContainerGrid';
import { HeaderGrid } from '@/components/HeaderGrid';
import { Table } from '@/components/Table';

import { TableProvider } from '@/contexts/TableContext';

import { useLanguage } from '@/hooks/useLanguage';
import { userPaginatedQuery } from '@/hooks/usePaginatedQueryStorage';

import { checkLoadingStatus } from '@/utils/checkLoadingStatus';

import { queryKey } from '@/constants/query-key';

import type { CityFilterForm, CityListItem } from '@/@types/v2/Cities';

import { FilterSideCidades } from './FilterSideCidades';
import { HeaderTable } from './HeaderTable';
import { useCitiesList } from './useCities';

import { PageHeader } from '@/components/ui/PageHeader';

import { ListToolbar } from '@/components/ui/ListToolbar';
import { useListSearch } from '@/hooks/useListSearch';

export default function CidadesList() {
  const { languageGB } = useLanguage();
  const text = languageGB.cities.city;

  const defaultQueryOptions = useMemo(
    () => ({
      pageSize: 10,
      storageKey: 'CadastrosBaseCidades' + queryKey.cities.list,
    }),
    []
  );

  const { paginatedQuery, handlePaginatedQuery, handleFilterChange, handleResetFilter } =
    userPaginatedQuery<CityFilterForm>(defaultQueryOptions);
  const listSearch = useListSearch(paginatedQuery.filter, handleFilterChange);

  // ---- Estado de filtro (drawer) — mesmo shape de TecnicasDiagnostico/Especies, sem estado de exclusão (não existe delete) ----
  const { open: isFilterOpen, onOpen: onOpenFilter, onClose: onCloseFilter } = useDisclosure();

  const filtersApplied = useMemo(
    () =>
      Object.values(paginatedQuery.filter ?? {}).filter(
        (v) => v !== undefined && v !== null && v !== ''
      ).length,
    [paginatedQuery.filter]
  );

  const citiesList = useCitiesList({
    paginatedQuery,
    setPaginatedQuery: handlePaginatedQuery,
    filter: paginatedQuery.filter ?? undefined,
  });

  const columnHelper = createColumnHelper<CityListItem>();
  const defaultColumns = useMemo(
    () => [
      columnHelper.accessor('title', {
        header: text.list.table.title,
        cell: ({ row }) => (
          <Text fontWeight="medium" lineClamp="1">
            {row.original.title}
          </Text>
        ),
      }),
      columnHelper.accessor('state', {
        header: text.list.table.state,
        cell: ({ row }) => (
          <Text lineClamp="1" color="fg.muted">
            {row.original.state
              ? `${row.original.state.title} (${row.original.state.letter})`
              : '—'}
          </Text>
        ),
      }),
    ],
    [text]
  );

  const isLoading = checkLoadingStatus([citiesList]);
  const isError = citiesList.isError;
  const items = citiesList.data?.data?.items;
  const isEmpty = !isLoading && !isError && (items?.length ?? 0) === 0;

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
          header={<HeaderTable onOpenFilter={onOpenFilter} filtersApplied={filtersApplied} />}
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
            isError={isError}
            error={citiesList.error}
            isEmpty={isEmpty}
            onRetry={() => citiesList.refetch()}
            isRetrying={citiesList.isFetching}
            emptyIcon={FiMap as ElementType}
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

      <FilterSideCidades
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
