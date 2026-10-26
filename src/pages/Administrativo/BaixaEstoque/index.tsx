// src/pages/Administrativo/BaixaEstoque/index.tsx
// -----------------------------------------------------------------------------
// Tela de LISTAGEM (grid) de BAIXA DE ESTOQUE — Administrativo (esteira 038,
// TASK-FE-3002). Rota `/administrativo/baixa-estoque` (path/item de menu
// `adm-est-bai`/permissão `stock-writeoffs_view` JÁ EXISTEM —
// `navigationTree.ts`/`navigationPermissions.ts`/`permissionsCatalog.json`,
// zero edição nesta Tarefa).
//
// Mirror estrutural de `Administrativo/CorrecaoEstoque/index.tsx` (grid +
// `FilterSide` Contrato B + exclusão via `useRequest`), com a diferença de
// que a Baixa TEM um ponto de criação unitário (botão "Nova baixa" →
// TASK-FE-3004, fora desta rodada) — diferente da Correção, que só cria por
// importação de planilha.
//
// Colunas (contrato de tela §2.2, D7 — exibe `created_at`, não `date`):
// código, responsável (`user.name`), armazém (`warehouse.description`),
// data de cadastro (`created_at`), tipo (`type_label`), ações (ver/excluir).
// A ação "Emitir NFe" (visível quando `nfe_uuid == null`) é TASK-FE-3006,
// fora desta rodada — não incluída ainda no menu de ações.
// -----------------------------------------------------------------------------

import { useMemo, useState, type ElementType } from 'react';

import { Box, Flex, Icon, Text, useDisclosure } from '@chakra-ui/react';
import { createColumnHelper } from '@tanstack/react-table';
import { FiEye, FiFileText, FiPackage, FiTrash2 } from 'react-icons/fi';
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
import { useRequest } from '@/hooks/useRequest';

import { checkLoadingStatus } from '@/utils/checkLoadingStatus';
import formatDate from '@/utils/formatDate';
import { styleColumTable } from '@/utils/style-colum-table';

import { queryKey } from '@/constants/query-key';

import { deleteStockWriteoff } from '@/services/v2/StockWriteoffs/stock-writeoff-service';

import type { StockWriteoffData, StockWriteoffFilterForm } from '@/@types/v2/StockWriteoffs';

import { FilterSideBaixaEstoque } from './FilterSideBaixaEstoque';
import { HeaderTable } from './HeaderTable';
import { useStockWriteoffsList } from './useStockWriteoffs';

import { PageHeader } from '@/components/ui/PageHeader';

const BAIXA_ESTOQUE_LIST_ROUTE = '/administrativo/baixa-estoque';

