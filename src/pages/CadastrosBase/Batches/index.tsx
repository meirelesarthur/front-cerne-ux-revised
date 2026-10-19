// src/pages/CadastrosBase/Batches/index.tsx
// -----------------------------------------------------------------------------
// Tela de LISTAGEM (grid) de LOTES ANIMAIS — Cadastros Base / Pecuária.
// REGENERADA do zero (TASK-FE-1080) — a versão anterior importava
// componentes INEXISTENTES (`@/components` barrel, `InputForm`, `SideModal`,
// `FilterBadge`, `SearchBar`) e uma coluna "Qtd de Animais" lendo
// `quantity_animals`, campo que nunca existiu no `AnimalBatchResource` real.
//
// Rota: `/batches` (guardada por `batch_view`, registrada em
// `src/router/index.tsx` — este arquivo não mexe em rota/menu).
//
// Mesma estrutura mecânica de `Administrativo/Funcoes/index.tsx`/
// `CadastrosBase/CategoriasAnimais/index.tsx`: grid paginado (TableProvider +
// Table) via `useBatchesList`; `HeaderTable` (botão Add + filtro);
// `FilterSideBatches` (drawer, só `description` — contrato v1.1 §3, sem
// filtro de status, decisão consciente do dev); delete via `useRequest`
// (mensagem de erro é a que a API devolver — `resData.message`, mesmo padrão
// de `CategoriasAnimais/index.tsx`, sem texto genérico fixo); ação NOVA
// "Arquivar" (`GAP-FE-205`, `POST /animal-batches/{uuid}/archive`),
// condicional a `status === 'A'`.
//
// Status (badge): SOMENTE EXIBIÇÃO — fábrica `batchStatusOptions`/
// `batchStatusColor` (`TASK-FE-1075`). Não é campo do formulário em lugar
// nenhum do módulo (contrato v1.1 §3 — `status` fora das `rules()`).
//
// ⚠️ SEM coluna "Categorias" nesta grid — DECISÃO CONSCIENTE (atualização do
// condutor pós-entrega): `AnimalBatchResource::categories` só é preenchido em
// `show()` (`TASK-BE-958`, derivado dos animais vinculados via
// `animals.category`); o `index()` usa `withCount('animals')` no caminho
// quente e DELIBERADAMENTE não carrega/deriva `categories` (custo de N+1
// evitado). O legado (`agro365/resources/views/batches/index.blade.php:76-80`)
// também NÃO tem uma coluna "Categoria" — só Código/Descrição/Total de
// Animais (com tooltip de contagem por categoria via `quantity_animal_
// category`, dado que também não existe no contrato novo)/Status/Ações.
// Não improvisei um N+1 por linha nem deixei uma coluna vazia sem aviso —
// reportado ao condutor para decisão do Arquiteto (index passar a derivar
// `categories`, ou tooltip equivalente a `quantity_animal_category`, se
// julgado necessário).
//
// `total_animals` (coluna "Total de Animais"): confirmado pelo condutor
// (2026-08-04) — o legado sempre filtrou os animais do Lote por status
// Ativo/Pendente (`agro365/app/Batch.php:161-166`); a relação nova não
// filtrava e foi corrigida no backend. Consequência: para Lotes com
// histórico de animais mortos/vendidos/perdidos, este número é MENOR do que
// era antes — é correção de fidelidade, não bug. Exibido tal como a API
// devolve, sem nenhum recálculo local.
//
// `GAP-BE-485` (P0, em correção no momento desta entrega): os 2 Controllers
// deste módulo podem devolver 500 em qualquer request com `X-Farm-Id`
// (`$request->currentFarm->id` não resolve). Se o teste real bater 500, é
// esse defeito de backend — não é regressão desta tela, não compensado aqui
// (sem mock, sem estado de erro especial só pra tolerar 500).
// -----------------------------------------------------------------------------

import { useMemo, useState, type ElementType } from 'react';

import { Badge, Box, Flex, Icon, Text, useDisclosure, VStack } from '@chakra-ui/react';
import { createColumnHelper } from '@tanstack/react-table';
import { FiArchive, FiEdit, FiLayers, FiTrash2 } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';

import { Actions } from '@/components/Action';
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
import formatDate from '@/utils/formatDate';
import { styleColumTable } from '@/utils/style-colum-table';

import { batchStatusColor } from '@/constants/cadastrosBase/Batches/batch-status';
import { batchStatusOptions } from '@/constants/cadastrosBase/Batches/options/batch-status-options';
import { queryKey } from '@/constants/query-key';

import { deleteBatch } from '@/services/v2/Batches/batch-service';

import type { BatchData, BatchFilterForm } from '@/@types/v2/Batches';

import { FilterSideBatches } from './FilterSideBatches';
import { HeaderTable } from './HeaderTable';
import { useArchiveBatch, useBatchesList } from './useBatches';

