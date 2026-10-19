// src/pages/Operacional/Processamentos/index.tsx
// -----------------------------------------------------------------------------
// Tela de LISTAGEM (grid) de Processamentos — Operacional > Pecuária
// (Processing, 97-Esteiras/039, TASK-FE-039-PROC-02). Rota
// `/operacional/processamentos`, gate `processing_view`.
//
// Mirror estrutural de `Operacional/Nascimentos/index.tsx` (grid + drawer de
// filtro Contrato B). SEM ação de criação/exclusão — a API só expõe
// index/show/finish (front-plan-proc.md §1.1); os processamentos nascem
// automaticamente das origens do rebanho.
//
// Contrato de acesso V3 (get_pwa_grid_query_pattern) — `data?.data?.items` +
// `pagination.total_pages`, NUNCA `data?.data?.data`.
//
// Badge de status via `processingStatusColor` (client-side — o servidor NÃO
// expõe cor, só `status_label`; mirror `ProcessingStatus::color()` real).
//
// Ação "Finalizar" visível só em linhas `PENDING` + `processing_create`;
// "Visualizar" sempre, com `processing_view` (DoD da Tarefa).
// -----------------------------------------------------------------------------

import { useMemo, useState } from 'react';
import type { ElementType } from 'react';

import { Badge, Box, Flex, Icon, Text, useDisclosure, VStack } from '@chakra-ui/react';
import { createColumnHelper } from '@tanstack/react-table';
import { FiCheckCircle, FiEye, FiFileText, FiXCircle } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';

import { Actions } from '@/components/Action';
import { ContainerGrid } from '@/components/ContainerGrid';
import { HeaderGrid } from '@/components/HeaderGrid';
import { ModalAction } from '@/components/ModalAction';
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

import {
  processingStatus,
  processingStatusColor,
} from '@/constants/processamentos/processing/processing-status';
import { queryKey } from '@/constants/query-key';

import {
  cancelProcessing,
  getAllProcessings,
} from '@/services/v2/Processamentos/processing-service';
import type { ListProcessingsParams } from '@/services/v2/Processamentos/processing-service';

import type {
  ProcessingDetail,
  ProcessingFilterRequest,
  ProcessingListItem,
} from '@/@types/v2/Processamentos/processing';

import { FilterSideProcessing } from './FilterSideProcessing';
import { HeaderTable } from './HeaderTable';

const PROCESSAMENTOS_STORAGE_KEY =
  'OperacionalProcessamentos' + queryKey.processamentos.processings;