export default function BaixaEstoqueList() {
  const { languageGB } = useLanguage();
  const navigate = useNavigate();
  const { can } = usePermissions();
  const text = languageGB.stockWriteoffs.stockWriteoff;

  const canCreate = can('stock-writeoffs_create');
  const canDelete = can('stock-writeoffs_delete');
  const canReport = can('stock_writeoffs_report');
  const canEmitNfe = can('nfe_create');

  const defaultQueryOptions = useMemo(
    () => ({
      pageSize: 10,
      storageKey: 'AdministrativoBaixaEstoque' + queryKey.stockWriteoffs.stockWriteoffsList,
    }),
    []
  );

  const { paginatedQuery, handlePaginatedQuery, handleFilterChange, handleResetFilter } =
    userPaginatedQuery<StockWriteoffFilterForm>(defaultQueryOptions);

  // ---- Estado de filtro (drawer) ------------------------------------------
  const { open: isFilterOpen, onOpen: onOpenFilter, onClose: onCloseFilter } = useDisclosure();

  const filtersApplied = useMemo(
    () =>
      Object.values(paginatedQuery.filter ?? {}).filter(
        (v) => v !== undefined && v !== null && v !== ''
      ).length,
    [paginatedQuery.filter]
  );

  const baixaEstoqueList = useStockWriteoffsList({
    paginatedQuery,
    setPaginatedQuery: handlePaginatedQuery,
    filter: paginatedQuery.filter ?? undefined,
  });

  // ---- Estado de exclusão (restaura estoque no backend, D2) ---------------
  const [toDelete, setToDelete] = useState<StockWriteoffData | null>(null);
  const {
    open: isOpenDeleteDialog,
    onOpen: onOpenDeleteDialog,
    onClose: onCloseDeleteDialog,
  } = useDisclosure();

  const deleteMutation = useRequest({
    asyncFunction: async ({ stockWriteoffUuid }: { stockWriteoffUuid: string }) => {
      return await deleteStockWriteoff(stockWriteoffUuid);
    },
    queryKey: queryKey.stockWriteoffs.stockWriteoffsList,
    // `useRequest`'s TypesRequest não tem variante "delete" própria — "update"
    // é a única opção compilável (mesmo truque de `deleteStockCorrection`). O
    // texto exibido no toast vem de `personalizedMessage`.
    typesRequest: 'update',
    entityName: text.singularLabel,
    personalizedMessage: text.list.deletedToast,
    actionSuccess: () => {
      onCloseDeleteDialog();
      setToDelete(null);
    },
  });

  const isDeleting = deleteMutation.isPending;

  function handleDeleteClick(item: StockWriteoffData) {
    setToDelete(item);
    onOpenDeleteDialog();
  }

  function handleConfirmDelete() {
    if (toDelete) {
      deleteMutation.mutate({ stockWriteoffUuid: toDelete.uuid });
    }
  }

  function handleViewDetail(item: StockWriteoffData) {
    navigate(`${BAIXA_ESTOQUE_LIST_ROUTE}/${item.uuid}`);
  }

  // ---- Handoff "Emitir NFe" (TASK-FE-3006/exec-038, D-FE-BE-05) -----------
  // Mirror legado `StockWriteoffController@nfe()` / mirror front do fluxo
  // "Duplicar" da Nfe (`CreateOrUpdateNfe.tsx::duplicateFromUuid`) — NAVEGA
  // para a criação de Nfe (`/fiscal/nfe-emitidas/novo`) passando só o uuid
  // da baixa via `location.state`; o rascunho (`GET .../nfe-draft`) é
  // buscado DENTRO da tela de destino, não aqui (sem round-trip antes de
  // navegar, mesmo racional do duplicar). Guarda defensiva de `nfe_uuid`
  // redundante com a visibilidade condicional da própria ação (linha 218),
  // mas mantida — mirror "Se a baixa já tiver NFe, mantenha o aviso".
  function handleEmitirNfeClick(item: StockWriteoffData) {
    if (item.nfe_uuid) {
      toaster.warning({
        title: text.nfeHandoff.alreadyEmittedWarning.title,
        description: text.nfeHandoff.alreadyEmittedWarning.description,
      });
      return;
    }
    navigate('/fiscal/nfe-emitidas/novo', {
      state: { stockWriteoffUuidForNfe: item.uuid },
    });
  }

  const columnHelper = createColumnHelper<StockWriteoffData>();
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
      columnHelper.accessor((row) => row.warehouse?.description ?? '', {
        id: 'warehouse',
        header: text.list.table.warehouse,
        cell: ({ row }) => (
          <Text fontSize="sm" lineClamp="1">
            {row.original.warehouse?.description || '—'}
          </Text>
        ),
        meta: styleColumTable.md,
      }),
      columnHelper.accessor('type_label', {
        header: text.list.table.type,
        cell: ({ row }) => <Text fontSize="sm">{row.original.type_label}</Text>,
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
              {/* TASK-FE-3006 — visível SOMENTE quando `nfe_uuid==null` (AM-008/RR-012). */}
              {canEmitNfe && row.original.nfe_uuid == null && (
                <Actions.Item
                  icon={<Icon as={FiFileText} />}
                  onClick={() => handleEmitirNfeClick(row.original)}
                >
                  {text.list.table.actions.emitNfe}
                </Actions.Item>
              )}
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
    [navigate, text, canDelete, canEmitNfe, isDeleting]
  );

  const isLoading = checkLoadingStatus([baixaEstoqueList]);
  const items = baixaEstoqueList.data?.data?.items;
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
              canCreate={canCreate}
              onCreate={() => navigate(`${BAIXA_ESTOQUE_LIST_ROUTE}/nova`)}
              canReport={canReport}
              onReport={() => navigate(`${BAIXA_ESTOQUE_LIST_ROUTE}/relatorio`)}
            />
          }
        >
          <PageHeader title={text.list.pageTitle} description={text.list.pageSubtitle} />
        </HeaderGrid>

        <Box mt={6}>
          <Table
            isLoading={isLoading}
            isError={baixaEstoqueList.isError}
            error={baixaEstoqueList.error}
            isEmpty={isEmpty}
            onRetry={() => baixaEstoqueList.refetch()}
            isRetrying={baixaEstoqueList.isFetching}
            emptyIcon={FiPackage as ElementType}
            emptyTitle={
              filtersApplied > 0 ? text.list.emptyState.titleFiltered : text.list.emptyState.title
            }
            emptyDescription={
              filtersApplied > 0
                ? text.list.emptyState.descriptionFiltered
                : text.list.emptyState.description
            }
            canCreate={filtersApplied === 0 && canCreate}
            createLabel={text.list.emptyState.cta}
            onCreate={() => navigate(`${BAIXA_ESTOQUE_LIST_ROUTE}/nova`)}
          />
        </Box>
      </TableProvider>

      <FilterSideBaixaEstoque
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