export default function BatchesList() {
  const { languageGB } = useLanguage();
  const navigate = useNavigate();
  const { can } = usePermissions();
  const text = languageGB.batches.batch;

  const canCreate = can('batch_create');
  const canEdit = can('batch_edit');
  const canDelete = can('batch_delete');

  // Paginação universal (default 10, teto 100 — imposto pelo backend,
  // contrato v1.1 §3 M3).
  const defaultQueryOptions = useMemo(
    () => ({
      pageSize: 10,
      storageKey: 'CadastrosBaseBatches' + queryKey.batches.list,
    }),
    []
  );

  const { paginatedQuery, handlePaginatedQuery, handleFilterChange, handleResetFilter } =
    userPaginatedQuery<BatchFilterForm>(defaultQueryOptions);

  // ---- Estado de filtro (drawer) ------------------------------------------
  const { open: isFilterOpen, onOpen: onOpenFilter, onClose: onCloseFilter } = useDisclosure();

  const filtersApplied = useMemo(
    () =>
      Object.entries(paginatedQuery.filter ?? {})
        .filter(([key]) => !key.endsWith('_label'))
        .map(([, v]) => v)
        .filter((v) => v !== undefined && v !== null && v !== '' && v !== false).length,
    [paginatedQuery.filter]
  );

  const batchesList = useBatchesList({
    paginatedQuery,
    setPaginatedQuery: handlePaginatedQuery,
    filter: paginatedQuery.filter ?? undefined,
  });

  // ---- Estado de exclusão --------------------------------------------------
  const [toDelete, setToDelete] = useState<BatchData | null>(null);
  const {
    open: isOpenDeleteDialog,
    onOpen: onOpenDeleteDialog,
    onClose: onCloseDeleteDialog,
  } = useDisclosure();

  // `useRequest`'s `TypesRequest` não tem variante "delete" — "update" é a
  // opção compilável (mesma razão documentada em `CategoriasAnimais/index.tsx`:
  // o texto de sucesso vem de `personalizedMessage`). O `onError` GLOBAL do
  // hook já exibe a `message` do envelope de erro tal como a API devolver —
  // regra 3 do packet (mensagem NOMEADA do 422, nunca um texto genérico).
  const deleteMutation = useRequest({
    asyncFunction: async ({ uuid }: { uuid: string }) => {
      return await deleteBatch(uuid);
    },
    queryKey: queryKey.batches.list,
    queryKey2: queryKey.batches.detail,
    typesRequest: 'update',
    entityName: text.singularLabel,
    personalizedMessage: text.list.deletedToast,
    actionSuccess: () => {
      onCloseDeleteDialog();
      setToDelete(null);
    },
  });

  const handleDeleteClick = (item: BatchData) => {
    setToDelete(item);
    onOpenDeleteDialog();
  };

  const handleConfirmDelete = () => {
    if (toDelete) {
      deleteMutation.mutate({ uuid: toDelete.uuid });
    }
  };

  const isDeleting = deleteMutation.isPending;

  // ---- Estado da ação "Arquivar" (GAP-FE-205, nova) -----------------------
  const [toArchive, setToArchive] = useState<BatchData | null>(null);
  const {
    open: isOpenArchiveDialog,
    onOpen: onOpenArchiveDialog,
    onClose: onCloseArchiveDialog,
  } = useDisclosure();

  const archiveMutation = useArchiveBatch({
    onSuccess: () => {
      onCloseArchiveDialog();
      setToArchive(null);
    },
  });

  const handleArchiveClick = (item: BatchData) => {
    setToArchive(item);
    onOpenArchiveDialog();
  };

  const handleConfirmArchive = () => {
    if (toArchive) {
      archiveMutation.mutate(toArchive.uuid);
    }
  };

  const isArchiving = archiveMutation.isPending;

  const items = batchesList.data?.data?.items ?? [];

  const columnHelper = createColumnHelper<BatchData>();
  const defaultColumns = useMemo(
    () => [
      columnHelper.accessor('code', {
        header: text.list.table.code,
        cell: ({ row }) => (
          <Text fontWeight="medium" lineClamp="1">
            {row.original.code}
          </Text>
        ),
        meta: styleColumTable.sm,
      }),
      columnHelper.accessor('description', {
        header: text.list.table.description,
        cell: ({ row }) => (
          <Text fontWeight="medium" lineClamp="1">
            {row.original.description}
          </Text>
        ),
      }),
      columnHelper.accessor('date', {
        header: text.list.table.date,
        cell: ({ row }) => (
          <Text fontSize="sm" color="fg.muted">
            {formatDate(row.original.date)}
          </Text>
        ),
        meta: styleColumTable.date,
      }),
      columnHelper.accessor((row) => row.specie?.description ?? '', {
        id: 'specie',
        header: text.list.table.specie,
        cell: ({ row }) => (
          <Text fontSize="sm" color="fg.muted" lineClamp="1">
            {row.original.specie?.description ?? '—'}
          </Text>
        ),
        meta: styleColumTable.md,
      }),
      // SEM coluna "Categorias" — ver nota de topo do arquivo:
      // `AnimalBatchResource::categories` não é preenchido no `index()`
      // (só no `show()`, `TASK-BE-958`), e o legado também não tem essa
      // coluna na grid (só um tooltip de contagem por categoria sobre
      // "Total de Animais", dado que não existe no contrato novo). Reportado
      // ao condutor — não improvisado.
      columnHelper.accessor('status', {
        header: text.list.table.status,
        // Badge SOMENTE EXIBIÇÃO — `status` não é input em lugar nenhum do
        // módulo (contrato v1.1 §3).
        cell: ({ row }) => (
          <Badge
            colorPalette={batchStatusColor[row.original.status]}
            variant="subtle"
            py={1}
            px={3}
          >
            {batchStatusOptions.getLabel(row.original.status, languageGB)}
          </Badge>
        ),
        meta: styleColumTable.sm,
      }),
      columnHelper.accessor('total_animals', {
        header: text.list.table.totalAnimals,
        // `total_animals` SEMPRE presente no Resource real, mas a grid
        // renderiza sem crash mesmo se vier `undefined`/`0` (defesa
        // combinada com `GAP-FE-207`, pendência de integração declarada no
        // fechamento da Tarefa).
        cell: ({ row }) => (
          <Text fontSize="sm" color="fg.muted">
            {row.original.total_animals ?? 0}
          </Text>
        ),
        meta: styleColumTable.sm,
      }),
      columnHelper.display({
        id: 'acoes',
        header: '',
        cell: ({ row }) => (
          <Flex justify="flex-end">
            <Actions size="sm">
              {canEdit && (
                <Actions.Item
                  icon={<Icon as={FiEdit} />}
                  onClick={() => navigate(`/batches/${row.original.uuid}`)}
                >
                  {text.list.actions.edit}
                </Actions.Item>
              )}
              {canEdit && row.original.status === 'A' && (
                <Actions.Item
                  icon={<Icon as={FiArchive} />}
                  onClick={() => handleArchiveClick(row.original)}
                  disabled={isArchiving}
                >
                  {text.list.actions.archive}
                </Actions.Item>
              )}
              {canDelete && (
                <Actions.Item
                  icon={<Icon as={FiTrash2} />}
                  onClick={() => handleDeleteClick(row.original)}
                  color="red.400"
                  disabled={isDeleting}
                >
                  {text.list.actions.delete}
                </Actions.Item>
              )}
            </Actions>
          </Flex>
        ),
        meta: styleColumTable.sm,
      }),
    ],
    [navigate, isDeleting, isArchiving, canEdit, canDelete, text, languageGB]
  );

  const isLoading = checkLoadingStatus([batchesList]);
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
          </VStack>
        </HeaderGrid>

        <Box mt={6}>
          <Table
            isLoading={isLoading}
            isError={batchesList.isError}
            error={batchesList.error}
            isEmpty={isEmpty}
            onRetry={() => batchesList.refetch()}
            isRetrying={batchesList.isFetching}
            retryLabel={languageGB.defaltStrings.tryAgain}
            emptyIcon={FiLayers as ElementType}
            emptyTitle={
              filtersApplied > 0
                ? text.list.emptyState.titleFiltered
                : canCreate
                  ? text.list.emptyState.titleEmpty
                  : text.list.emptyState.titleEmptyNoCreate
            }
            emptyDescription={
              filtersApplied > 0
                ? text.list.emptyState.descriptionFiltered
                : canCreate
                  ? text.list.emptyState.descriptionEmpty
                  : text.list.emptyState.descriptionEmptyNoCreate
            }
            canCreate={filtersApplied === 0 && canCreate}
            createLabel={text.list.emptyState.cta}
            onCreate={() => navigate('/batches/novo')}
          />
        </Box>
      </TableProvider>

      <FilterSideBatches
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
        itemName={toDelete?.description}
      />

      <DeleteConfirmDialog
        isOpen={isOpenArchiveDialog}
        onClose={() => {
          onCloseArchiveDialog();
          setToArchive(null);
        }}
        onConfirm={handleConfirmArchive}
        isLoading={isArchiving}
        title={text.archiveConfirm.title}
        itemName={toArchive?.description}
        description={text.archiveConfirm.description}
        warningText={text.archiveConfirm.warning}
        confirmButtonText={text.list.actions.archive}
        colorPalette="orange"
        tone="warning"
      />
    </ContainerGrid>
  );
}
