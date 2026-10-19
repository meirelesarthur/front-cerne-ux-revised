// src/pages/Operacional/HarvestProduct/index.tsx
// -----------------------------------------------------------------------------
// Tela de LISTAGEM (grid) de COLHEITA DE FRUTAS — Operacional / Agricultura
// (F-040, execução 040, TASK-FE-1096). Item de menu novo, `ope-agr-col`,
// registrado na TASK-FE-1100.
//
// Rota: /operacional/colheita-frutas (guardada por `harvest-products_view`,
// registrada em src/router/index.tsx — este arquivo não mexe em rota/menu).
//
// Estrutura mirror direto de `ProtocoloEstacao/index.tsx`: `useCustomGridQuery`
// SEM ID de contexto + `FilterSideHarvestProduct` com re-hidratação +
// `useRequest` para exclusão.
//
// Filtro de data (`dateStart`/`dateEnd`) AGORA filtra de verdade (DIV-02
// corrigido no backend, contrato §7.10 D6/mandato do dono) — o front só
// precisa enviar `date_start`/`date_end` corretamente (feito no service).
// -----------------------------------------------------------------------------

import { useMemo, useState, type ElementType } from 'react';

import { Badge, Box, Flex, Icon, Text, useDisclosure, VStack } from '@chakra-ui/react';
import { createColumnHelper } from '@tanstack/react-table';
import { FiEdit, FiEye, FiPackage, FiTrash2 } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';

import { Actions } from '@/components/Action';
import { ContainerGrid } from '@/components/ContainerGrid';
import { DeleteConfirmDialog } from '@/components/DeleteConfirmDialog';
import { HeaderGrid } from '@/components/HeaderGrid';
import { Table } from '@/components/Table';
import { Tooltip } from '@/components/ui/tooltip';

import { TableProvider } from '@/contexts/TableContext';

import { useLanguage } from '@/hooks/useLanguage';
import { userPaginatedQuery } from '@/hooks/usePaginatedQueryStorage';
import { usePermissions } from '@/hooks/usePermissions';
import { useRequest } from '@/hooks/useRequest';

import { checkLoadingStatus } from '@/utils/checkLoadingStatus';
import formatDate from '@/utils/formatDate';
import { styleColumTable } from '@/utils/style-colum-table';

import { queryKey } from '@/constants/query-key';

import { deleteHarvestProduct } from '@/services/v2/HarvestProduct/harvestProduct-service';

import type { HarvestProductData, HarvestProductFilterRequest } from '@/@types/v2/HarvestProduct';

import { FilterSideHarvestProduct } from './FilterSideHarvestProduct';
import { HeaderTable } from './HeaderTable';
import { useHarvestProductsList } from './useHarvestProducts';

const HARVEST_PRODUCT_STORAGE_KEY =
  'OperacionalAgriculturaColheitaFrutas' + queryKey.harvestProducts.harvestProducts;
const HARVEST_PRODUCT_LIST_ROUTE = '/operacional/colheita-frutas';

