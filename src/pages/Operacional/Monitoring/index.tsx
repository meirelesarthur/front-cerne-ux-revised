// src/pages/Operacional/Monitoring/index.tsx
// -----------------------------------------------------------------------------
// Tela de LISTAGEM (grid) de Monitoramento (MonitoringServiceOrder) —
// TASK-MO-FE-03 (esteira `97-Esteiras/057`). Domínio PRÓPRIO
// (`Operacional/Monitoring`, URL `/operacional/monitoramento`, roteamento em
// TASK-MO-FE-05), mirror `Operacional/ServiceOrders/index.tsx` — grid de
// Ordens de Serviço do executor logado, 100% LEITURA (sem `ButtonAdd`, sem
// `DeleteConfirmDialog`, sem edição — mode_matrix do contrato legado
// confirma `criar`/`editar`/`excluir` `NAO_APLICAVEL`).
//
// Ação "Visualizar" (gate 4, contrato de tela §6) navega para o detalhe de
// OS JÁ existente em produção (`/operacional/lista-os/{uuid}/detalhe`,
// `ServiceOrderDetalhe`, guardada por `service-orders_view` no router) — o
// front checa as DUAS permissões independentemente
// (`monitoring-service-orders_view`, já garantida pela rota, TASK-MO-FE-05;
// `service-orders_view`, permissão do DESTINO), preservando fielmente o
// defeito CLM-26/OQ-03 do legado (decisão explícita do dono). Decisão de UX
// tomada no contrato de tela: ESCONDER a ação quando falta
// `service-orders_view` (em vez de desabilitar+tooltip).
//
// Legenda de status renderiza os 5 status possíveis do domínio
// (`ServiceOrderStatus`), mesmo a API só retornando 3 (`status <= 3`) — fiel
// ao legado (CLM-24), reaproveitando `getMonitoringStatusOptions`/
// `getMonitoringStatusBadgeColor` de TASK-MO-FE-01 (que por sua vez são
// aliases do enum/mapa já existente de `ServiceOrders`, não um segundo
// enum).
// -----------------------------------------------------------------------------

import { useMemo, type ElementType } from 'react';

import { Box, Flex, Icon, Text, VStack, useDisclosure } from '@chakra-ui/react';
import { createColumnHelper } from '@tanstack/react-table';
import { FiClipboard, FiEye } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';

import { formatServiceOrderDate } from '@/pages/Operacional/ServiceOrders/ServiceOrderDetailBody';

import { Actions } from '@/components/Action';
import { ContainerGrid } from '@/components/ContainerGrid';
import { HeaderGrid } from '@/components/HeaderGrid';
import { Status } from '@/components/Status';
import { Table } from '@/components/Table';

import { TableProvider } from '@/contexts/TableContext';

import { useLanguage } from '@/hooks/useLanguage';
import { userPaginatedQuery } from '@/hooks/usePaginatedQueryStorage';
import { usePermissions } from '@/hooks/usePermissions';

import { checkLoadingStatus } from '@/utils/checkLoadingStatus';
import { styleColumTable } from '@/utils/style-colum-table';

import {
  getMonitoringStatusBadgeColor,
  getMonitoringStatusOptions,
} from '@/constants/monitoring/serviceOrderStatus';
import { queryKey } from '@/constants/query-key';

import type {
  MonitoringFilterForm,
  MonitoringServiceOrderListItem,
} from '@/@types/v2/Operacional/Monitoring';

import { FilterSideMonitoring } from './FilterSideMonitoring';
import { HeaderTable } from './HeaderTable';
import { useMonitoringList } from './useMonitoring';

const MONITORING_STORAGE_KEY = 'OperacionalMonitoring' + queryKey.monitoring.monitorings;
const SERVICE_ORDERS_DETAIL_ROUTE = '/operacional/lista-os';

