// src/pages/Administrativo/CorrecaoEstoque/index.tsx
// -----------------------------------------------------------------------------
// Tela de LISTAGEM (grid) de CORREÇÃO DE ESTOQUE — Administrativo → Estoque
// (TASK-FE-COR-01). Rota `/administrativo/correcao` (path já cravado no menu,
// item `adm-est-cor`/permissão `stock-corrections_view` JÁ EXISTEM —
// `navigationTree.ts`/`navigationPermissions.ts`/`permissionsCatalog.json`,
// zero edição nesta Tarefa).
//
// Mirror estrutural de `Administrativo/SaldoEstoque/index.tsx`
// (`useCustomGridQuery` INLINE, SEM `useGridSettings` — catálogo de colunas
// pequeno e fixo) combinado com a exclusão via `useRequest` de
// `Administrativo/Eventos/index.tsx` (aqui sem o desvio `errors.in_use` — a
// exclusão de Correção de Estoque SEMPRE executa, tudo-ou-nada, contrato de
// tela §2.4), mas com `DeleteConfirmDialog` REFORÇADO (`tone="danger"` +
// `warningText` de negócio — a exclusão reverte saldo e recalcula custo
// médio de TODA a fazenda, impacto financeiro real).
//
// Sem `ButtonAdd`/rota de formulário — não existe cadastro unitário
// (contrato de API §1); o único ponto de criação é a importação de planilha
// (`HeaderTable.tsx`/`StockCorrectionImportModal.tsx`).
//
// Paginação: a API pagina FIXO em 15/página (`->paginate()` sem argumento no
// Repository) e IGNORA `per_page` na querystring (`stock-correction-
// service.ts::listStockCorrections` nunca o envia). Para não fabricar uma
// capacidade que a API não tem, o seletor de tamanho de página do `<Table>`
// é restrito a uma única opção (`pageSizeOptions={[15]}`) — honestidade de
// UI (Regra 9), em vez de oferecer um controle que o backend ignora
// silenciosamente.
// -----------------------------------------------------------------------------

import { useMemo, useState, type ElementType } from 'react';

import { Box, Flex, Icon, Text, useDisclosure, VStack } from '@chakra-ui/react';
import { createColumnHelper } from '@tanstack/react-table';
import { FiEye, FiFileText, FiTrash2 } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';

import { Actions } from '@/components/Action';
import { ContainerGrid } from '@/components/ContainerGrid';
import { DeleteConfirmDialog } from '@/components/DeleteConfirmDialog';
import { HeaderGrid } from '@/components/HeaderGrid';
import { Table } from '@/components/Table';

import { TableProvider } from '@/contexts/TableContext';

import { useCustomGridQuery } from '@/hooks/useCustomGridQuery';
import { useLanguage } from '@/hooks/useLanguage';
import { userPaginatedQuery } from '@/hooks/usePaginatedQueryStorage';
import { usePermissions } from '@/hooks/usePermissions';
import { useRequest } from '@/hooks/useRequest';

import { checkLoadingStatus } from '@/utils/checkLoadingStatus';
import formatDate from '@/utils/formatDate';
import { styleColumTable } from '@/utils/style-colum-table';

import { queryKey } from '@/constants/query-key';

import {
  deleteStockCorrection,
  listStockCorrections,
} from '@/services/v2/StockCorrections/stock-correction-service';
import type { ListStockCorrectionsParams } from '@/services/v2/StockCorrections/stock-correction-service';

import type {
  StockCorrectionFilterForm,
  StockCorrectionListItem,
} from '@/@types/v2/StockCorrections';

import { FilterSideCorrecaoEstoque } from './FilterSideCorrecaoEstoque';
import { HeaderTable } from './HeaderTable';

// Único tamanho de página aceito — mirror da limitação real do backend (ver
// nota de cabeçalho acima).
const PAGE_SIZE_OPTIONS = [15];

