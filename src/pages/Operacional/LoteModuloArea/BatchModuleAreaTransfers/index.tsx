// src/pages/Operacional/LoteModuloArea/BatchModuleAreaTransfers/index.tsx
// -----------------------------------------------------------------------------
// Tela de LISTAGEM (grid) de "Lote/Módulo/Área" (BatchModuleAreaTransfer —
// Operacional > Pecuária > Transferências, 97-Esteiras/070, TASK-LMA-FE-02).
// Rota `/operacional/lote-modulo-area/transferencias`, guardada por
// `<RequirePermission permission="batch_module_area_transfers_view">`.
//
// UX-GAP confirmado (`F-023-lote-modulo-area-frontend-contract.md`, sem
// página 1:1 no `ux_root`) — segue o padrão vigente do design system `cerne`
// (catálogo `get_pwa_ui_components_pattern`) + o precedente REAL
// `Operacional/LoteFazenda/TransferBatchFarms/index.tsx` (mesmo módulo pai,
// mesma convenção de nomes), adaptado (não copiado).
//
// Filtro ÚNICO por Lote (`batch_uuid`), aplicado INLINE no header da grid —
// SEM `FilterSide`/drawer completo (decisão herdada, contrato de tela `## 4.1`,
// não reabrir sem Gap). Reusa `listBatchOptions` (Lotes ATIVOS,
// `statuses: ['ACTIVE']`, mirror `Separations/FilterSideSeparations.tsx`) —
// nenhum service novo de Lote foi criado.
//
// Estados: loading (Skeleton via `checkLoadingStatus` no `<Table>`), error
// (mensagem + retry — `isError` NUNCA mascarado como vazio, mirror da
// correção anti-regressão já aplicada em Compartilhamento), empty (grid
// vazia com `EmptyState`, só quando NÃO há erro), success (grid populada).
// Light+dark via tokens semânticos do tema — sem hex fixo.
//
// ⚠️ NÃO confundir com a rota já migrada `/cadastros-base/lote-modulo`
// (feature-irmã "Lote/Módulo", cadastro base, módulo/tarefa DIFERENTE) — esta
// tela é uma OPERAÇÃO de transferência (Curral incluso), classificada em
// Operacional, 5º item do grupo "Transferências".
// -----------------------------------------------------------------------------

import { useMemo, useState } from 'react';

import { Box, EmptyState, Flex, HStack, Icon, Text, VStack } from '@chakra-ui/react';
import { createColumnHelper } from '@tanstack/react-table';
import { FiAlertCircle, FiRepeat } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';

import { Actions } from '@/components/Action';
import { Button } from '@/components/Button';
import { ContainerGrid } from '@/components/ContainerGrid';
import { SelectAsyncPaginate } from '@/components/Form/SelectAsyncPaginate';
import { HeaderGrid } from '@/components/HeaderGrid';
import { Table } from '@/components/Table';

import { TableProvider } from '@/contexts/TableContext';

import { useLanguage } from '@/hooks/useLanguage';
import { userPaginatedQuery } from '@/hooks/usePaginatedQueryStorage';
import { usePermissions } from '@/hooks/usePermissions';

import { checkLoadingStatus } from '@/utils/checkLoadingStatus';
import { styleColumTable } from '@/utils/style-colum-table';

import { queryKey } from '@/constants/query-key';

import { listBatchOptions } from '@/services/v2/Batches/batch-service';

import type { Option } from '@/@types/option';
import type { BatchOption } from '@/@types/v2/Batches';
import type { BatchModuleAreaTransferListItem } from '@/@types/v2/LoteModuloArea/batchModuleAreaTransfer';

import {
  useBatchModuleAreaTransfersList,
  type BatchModuleAreaTransferFilter,
} from './useBatchModuleAreaTransfers';

const BATCH_MODULE_AREA_TRANSFERS_STORAGE_KEY =
  'OperacionalLoteModuloArea' + queryKey.batchModuleAreaTransfer.transfers;

