// src/pages/Financeiro/ImportacaoMovBancarios/index.tsx
// -----------------------------------------------------------------------------
// Tela de LISTAGEM (grid) de IMPORTAÇÃO MOV. BANCÁRIOS — Financeiro
// (TASK-064-MOV-FE-01). Rota `/financeiro/importacao` (path já cravado no
// menu, item `fin-imp`/permissão `movement-sheets_view` JÁ EXISTEM —
// `navigationTree.ts`/`navigationPermissions.ts`/`permissionsCatalog.json`,
// zero edição nesta Tarefa).
//
// Mirror estrutural de `Administrativo/CorrecaoEstoque/index.tsx`
// (`useCustomGridQuery` INLINE, SEM `useGridSettings` — catálogo de colunas
// pequeno e fixo), **SEM o bloco de exclusão**: `DeleteConfirmDialog`/
// `deleteMutation`/coluna de ação "excluir" NÃO existem aqui — o
// `mode_matrix` desta feature não tem modo `excluir` (diferente de
// StockCorrection, que tem).
//
// Sem `ButtonAdd`/rota de formulário — não existe cadastro unitário
// (contrato de API §1); o único ponto de criação é a importação de planilha
// (`HeaderTable.tsx`, conteúdo do modal na TASK-064-MOV-FE-02).
//
// Paginação: diferente de StockCorrection (fixa em 15/página), a API de
// Movement Sheets ACEITA `per_page` (default 10, max 100 —
// `MovementSheetIndexRequest`/`MovementSheetFilterData` do backend,
// confirmado por leitura direta) — `per_page` é repassado normalmente pelo
// `movement-sheet-service.ts`, sem a exceção fixa-15 do irmão.
//
// Rótulos de coluna (decisão 2, CLM-19 CORRIGIDA): `date` → "Dt. Emissão",
// `user` → "Responsável" — SEM a troca de rótulo/dado do legado (o legado
// mostrava a DATA sob o cabeçalho "Responsável" e o NOME sob "Dt. Emissão").
// -----------------------------------------------------------------------------

import { useMemo } from 'react';

import { Box, EmptyState, Flex, Icon, Text, useDisclosure, VStack } from '@chakra-ui/react';
import { createColumnHelper } from '@tanstack/react-table';
import { FiEye, FiFileText } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';

import { Actions } from '@/components/Action';
import { ContainerGrid } from '@/components/ContainerGrid';
import { HeaderGrid } from '@/components/HeaderGrid';
import { Table } from '@/components/Table';

import { TableProvider } from '@/contexts/TableContext';

import { useCustomGridQuery } from '@/hooks/useCustomGridQuery';
import { useLanguage } from '@/hooks/useLanguage';
import { userPaginatedQuery } from '@/hooks/usePaginatedQueryStorage';

import { checkLoadingStatus } from '@/utils/checkLoadingStatus';
import formatDate from '@/utils/formatDate';
import { styleColumTable } from '@/utils/style-colum-table';

import { queryKey } from '@/constants/query-key';

import { listMovementSheets } from '@/services/v2/MovementSheets/movement-sheet-service';
import type { ListMovementSheetsParams } from '@/services/v2/MovementSheets/movement-sheet-service';

import type { MovementSheetFilterForm, MovementSheetListItem } from '@/@types/v2/MovementSheets';

import { FilterSideImportacaoMovBancarios } from './FilterSideImportacaoMovBancarios';
import { HeaderTable } from './HeaderTable';

