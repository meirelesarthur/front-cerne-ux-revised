// src/pages/BaseRegistrations/BatchAreas/index.tsx
// -----------------------------------------------------------------------------
// Tela de LISTAGEM (grid FLAT — sem hierarquia, COM paginação REAL, COM os 2
// filtros restaurados — Lote/Área) do vínculo Lote/Área (BatchArea) —
// Cadastros Base / Pecuários. Rota: /cadastros-base/lote-area (guardada por
// `batch_area_view`, já registrada em `router/index.tsx`, TASK-FE-2104).
//
// FILTRO restaurado (TASK-FRONT-1, esteira 063-est03-9-reprovacoes, roteiro
// `lote-area-f143-roteiro.md §2`) — a migração original (execução 029) tinha
// omitido deliberadamente o filtro nesta tela (mirror `BatchGrazings/
// index.tsx`), decisão que a reprovação do dono reverte SÓ para Lote/Área —
// `BatchGrazings` (módulo irmão) permanece SEM filtro. `FilterSideBatchAreas`
// (Contrato B) + `toRequestFilter` (Option → uuid) mirror `WarehouseTransfer/
// index.tsx`/`Nutrition/index.tsx`.
//
// Ações de linha: SÓ Visualizar (`FiEye`, navega para `/:uuid`) + Excluir
// (`FiTrash2`) — SEM Editar (a API não tem `PUT`/`PATCH`, D1 do contrato de
// API `contrato-lote-area.md`) — intencional, não remover o ícone "por
// engano" depois.
//
// Colunas usam os agregados de ÍNDICE do backend (`animals_quantity`/
// `ua_total`/`taxa_lotacao_ua`), DIFERENTES dos agregados de visualização
// consumidos por `BatchAreaDetalhe.tsx` — mesma nota do contrato de API §7
// ("índice legado usa agregados diferentes do show()"), preservada
// deliberadamente.
//
// Exclusão: `useMutation` DIRETO (TanStack), NÃO `useRequest` — mirror da
// convenção do projeto (`Grazings/index.tsx`/`BatchGrazings/index.tsx`). Sem
// 422 estruturado de bloqueio documentado para esta feature — o `onError`
// genérico basta. NÃO-DESTRUTIVA: o backend encerra o vínculo com registro
// de saída, nunca apaga histórico (D12 do contrato de API) — por isso o
// diálogo usa a cópia de `baseRegistrations.batchArea.deleteDialog`, NÃO o
// texto genérico "esta ação não pode ser desfeita".
// -----------------------------------------------------------------------------

import { ElementType, useMemo, useState } from 'react';

import { Badge, Box, Flex, Icon, Text, useDisclosure } from '@chakra-ui/react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createColumnHelper } from '@tanstack/react-table';
import { FiEye, FiLink2, FiTrash2 } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';

import { Actions } from '@/components/Action';
import { ContainerGrid } from '@/components/ContainerGrid';
import { DeleteConfirmDialog } from '@/components/DeleteConfirmDialog';
import { HeaderGrid } from '@/components/HeaderGrid';
import { Table } from '@/components/Table';
import { toaster } from '@/components/ui/toaster';

import { TableProvider } from '@/contexts/TableContext';

import { useGridSettings } from '@/hooks/useGridSettings';
import { useGridStorageScope } from '@/hooks/useGridStorageScope';
import { useLanguage } from '@/hooks/useLanguage';
import { userPaginatedQuery } from '@/hooks/usePaginatedQueryStorage';
import { usePermissions } from '@/hooks/usePermissions';

import { checkLoadingStatus } from '@/utils/checkLoadingStatus';
import { extractApiErrorMessage } from '@/utils/extractApiErrorMessage';
import formatDate from '@/utils/formatDate';
import { styleColumTable } from '@/utils/style-colum-table';

import { queryKey } from '@/constants/query-key';

import { deleteBatchArea } from '@/services/v2/BaseRegistrations/batch-areas-service';