export default function BatchModuleAreaTransfersList() {
  const { languageGB } = useLanguage();
  const navigate = useNavigate();
  const { can } = usePermissions();
  const text = languageGB.loteModuloArea.batchModuleAreaTransfer;

  const canCreate = can('batch_module_area_transfers_create');

  const defaultQueryOptions = useMemo(
    () => ({ pageSize: 10, storageKey: BATCH_MODULE_AREA_TRANSFERS_STORAGE_KEY }),
    []
  );

  const { paginatedQuery, handlePaginatedQuery, handleFilterChange, handleResetFilter } =
    userPaginatedQuery<BatchModuleAreaTransferFilter>(defaultQueryOptions);

  // Select LOCAL do filtro inline (AM-1/AM-2 do legado) — só é aplicado à
  // grid quando o usuário clica "Filtrar" (`handleFilterChange`), mirror do
  // botão explícito do legado (não filtra a cada `onChange`).
  const [selectedBatch, setSelectedBatch] = useState<Option<string> | null>(null);

  function handleApplyFilter() {
    handleFilterChange({ batch_uuid: selectedBatch?.value || undefined });
  }

  function handleClearFilter() {
    setSelectedBatch(null);
    handleResetFilter();
  }

  const batchModuleAreaTransfersList = useBatchModuleAreaTransfersList({
    paginatedQuery,
    setPaginatedQuery: handlePaginatedQuery,
  });

  const columnHelper = createColumnHelper<BatchModuleAreaTransferListItem>();
  const defaultColumns = useMemo(
    () => [
      columnHelper.accessor('code', {
        header: text.list.table.code,
        cell: ({ row }) => (
          <Text fontFamily="mono" fontSize="sm" fontWeight="medium">
            {row.original.code}
          </Text>
        ),
        meta: { ...styleColumTable.sm, gridLabel: text.list.table.code },
      }),
      columnHelper.accessor('description', {
        header: text.list.table.description,
        enableHiding: false,
        cell: ({ row }) => <Text fontSize="sm">{row.original.description}</Text>,
        meta: { gridLabel: text.list.table.description },
      }),
      columnHelper.accessor('animals_count', {
        header: text.list.table.animalsCount,
        cell: ({ row }) => <Text fontSize="sm">{row.original.animals_count}</Text>,
        meta: { ...styleColumTable.sm, gridLabel: text.list.table.animalsCount },
      }),
      columnHelper.accessor('current_link', {
        header: text.list.table.currentLink,
        cell: ({ row }) => (
          <Text fontSize="sm" color="fg.muted">
            {row.original.current_link ?? text.list.table.noCurrentLink}
          </Text>
        ),
        meta: { gridLabel: text.list.table.currentLink },
      }),
      columnHelper.display({
        id: 'acoes',
        header: '',
        enableHiding: false,
        cell: ({ row }) => {
          if (!canCreate) return null;
          return (
            <Flex justify="flex-end">
              <Actions size="sm">
                <Actions.Item
                  onClick={() =>
                    navigate(`/operacional/lote-modulo-area/transferencias/${row.original.uuid}`)
                  }
                >
                  {text.list.actions.edit}
                </Actions.Item>
              </Actions>
            </Flex>
          );
        },
        meta: {
          ...styleColumTable.sm,
          gridLabel: languageGB.defaltStrings.actions,
          gridOrder: 'fixed-end',
          gridDataColumn: false,
        },
      }),
    ],
    [navigate, text, languageGB, canCreate]
  );

  const isLoading = checkLoadingStatus([batchModuleAreaTransfersList]);
  const isError = batchModuleAreaTransfersList.isError;
  const items = batchModuleAreaTransfersList.data?.data?.items;
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
          header={
            <HStack gap={2} align="flex-end" flexWrap="wrap">
              <Box minW="240px">
                <SelectAsyncPaginate
                  name="batch_filter"
                  label={text.list.filter.batch}
                  placeholder={text.list.filter.batchPlaceholder}
                  service={(params) => listBatchOptions({ ...params, statuses: ['ACTIVE'] })}
                  mapOptions={(item: BatchOption) => ({ label: item.label, value: item.uuid })}
                  findParams={(search: string | { search: string }) => ({
                    search: typeof search === 'string' ? search : search.search,
                  })}
                  value={selectedBatch}
                  onChange={(option: any) => setSelectedBatch(option ?? null)}
                />
              </Box>
              <Button title={text.list.actions.filter} onClick={handleApplyFilter} />
              <Button
                title={text.list.actions.clearFilter}
                variant="outline"
                onClick={handleClearFilter}
              />
            </HStack>
          }
        >
          <VStack align="flex-start" gap={1}>
            <Text fontSize="2xl" fontWeight="bold" color="brandColorText">
              {text.list.pageTitle}
            </Text>
          </VStack>
        </HeaderGrid>

        <Box mt={6}>
          {isError ? (
            <VStack gap={3} py={12} borderTop="1px solid" borderColor="borderGrid">
              <Icon as={FiAlertCircle} boxSize={8} color="red.400" />
              <Text color="fg.muted">{text.list.error.message}</Text>
              <Button
                variant="outline"
                title={text.list.error.retry}
                onClick={() => batchModuleAreaTransfersList.refetch()}
              />
            </VStack>
          ) : isEmpty ? (
            <EmptyState.Root>
              <EmptyState.Content>
                <EmptyState.Indicator>
                  <Icon as={FiRepeat} boxSize={8} color="fg.muted" />
                </EmptyState.Indicator>
                <VStack textAlign="center" gap={1}>
                  <EmptyState.Title>{text.list.emptyState.titleEmpty}</EmptyState.Title>
                  <EmptyState.Description>
                    {text.list.emptyState.descriptionEmpty}
                  </EmptyState.Description>
                </VStack>
              </EmptyState.Content>
            </EmptyState.Root>
          ) : (
            <Table isLoading={isLoading} />
          )}
        </Box>
      </TableProvider>
    </ContainerGrid>
  );
}