export default function CorrecaoEstoqueList() {
  const { languageGB } = useLanguage();
  const navigate = useNavigate();
  const { can } = usePermissions();
  const text = languageGB.stockCorrections.stockCorrection;

  const canDelete = can('stock-corrections_delete');

  const defaultQueryOptions = useMemo(
    () => ({
      pageSize: 15,
      storageKey: 'AdministrativoCorrecaoEstoque' + queryKey.stockCorrections.stockCorrectionsList,
    }),
    []
  );

  const { paginatedQuery, handlePaginatedQuery, handleFilterChange, handleResetFilter } =
    userPaginatedQuery<StockCorrectionFilterForm>(defaultQueryOptions);

  // ---- Estado de filtro (drawer) ------------------------------------------
  const { open: isFilterOpen, onOpen: onOpenFilter, onClose: onCloseFilter } = useDisclosure();

  const filtersApplied = useMemo(
    () =>
      Object.values(paginatedQuery.filter ?? {}).filter(
        (v) => v !== undefined && v !== null && v !== ''
      ).length,
    [paginatedQuery.filter]
  );

  const correcaoEstoqueList = useCustomGridQuery<
    StockCorrectionListItem,
    ListStockCorrectionsParams
  >({
    asyncFunction: listStockCorrections,
    queryKey: queryKey.stockCorrections.stockCorrectionsList,
    paginatedQuery,
    setPaginatedQuery: handlePaginatedQuery,
    filterQuery: [],
    filter: paginatedQuery.filter ?? ({} as StockCorrectionFilterForm),
  });

  // ---- Estado de exclusão (reforçada) --------------------------------------
  const [toDelete, setToDelete] = useState<StockCorrectionListItem | null>(null);
  const {
    open: isOpenDeleteDialog,
    onOpen: onOpenDeleteDialog,
    onClose: onCloseDeleteDialog,
  } = useDisclosure();

  // `destroy()` sempre executa (tudo-ou-nada) — sem guarda de dependência
  // (422 `errors.in_use`) como em Function/Event/PlanAccount (contrato de
  // tela §2.4) — por isso `useRequest` comum basta aqui (mirror
  // `deletePlanAccount`, `typesRequest: 'update'` — `useRequest` não tem
  // variante "delete" própria).
  const deleteMutation = useRequest({
    asyncFunction: async ({ stockCorrectionUuid }: { stockCorrectionUuid: string }) => {
      return await deleteStockCorrection(stockCorrectionUuid);
    },
    queryKey: queryKey.stockCorrections.stockCorrectionsList,
    // `useRequest`'s TypesRequest não tem variante "delete" — "update" é a
    // única opção compilável (mesmo truque de `deletePlanAccount`/
    // `deleteServiceExpense`). O texto exibido no toast vem de
    // `personalizedMessage`, então o rótulo genérico de "update" nunca
    // aparece ao usuário.
    typesRequest: 'update',
    entityName: text.singularLabel,
    personalizedMessage: text.list.deletedToast,
    actionSuccess: () => {
      onCloseDeleteDialog();
      setToDelete(null);
    },
  });

  const isDeleting = deleteMutation.isPending;

  function handleDeleteClick(item: StockCorrectionListItem) {
    setToDelete(item);
    onOpenDeleteDialog();
  }

  function handleConfirmDelete() {
    if (toDelete) {
      deleteMutation.mutate({ stockCorrectionUuid: toDelete.uuid });
    }
  }

  function handleViewDetail(item: StockCorrectionListItem) {
    navigate(`/administrativo/correcao/${item.uuid}`);
  }

  const columnHelper = createColumnHelper<StockCorrectionListItem>();
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
              {canDelete && (
                <Actions.Item
                  icon={<Icon as={FiTrash2} />}
                  onClick={() => handleDeleteClick(row.original)}
                  color="red.400"
                  disabled={isDeleting}
                >
                  {text.list.table.actions.delete}
                </Actions.Item>
              )}
            </Actions>
          </Flex>
        ),
        meta: { ...styleColumTable.sm, gridOrder: 'fixed-end' },
      }),
    ],
    [navigate, text, canDelete, isDeleting]
  );

  const isLoading = checkLoadingStatus([correcaoEstoqueList]);
  const items = correcaoEstoqueList.data?.data?.items;
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
          {/* Sem CTA de criação — não existe rota de cadastro unitário,
              único ponto de criação é a importação de planilha
              (HeaderTable.tsx). */}
          <Table
            isLoading={isLoading}
            pageSizeOptions={PAGE_SIZE_OPTIONS}
            isError={correcaoEstoqueList.isError}
            error={correcaoEstoqueList.error}
            isEmpty={isEmpty}
            onRetry={() => correcaoEstoqueList.refetch()}
            isRetrying={correcaoEstoqueList.isFetching}
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
            canCreate={false}
          />
        </Box>
      </TableProvider>

      <FilterSideCorrecaoEstoque
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
        tone="danger"
        itemName={toDelete?.code}
        warningText={text.list.deleteDialog.warning}
      />
    </ContainerGrid>
  );
}