export default function ImportacaoMovBancariosList() {
  const { languageGB } = useLanguage();
  const navigate = useNavigate();
  const text = languageGB.movementSheets.movementSheet;

  const defaultQueryOptions = useMemo(
    () => ({
      pageSize: 10,
      storageKey: 'FinanceiroImportacaoMovBancarios' + queryKey.movementSheets.movementSheetsList,
    }),
    []
  );

  const { paginatedQuery, handlePaginatedQuery, handleFilterChange, handleResetFilter } =
    userPaginatedQuery<MovementSheetFilterForm>(defaultQueryOptions);

  // ---- Estado de filtro (drawer) ------------------------------------------
  const { open: isFilterOpen, onOpen: onOpenFilter, onClose: onCloseFilter } = useDisclosure();

  const filtersApplied = useMemo(
    () =>
      Object.values(paginatedQuery.filter ?? {}).filter(
        (v) => v !== undefined && v !== null && v !== ''
      ).length,
    [paginatedQuery.filter]
  );

  const movementSheetsList = useCustomGridQuery<MovementSheetListItem, ListMovementSheetsParams>({
    asyncFunction: listMovementSheets,
    queryKey: queryKey.movementSheets.movementSheetsList,
    paginatedQuery,
    setPaginatedQuery: handlePaginatedQuery,
    filterQuery: [],
    filter: paginatedQuery.filter ?? ({} as MovementSheetFilterForm),
  });

  function handleViewDetail(item: MovementSheetListItem) {
    navigate(`/financeiro/importacao/${item.uuid}`);
  }

  const columnHelper = createColumnHelper<MovementSheetListItem>();
  const defaultColumns = useMemo(
    () => [
      columnHelper.accessor('code', {
        header: text.list.table.code,
        enableHiding: false, // coluna-âncora — nunca ocultável
        cell: ({ row }) => (
          <Text fontFamily="mono" fontWeight="medium">
            {row.original.code}
          </Text>
        ),
      }),
      columnHelper.accessor('date', {
        header: text.list.table.date,
        cell: ({ row }) => <Text fontSize="sm">{formatDate(row.original.date)}</Text>,
        meta: styleColumTable.date,
      }),
      columnHelper.accessor((row) => row.user?.name ?? '', {
        id: 'user',
        header: text.list.table.user,
        cell: ({ row }) => (
          <Text fontSize="sm" color="fg.muted" lineClamp="1">
            {row.original.user?.name || '—'}
          </Text>
        ),
        meta: styleColumTable.md,
      }),
      columnHelper.accessor('created_at', {
        header: text.list.table.createdAt,
        cell: ({ row }) => (
          <Text fontSize="sm" color="fg.muted">
            {formatDate(row.original.created_at, 'dd/MM/yyyy HH:mm')}
          </Text>
        ),
        meta: styleColumTable.date,
      }),
      columnHelper.display({
        id: 'acoes',
        header: '',
        enableHiding: false,
        cell: ({ row }) => (
          <Flex justify="flex-end">
            <Actions size="sm">
              <Actions.Item
                icon={<Icon as={FiEye} />}
                onClick={() => handleViewDetail(row.original)}
              >
                {text.list.table.actions.viewDetail}
              </Actions.Item>
            </Actions>
          </Flex>
        ),
        meta: { ...styleColumTable.sm, gridOrder: 'fixed-end' },
      }),
    ],
    [navigate, text]
  );

  const isLoading = checkLoadingStatus([movementSheetsList]);
  const items = movementSheetsList.data?.data?.items;
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
          {isEmpty && !movementSheetsList.isError ? (
            <EmptyState.Root>
              <EmptyState.Content>
                <EmptyState.Indicator>
                  <Icon as={FiFileText} boxSize={8} color="fg.muted" />
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
                {/* Sem CTA de criação — não existe rota de cadastro unitário,
                    único ponto de criação é a importação de planilha
                    (HeaderTable.tsx). */}
              </EmptyState.Content>
            </EmptyState.Root>
          ) : (
            <Table
              isLoading={isLoading}
              isError={movementSheetsList.isError}
              error={movementSheetsList.error}
              onRetry={() => movementSheetsList.refetch()}
              isRetrying={movementSheetsList.isFetching}
            />
          )}
        </Box>
      </TableProvider>

      <FilterSideImportacaoMovBancarios
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