export default function Monitoring() {
  const { languageGB } = useLanguage();
  const navigate = useNavigate();
  const { can } = usePermissions();
  const text = languageGB.monitoring.list;

  // `monitoring-service-orders_view` já é garantida pela rota (TASK-MO-FE-05)
  // — NÃO rechecada aqui (anti-padrão explícito da Tarefa). `service-orders_view`
  // é a permissão do DESTINO da navegação (gate 4).
  const canViewServiceOrder = can('service-orders_view');

  const defaultQueryOptions = useMemo(
    () => ({ pageSize: 10, storageKey: MONITORING_STORAGE_KEY }),
    []
  );

  const { paginatedQuery, handlePaginatedQuery, handleFilterChange, handleResetFilter } =
    userPaginatedQuery<MonitoringFilterForm>(defaultQueryOptions);

  const { open: isFilterOpen, onOpen: onOpenFilter, onClose: onCloseFilter } = useDisclosure();

  const filtersApplied = useMemo(
    () =>
      Object.values(paginatedQuery.filter ?? {}).filter(
        (v) => v !== undefined && v !== null && v !== ''
      ).length,
    [paginatedQuery.filter]
  );

  const monitoringList = useMonitoringList({
    paginatedQuery,
    setPaginatedQuery: handlePaginatedQuery,
    filter: paginatedQuery.filter ?? undefined,
  });

  const columnHelper = createColumnHelper<MonitoringServiceOrderListItem>();
  const defaultColumns = useMemo(
    () => [
      columnHelper.accessor((row) => row.status.label, {
        id: 'status',
        header: text.table.status,
        enableHiding: false,
        cell: ({ row }) => (
          <Status
            text={row.original.status.label}
            backgroundColor={getMonitoringStatusBadgeColor(row.original.status.value)}
          />
        ),
        meta: { ...styleColumTable.sm, gridLabel: text.table.status },
      }),
      columnHelper.accessor('code', {
        header: text.table.code,
        cell: ({ row }) => (
          <Text fontFamily="mono" fontSize="sm" fontWeight="medium">
            {row.original.code}
          </Text>
        ),
        meta: { ...styleColumTable.sm, gridLabel: text.table.code },
      }),
      columnHelper.accessor('dt_emission', {
        header: text.table.dtEmission,
        cell: ({ row }) => (
          <Text fontSize="sm">{formatServiceOrderDate(row.original.dt_emission)}</Text>
        ),
        meta: { ...styleColumTable.date, gridLabel: text.table.dtEmission },
      }),
      columnHelper.accessor('deadline', {
        header: text.table.deadline,
        cell: ({ row }) => (
          <Text fontSize="sm">{formatServiceOrderDate(row.original.deadline)}</Text>
        ),
        meta: { ...styleColumTable.date, gridLabel: text.table.deadline },
      }),
      columnHelper.accessor((row) => row.solicitante?.name ?? '', {
        id: 'solicitante',
        header: text.table.solicitante,
        cell: ({ row }) => <Text fontSize="sm">{row.original.solicitante?.name ?? '—'}</Text>,
        meta: { gridLabel: text.table.solicitante },
      }),
      columnHelper.accessor((row) => row.responsavel?.name ?? '', {
        id: 'responsavel',
        header: text.table.responsavel,
        cell: ({ row }) => <Text fontSize="sm">{row.original.responsavel?.name ?? '—'}</Text>,
        meta: { gridLabel: text.table.responsavel },
      }),
      columnHelper.display({
        id: 'acoes',
        header: '',
        enableHiding: false,
        cell: ({ row }) => (
          <Flex justify="flex-end">
            <Actions size="sm">
              {canViewServiceOrder && (
                <Actions.Item
                  icon={<Icon as={FiEye} />}
                  onClick={() =>
                    navigate(`${SERVICE_ORDERS_DETAIL_ROUTE}/${row.original.uuid}/detalhe`)
                  }
                >
                  {text.actions.view}
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
    [navigate, canViewServiceOrder, text, languageGB]
  );

  const isLoading = checkLoadingStatus([monitoringList]);
  const items = monitoringList.data?.data?.items;
  const isEmpty = !isLoading && (items?.length ?? 0) === 0;

  const statusLegend = getMonitoringStatusOptions(languageGB);

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
              {text.pageTitle}
            </Text>
            <Text fontSize="sm" color="fg.muted">
              {text.pageSubtitle}
            </Text>
          </VStack>
        </HeaderGrid>

        {/* Legenda de status — SEMPRE visível, os 5 status do domínio (fiel
            ao legado, CLM-24), mirror `ServiceOrdersList`. */}
        <Flex gap={5} mt={4} wrap="wrap">
          {statusLegend.map((item) => (
            <Status
              key={item.status}
              text={item.label}
              backgroundColor={item.badgeColor}
              fontSize="sm"
              color="fg.muted"
            />
          ))}
        </Flex>

        <Box mt={6}>
          <Table
            isLoading={isLoading}
            isError={monitoringList.isError}
            error={monitoringList.error}
            isEmpty={isEmpty}
            onRetry={() => monitoringList.refetch()}
            isRetrying={monitoringList.isFetching}
            emptyIcon={FiClipboard as ElementType}
            emptyTitle={filtersApplied > 0 ? text.emptyState.titleFiltered : text.emptyState.title}
            emptyDescription={
              filtersApplied > 0 ? text.emptyState.descriptionFiltered : text.emptyState.description
            }
            canCreate={false}
          />
        </Box>
      </TableProvider>

      <FilterSideMonitoring
        isOpen={isFilterOpen}
        onClose={onCloseFilter}
        handleFilterChange={handleFilterChange}
        handleReset={handleResetFilter}
        filter={paginatedQuery.filter}
        languageGB={languageGB}
        filtersApplied={filtersApplied}
      />
    </ContainerGrid>
  );
}