import type {
  BatchAreaFilterForm,
  BatchAreaFilterRequest,
  BatchAreaListItem,
} from '@/@types/v2/BaseRegistrations/batch-areas';

import { FilterSideBatchAreas } from './FilterSideBatchAreas';
import { HeaderTable } from './HeaderTable';
import { useBatchAreaList } from './useBatchAreas';

import { PageHeader } from '@/components/ui/PageHeader';

// Chave de storage desta tela — paginação (`userPaginatedQuery`) e
// personalização de grid (`useGridSettings`) derivam da MESMA expressão
// estável, mirror `BatchGrazings/index.tsx` (`BATCH_GRAZINGS_STORAGE_KEY`).
const BATCH_AREAS_STORAGE_KEY = 'BaseRegistrationsBatchAreas' + queryKey.batchAreas.batchAreasList;

// Quantos lotes exibir como badge antes de agrupar em "+N" — mirror da
// convenção de truncamento do contrato de tela (`contrato-fe-lote-area.md
// §2`, "Lotes vinculados (badges truncados)").
const MAX_VISIBLE_BATCH_BADGES = 3;

// Achatamento `BatchAreaFilterForm` (Option-based, TASK-FRONT-1) →
// `BatchAreaFilterRequest` (querystring real de `GET /batch-areas`) — mirror
// `WarehouseTransferList::toRequestFilter`/`NutritionList::toRequestFilter`.
function toRequestFilter(filter?: BatchAreaFilterForm | null): BatchAreaFilterRequest {
  return {
    area_uuid: filter?.area_uuid?.value || undefined,
    batch_uuid: filter?.batch_uuid?.value || undefined,
  };
}