// Formatação numérica (pt-BR, 2 casas) compartilhada entre "Peso Total" e
// cada linha do tooltip de caixas — mesmo arredondamento visual, sem truncar
// a precisão física de 5 casas que o backend guarda (`amount`/`total_weight`
// continuam string em `HarvestProductData`, só a EXIBIÇÃO arredonda).
function formatWeightValue(value: string): string {
  const parsed = Number(value);
  if (Number.isNaN(parsed)) return '—';
  return parsed.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatWeight(totalWeight: string): string {
  const formatted = formatWeightValue(totalWeight);
  return formatted === '—' ? formatted : `${formatted} Kg`;
}

export default function HarvestProductsList() {
  const { languageGB } = useLanguage();
  const navigate = useNavigate();
  const { can } = usePermissions();
  const text = languageGB.harvestProduct;

  const canView = can('harvest-products_view');
  const canEdit = can('harvest-products_edit');
  const canCreate = can('harvest-products_create');
  const canDelete = can('harvest-products_delete');

  const defaultQueryOptions = useMemo(
    () => ({
      pageSize: 10,
      storageKey: HARVEST_PRODUCT_STORAGE_KEY,
    }),
    []
  );

  const { paginatedQuery, handlePaginatedQuery, handleFilterChange, handleResetFilter } =
    userPaginatedQuery<HarvestProductFilterRequest>(defaultQueryOptions);

  // ---- Estado de filtro (drawer) ------------------------------------------
  const { open: isFilterOpen, onOpen: onOpenFilter, onClose: onCloseFilter } = useDisclosure();

  const filtersApplied = useMemo(
    () =>
      Object.values(paginatedQuery.filter ?? {}).filter(
        (v) => v !== undefined && v !== null && v !== ''
      ).length,
    [paginatedQuery.filter]
  );

  const harvestProductsList = useHarvestProductsList({
    paginatedQuery,
    setPaginatedQuery: handlePaginatedQuery,
    filter: paginatedQuery.filter ?? ({} as HarvestProductFilterRequest),
  });

  // ---- Estado de exclusão --------------------------------------------------
  const [toDelete, setToDelete] = useState<HarvestProductData | null>(null);
  const {
    open: isOpenDeleteDialog,
    onOpen: onOpenDeleteDialog,
    onClose: onCloseDeleteDialog,
  } = useDisclosure();

  const deleteMutation = useRequest({
    asyncFunction: async ({ uuid }: { uuid: string }) => {
      return await deleteHarvestProduct(uuid);
    },
    queryKey: queryKey.harvestProducts.harvestProducts,
    queryKey2: queryKey.harvestProducts.harvestProduct,
    typesRequest: 'update',
    entityName: text.singularLabel,
    personalizedMessage: text.toast.deleteSuccess,
    actionSuccess: () => {
      onCloseDeleteDialog();
      setToDelete(null);
    },
  });

  const isDeleting = deleteMutation.isPending;

  function handleDeleteClick(item: HarvestProductData) {
    setToDelete(item);
    onOpenDeleteDialog();
  }

  function handleConfirmDelete() {
    if (toDelete) {
      deleteMutation.mutate({ uuid: toDelete.uuid });
    }
  }

  const columnHelper = createColumnHelper<HarvestProductData>();
  const defaultColumns = useMemo(
    () => [
      columnHelper.accessor('code', {
        header: text.list.table.code,
        cell: ({ row }) => <Text fontWeight="medium">{row.original.code}</Text>,
        meta: styleColumTable.sm,
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
      // FID-G5 (execução 040) — ordem Produto→Área→Cliente casa com o
      // legado (`harvest-products/index.blade.php`); Cerne tinha
      // Cliente→Área→Produto. Só reordenação — conteúdo/render inalterados.
      columnHelper.display({
        id: 'product',
        header: text.list.table.product,
        cell: ({ row }) => (
          <Text fontSize="sm" color="fg.muted" lineClamp="1">
            {row.original.product?.description ?? '—'}
          </Text>
        ),
        meta: styleColumTable.md,
      }),
      columnHelper.display({
        id: 'area',
        header: text.list.table.area,
        cell: ({ row }) => (
          <Text fontSize="sm" color="fg.muted" lineClamp="1">
            {row.original.area?.description ?? '—'}
          </Text>
        ),
        meta: styleColumTable.md,
      }),
      columnHelper.display({
        id: 'client',
        header: text.list.table.client,
        cell: ({ row }) => (
          <Text fontSize="sm" lineClamp="1">
            {row.original.client?.name ?? '—'}
          </Text>
        ),
        meta: styleColumTable.md,
      }),
      columnHelper.display({
        id: 'boxesCount',
        header: text.list.table.boxesCount,
        // FID-G5 (execução 040, correção 3) — restaura o tooltip do legado
        // (`harvest-products/index.blade.php:95-101`, "Caixa N - X Kg" por
        // caixa). A API já eager-load `boxes` no index (`HarvestProductRepository`
        // + `HarvestProductResource.php:49`) — sem round-trip extra aqui.
        // `boxes` vazio/ausente (SEM MOCK) → mantém só o badge, sem Tooltip.
        cell: ({ row }) => {
          const badge = <Badge colorPalette="gray">{row.original.boxes_count}</Badge>;
          const boxes = row.original.boxes;

          if (!boxes || boxes.length === 0) return badge;

          return (
            <Tooltip
              content={
                <VStack align="flex-start" gap={0.5}>
                  {boxes.map((box, index) => (
                    <Text key={box.uuid} fontSize="xs">
                      {text.list.table.boxTooltipLabel
                        .replace('{n}', String(index + 1))
                        .replace('{amount}', formatWeightValue(box.amount))}
                    </Text>
                  ))}
                </VStack>
              }
            >
              <Box display="inline-block" cursor="default">
                {badge}
              </Box>
            </Tooltip>
          );
        },
        meta: styleColumTable.sm,
      }),
      columnHelper.display({
        id: 'totalWeight',
        header: text.list.table.totalWeight,
        cell: ({ row }) => (
          <Text fontSize="sm" color="fg.muted">
            {formatWeight(row.original.total_weight)}
          </Text>
        ),
        meta: styleColumTable.md,
      }),
      columnHelper.display({
        id: 'acoes',
        header: '',
        enableHiding: false,
        cell: ({ row }) => (
          <Flex justify="flex-end">
            <Actions size="sm">
              {canView && (
                <Actions.Item
                  icon={<Icon as={FiEye} />}
                  onClick={() => navigate(`${HARVEST_PRODUCT_LIST_ROUTE}/${row.original.uuid}`)}
                >
                  {text.list.actions.view}
                </Actions.Item>
              )}
              {canEdit && (
                <Actions.Item
                  icon={<Icon as={FiEdit} />}
                  onClick={() =>
                    navigate(`${HARVEST_PRODUCT_LIST_ROUTE}/${row.original.uuid}/editar`)
                  }
                >
                  {text.list.actions.edit}
                </Actions.Item>
              )}
              {canDelete && (
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
    [navigate, isDeleting, text, canView, canEdit, canDelete, languageGB.defaltStrings.actions]
  );

  const isLoading = checkLoadingStatus([harvestProductsList]);
  const items = harvestProductsList.data?.data?.items;
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
              {text.titleModule}
            </Text>
          </VStack>
        </HeaderGrid>

        <Box mt={6}>
          <Table
            isLoading={isLoading}
            isError={harvestProductsList.isError}
            error={harvestProductsList.error}
            isEmpty={isEmpty}
            onRetry={() => harvestProductsList.refetch()}
            isRetrying={harvestProductsList.isFetching}
            emptyIcon={FiPackage as ElementType}
            emptyTitle={
              filtersApplied > 0 ? text.list.emptyState.titleFiltered : text.list.emptyState.titleEmpty
            }
            emptyDescription={
              filtersApplied > 0
                ? text.list.emptyState.descriptionFiltered
                : text.list.emptyState.descriptionEmpty
            }
            canCreate={filtersApplied === 0 && canCreate}
            createLabel={text.list.emptyState.cta}
            onCreate={() => navigate(`${HARVEST_PRODUCT_LIST_ROUTE}/nova`)}
          />
        </Box>
      </TableProvider>

      <FilterSideHarvestProduct
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
        title={text.list.deleteDialog.title}
        itemName={toDelete?.code}
        tone="danger"
      />
    </ContainerGrid>
  );
}