export default function ProcessingList() {
  const { languageGB } = useLanguage();
  const navigate = useNavigate();
  const { can } = usePermissions();
  const text = languageGB.processamentos.processing;

  const canView = can('processing_view');
  const canFinish = can('processing_create');
  const canCancel = can('processing_delete');

  const [cancelTargetUuid, setCancelTargetUuid] = useState('');
  const { open: isCancelOpen, onOpen: onOpenCancel, onClose: onCloseCancel } = useDisclosure();

  const cancelMutation = useRequest<ProcessingDetail>({
    asyncFunction: async (targetUuid: string) => cancelProcessing(targetUuid),
    typesRequest: 'apply',
    entityName: text.singularLabel,
    personalizedMessage: text.list.cancelToast,
    queryKey: queryKey.processamentos.processings,
    queryKey2: queryKey.processamentos.processing,
    actionSuccess: () => setCancelTargetUuid(''),
  });

  function handleCancelProcessing() {
    if (!cancelTargetUuid) return;
    cancelMutation.mutate(cancelTargetUuid);
  }

  const defaultQueryOptions = useMemo(
    () => ({
      pageSize: 10,
      storageKey: PROCESSAMENTOS_STORAGE_KEY,
    }),
    []
  );

  const { paginatedQuery, handlePaginatedQuery, handleFilterChange, handleResetFilter } =
    userPaginatedQuery<ProcessingFilterRequest>(defaultQueryOptions);

  const { open: isFilterOpen, onOpen: onOpenFilter, onClose: onCloseFilter } = useDisclosure();

  const filtersApplied = useMemo(
    () =>
      Object.values(paginatedQuery.filter ?? {}).filter(
        (value) => value !== undefined && value !== null && value !== ''
      ).length,
    [paginatedQuery.filter]
  );

  // REWORK (039, PROC-09, FD-R2 desbloqueada) — `batch_uuid`/`area_uuid`/
  // `grazing_uuid` agora aceitos pelo `index` (resolvidos para id interno
  // server-side, `ProcessingRepository`); nunca id sequencial.
  const processingsList = useCustomGridQuery<ProcessingListItem, ListProcessingsParams>({
    asyncFunction: getAllProcessings,
    queryKey: queryKey.processamentos.processings,
    paginatedQuery,
    setPaginatedQuery: handlePaginatedQuery,
    filterQuery: [],
    filter: {
      status: paginatedQuery.filter?.status,
      batch_uuid: paginatedQuery.filter?.batch_uuid,
      area_uuid: paginatedQuery.filter?.area_uuid,
      grazing_uuid: paginatedQuery.filter?.grazing_uuid,
    },
  });

  const columnHelper = createColumnHelper<ProcessingListItem>();
  const defaultColumns = useMemo(
    () => [
      columnHelper.accessor('code', {
        header: text.list.columns.code,
        cell: ({ row }) => (
          <Text fontFamily="mono" fontSize="sm" fontWeight="medium">
            {row.original.code}
          </Text>
        ),
        meta: styleColumTable.sm,
      }),
      columnHelper.accessor('date', {
        header: text.list.columns.date,
        cell: ({ row }) => (
          <Text fontSize="sm" color="fg.muted">
            {row.original.date ? formatDate(row.original.date, 'dd/MM/yyyy') : '—'}
          </Text>
        ),
        meta: styleColumTable.date,
      }),
      columnHelper.accessor('type_label', {
        header: text.list.columns.type,
        cell: ({ row }) => <Text fontSize="sm">{row.original.type_label}</Text>,
      }),
      columnHelper.accessor('quantity', {
        header: text.list.columns.quantity,
        cell: ({ row }) => <Text fontSize="sm">{row.original.quantity}</Text>,
        meta: styleColumTable.sm,
      }),
      columnHelper.accessor('status', {
        header: text.list.columns.status,
        cell: ({ row }) => (
          <Badge
            colorPalette={processingStatusColor[row.original.status] ?? 'gray'}
            variant="subtle"
          >
            {row.original.status_label}
          </Badge>
        ),
        meta: styleColumTable.sm,
      }),
      columnHelper.display({
        id: 'acoes',
        header: '',
        enableHiding: false,
        enableSorting: false,
        cell: ({ row }) => (
          <Flex justify="flex-end">
            <Actions size="sm">
              {canView && (
                <Actions.Item
                  icon={<Icon as={FiEye} />}
                  onClick={() => navigate(`/operacional/processamentos/${row.original.uuid}`)}
                >
                  {text.list.actions.view}
                </Actions.Item>
              )}
              {canFinish && row.original.status === processingStatus.pending && (
                <Actions.Item
                  icon={<Icon as={FiCheckCircle} />}
                  onClick={() =>
                    navigate(`/operacional/processamentos/${row.original.uuid}/finalizar`)
                  }
                >
                  {text.list.actions.finish}
                </Actions.Item>
              )}
              {canCancel && row.original.status === processingStatus.finished && (
                <Actions.Item
                  icon={<Icon as={FiXCircle} />}
                  onClick={() => {
                    setCancelTargetUuid(row.original.uuid);
                    onOpenCancel();
                  }}
                >
                  {text.list.actions.cancel}
                </Actions.Item>
              )}
            </Actions>
          </Flex>
        ),
        meta: styleColumTable.sm,
      }),
    ],
    [navigate, canView, canFinish, canCancel, text, onOpenCancel]
  );

  const isLoading = checkLoadingStatus([processingsList]);
  const items = processingsList.data?.data?.items;
  const isEmpty = !isLoading && !processingsList.isError && (items?.length ?? 0) === 0;

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
              {text.pluralLabel}
            </Text>
          </VStack>
        </HeaderGrid>

        <Box mt={6}>
          <Table
            isLoading={isLoading}
            isError={processingsList.isError}
            error={processingsList.error}
            isEmpty={isEmpty}
            onRetry={() => processingsList.refetch()}
            isRetrying={processingsList.isFetching}
            retryLabel={text.list.error.retry}
            emptyIcon={FiFileText as ElementType}
            emptyTitle={text.list.emptyState.titleEmpty}
            emptyDescription={text.list.emptyState.descriptionEmpty}
          />
        </Box>
      </TableProvider>

      <FilterSideProcessing
        isOpen={isFilterOpen}
        onClose={onCloseFilter}
        handleFilterChange={handleFilterChange}
        handleReset={handleResetFilter}
        filter={paginatedQuery.filter}
        languageGB={languageGB}
      />

      {/* PROC-05 — Cancelar (`FINISHED`→`PENDING`), texto NÃO promete reversão de categoria/raça/peso (RW-D). */}
      <ModalAction
        isOpen={isCancelOpen}
        onClose={onCloseCancel}
        asyncFunction={handleCancelProcessing}
        clearData={() => setCancelTargetUuid('')}
        languageGB={languageGB}
        header={text.cancelModal.title}
        body={text.cancelModal.body}
      />
    </ContainerGrid>
  );
}