export default function BatchAreasList() {
  const { languageGB } = useLanguage();
  const navigate = useNavigate();
  const { can } = usePermissions();
  const text = languageGB.baseRegistrations.batchArea;

  const canDelete = can('batch_area_delete');

  const defaultQueryOptions = useMemo(
    () => ({
      pageSize: 10,
      storageKey: BATCH_AREAS_STORAGE_KEY,
    }),
    []
  );

  // pageSize 10 = paginação REAL, per_page dinâmico. Filtro Option-based
  // (`BatchAreaFilterForm`, TASK-FRONT-1) — mirror `WarehouseTransfer/
  // Nutrition`.
  const { paginatedQuery, handlePaginatedQuery, handleFilterChange, handleResetFilter } =
    userPaginatedQuery<BatchAreaFilterForm>(defaultQueryOptions);

  // ---- Estado de filtro (drawer) -------------------------------------------
  const { open: isFilterOpen, onOpen: onOpenFilter, onClose: onCloseFilter } = useDisclosure();

  const filtersApplied = useMemo(
    () =>
      Object.values(paginatedQuery.filter ?? {}).filter(
        (v) => v !== undefined && v !== null && v !== ''
      ).length,
    [paginatedQuery.filter]
  );

  const requestFilter = useMemo(
    () => toRequestFilter(paginatedQuery.filter),
    [paginatedQuery.filter]
  );

  // ---- Estado de exclusão --------------------------------------------------
  const queryClient = useQueryClient();
  const [toDelete, setToDelete] = useState<BatchAreaListItem | null>(null);
  const {
    open: isOpenDeleteDialog,
    onOpen: onOpenDeleteDialog,
    onClose: onCloseDeleteDialog,
  } = useDisclosure();

  const batchAreasList = useBatchAreaList({
    paginatedQuery,
    setPaginatedQuery: handlePaginatedQuery,
    filter: requestFilter,
  });

  // `useMutation` DIRETO (não `useRequest`) — mirror `Grazings/index.tsx`/
  // `BatchGrazings/index.tsx`. NÃO-destrutiva: o backend fecha o vínculo com
  // registro de saída, nunca apaga histórico (D12 do contrato de API).
  const deleteMutation = useMutation({
    mutationFn: async (batchAreaUuid: string) => await deleteBatchArea(batchAreaUuid),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [queryKey.batchAreas.batchAreasList] });

      toaster.success({
        title: text.singularLabel,
        description: text.list.deletedToast,
        duration: 7000,
      });

      onCloseDeleteDialog();
      setToDelete(null);
    },
    onError: (error) => {
      console.error('BatchArea delete - error:', error);

      const errorMessage = extractApiErrorMessage(error) ?? languageGB.common.errorLog.unknownError;
      toaster.error({
        title: text.singularLabel,
        description: errorMessage,
        duration: 7000,
      });
    },
  });

  const isDeleting = deleteMutation.isPending;

  const handleDeleteClick = (batchArea: BatchAreaListItem) => {
    setToDelete(batchArea);
    onOpenDeleteDialog();
  };

  const handleConfirmDelete = () => {
    if (toDelete) {
      deleteMutation.mutate(toDelete.uuid);
    }
  };

  const columnHelper = createColumnHelper<BatchAreaListItem>();
  const defaultColumns = useMemo(
    () => [
      columnHelper.accessor('code', {
        header: text.list.table.code,
        enableHiding: false,
        meta: { gridLabel: text.list.table.code },
        cell: ({ row }) => <Text fontWeight="medium">{row.original.code}</Text>,
      }),
      // `area` sempre vem eager-carregada (é a raiz do agrupamento do
      // índice, contrato de API §1.2 item 3 — só Áreas com ≥1 lote
      // vinculado aparecem) — sem necessidade de `?.` defensivo aqui.
      columnHelper.accessor((row) => row.area.description, {
        id: 'area',
        header: text.list.table.area,
        enableHiding: false,
        meta: { gridLabel: text.list.table.area },
        cell: ({ row }) => (
          <Text fontWeight="medium" lineClamp="1">
            {row.original.area.description}
          </Text>
        ),
      }),
      // Lotes vinculados — badges truncadas em `MAX_VISIBLE_BATCH_BADGES` +
      // "+N" (contrato de tela §2).
      columnHelper.accessor('batches', {
        header: text.list.table.batches,
        meta: { gridLabel: text.list.table.batches },
        cell: ({ row }) => {
          const batches = row.original.batches;
          const visible = batches.slice(0, MAX_VISIBLE_BATCH_BADGES);
          const remaining = batches.length - visible.length;
          return (
            <Flex gap={1} wrap="wrap">
              {visible.map((batch) => (
                <Badge key={batch.uuid} colorPalette="gray" variant="subtle">
                  {batch.description}
                </Badge>
              ))}
              {remaining > 0 && (
                <Badge colorPalette="gray" variant="outline">
                  +{remaining}
                </Badge>
              )}
            </Flex>
          );
        },
      }),
      columnHelper.accessor('date', {
        header: text.list.table.date,
        meta: { gridLabel: text.list.table.date },
        cell: ({ row }) => (
          <Text fontSize="sm" color="fg.muted">
            {formatDate(row.original.date)}
          </Text>
        ),
      }),
      // `employee` pode vir `null`/ausente — a coluna física `employee_id`
      // nunca é preenchida por este fluxo (D11 do contrato de API), acesso
      // SEMPRE via `?.`, placeholder "—" sem quebrar a renderização.
      columnHelper.accessor((row) => row.employee?.name, {
        id: 'employee',
        header: text.list.table.employee,
        meta: { gridLabel: text.list.table.employee },
        cell: ({ row }) => (
          <Text fontSize="sm" color={row.original.employee?.name ? undefined : 'fg.muted'}>
            {row.original.employee?.name ?? '—'}
          </Text>
        ),
      }),
      // Métricas do backend — `0` é valor legítimo (vínculo recém-criado com
      // poucos animais), NUNCA `campo || '-'`, checagem explícita de
      // `null`/`undefined` (mesmo cuidado de `Grazings/index.tsx`).
      columnHelper.accessor('animals_quantity', {
        header: text.list.table.animalQuantity,
        meta: { ...styleColumTable.sm, gridLabel: text.list.table.animalQuantity },
        cell: ({ row }) => (
          <Text fontSize="sm">
            {row.original.animals_quantity === null || row.original.animals_quantity === undefined
              ? '—'
              : row.original.animals_quantity}
          </Text>
        ),
      }),
      columnHelper.accessor('ua_total', {
        header: text.list.table.uaQuantity,
        meta: { ...styleColumTable.sm, gridLabel: text.list.table.uaQuantity },
        cell: ({ row }) => (
          <Text fontSize="sm">
            {row.original.ua_total === null || row.original.ua_total === undefined
              ? '—'
              : row.original.ua_total}
          </Text>
        ),
      }),
      columnHelper.accessor('taxa_lotacao_ua', {
        header: text.list.table.stockingRate,
        meta: { ...styleColumTable.sm, gridLabel: text.list.table.stockingRate },
        cell: ({ row }) => (
          <Text fontSize="sm">
            {row.original.taxa_lotacao_ua === null || row.original.taxa_lotacao_ua === undefined
              ? '—'
              : row.original.taxa_lotacao_ua}
          </Text>
        ),
      }),
      columnHelper.display({
        id: 'acoes',
        header: '',
        cell: ({ row }) => (
          <Flex justify="flex-end">
            <Actions size="sm">
              <Actions.Item
                icon={<Icon as={FiEye} />}
                onClick={() => navigate(`/cadastros-base/lote-area/${row.original.uuid}`)}
              >
                {text.list.actions.view}
              </Actions.Item>
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
        meta: {
          ...styleColumTable.sm,
          gridLabel: languageGB.defaltStrings.actions,
          gridOrder: 'fixed-end',
          gridDataColumn: false,
        },
      }),
    ],
    [navigate, isDeleting, languageGB, text, canDelete]
  );

  const gridSettings = useGridSettings<BatchAreaListItem>({
    storageKey: BATCH_AREAS_STORAGE_KEY,
    storageScope: useGridStorageScope(),
    columns: defaultColumns,
  });
  const { columnOrder, setColumnOrder, columnVisibility, setColumnVisibility } = gridSettings;

  const isLoading = checkLoadingStatus([batchAreasList]);
  const items = batchAreasList.data?.data?.items;
  const isEmpty = !isLoading && (items?.length ?? 0) === 0;

  return (
    <ContainerGrid>
      <TableProvider
        data={items}
        columns={defaultColumns}
        pagination={paginatedQuery}
        setPagination={handlePaginatedQuery}
        enableMultiRowSelection={false}
        columnOrder={columnOrder}
        onColumnOrderChange={setColumnOrder}
        columnVisibility={columnVisibility}
        setColumnVisibility={setColumnVisibility}
      >
        <HeaderGrid
          header={
            <HeaderTable
              onOpenFilter={onOpenFilter}
              filtersApplied={filtersApplied}
              languageGB={languageGB}
              gridSettings={gridSettings}
            />
          }
        >
          <PageHeader title={text.list.pageTitle} description={text.list.pageSubtitle} />
        </HeaderGrid>

        <Box mt={6}>
          <Table
            isLoading={isLoading}
            isError={batchAreasList.isError}
            error={batchAreasList.error}
            isEmpty={isEmpty}
            onRetry={() => batchAreasList.refetch()}
            isRetrying={batchAreasList.isFetching}
            emptyIcon={FiLink2 as ElementType}
            emptyTitle={text.list.emptyState.titleEmpty}
            emptyDescription={text.list.emptyState.descriptionEmpty}
            canCreate={can('batch_area_create')}
            createLabel={text.list.emptyState.cta}
            onCreate={() => navigate('/cadastros-base/lote-area/novo')}
          />
        </Box>
      </TableProvider>

      <FilterSideBatchAreas
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
        title={text.deleteDialog.title}
        description={text.deleteDialog.description}
        warningText={text.deleteDialog.warningText}
        confirmButtonText={text.deleteDialog.confirm}
        itemName={toDelete ? `${toDelete.area.description} (${toDelete.code})` : undefined}
        hideQuestionMark
        tone="warning"
      />
    </ContainerGrid>
  );
}
