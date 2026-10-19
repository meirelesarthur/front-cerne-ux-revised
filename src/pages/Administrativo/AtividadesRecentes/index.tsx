// src/pages/Administrativo/AtividadesRecentes/index.tsx
// -----------------------------------------------------------------------------
// Tela de LISTAGEM (somente leitura) de ATIVIDADES RECENTES — Administrativo
// (UT-000690 / F-349). Rota /administrativo/atividades-recentes, guardada por
// `recent-activities_view` (registrada em src/router/index.tsx).
//
// UX-GAP declarado (D-092-02): sem tela no `ux_root` — decisão do dono =
// seguir-pelo-padrão (mirror `Administrativo/Faltas/index.tsx`).
//
// Colunas: Tipo (label i18n, fallback `type_label` da API), Data
// (`dd/MM/yyyy HH:mm`, hora local), Status (D-092-13, sem filtro), Fazenda (`farm.name`) e a ação "Abrir".
// Sem ordenação por coluna (servidor: `created_at desc` fixo). Sem CTA de criação.
// -----------------------------------------------------------------------------

import { ElementType, useMemo } from 'react';

import { Box, Flex, Text, useDisclosure, VStack } from '@chakra-ui/react';
import { createColumnHelper } from '@tanstack/react-table';
import { FiClock } from 'react-icons/fi';

import { ContainerGrid } from '@/components/ContainerGrid';
import { HeaderGrid } from '@/components/HeaderGrid';
import { Table } from '@/components/Table';

import { TableProvider } from '@/contexts/TableContext';

import { useLanguage } from '@/hooks/useLanguage';
import { userPaginatedQuery } from '@/hooks/usePaginatedQueryStorage';

import { checkLoadingStatus } from '@/utils/checkLoadingStatus';
import formatDate from '@/utils/formatDate';
import { styleColumTable } from '@/utils/style-colum-table';

import { queryKey } from '@/constants/query-key';
import { recentActivityTypeOptions } from '@/constants/RecentActivities/options';

import type {
  RecentActivityFilterForm,
  RecentActivityListItem,
} from '@/@types/v2/RecentActivities';

import { FilterSideAtividadesRecentes } from './FilterSideAtividadesRecentes';
import { HeaderTable } from './HeaderTable';
import { useOpenRecentActivity } from './hooks/useOpenRecentActivity';
import { OpenRecentActivityAction } from './OpenRecentActivityAction';
import { RecentActivityStatusCell } from './RecentActivityStatusCell';
import { useRecentActivitiesList } from './useRecentActivities';

// Larguras das colunas (o `td` global limita em 190px; o `style` inline da coluna prevalece).
const typeColumnStyle = { width: 220, maxWidth: 220 } as const;
const statusColumnStyle = { width: 130, maxWidth: 130 } as const;
const farmColumnStyle = { width: 130, maxWidth: 130 } as const;

export default function RecentActivitiesList() {
  const { languageGB } = useLanguage();
  const text = languageGB.recentActivities.recentActivity;
  const { handleOpen, openingKey } = useOpenRecentActivity();

  const defaultQueryOptions = useMemo(
    () => ({
      pageSize: 10,
      storageKey: 'AdministrativoAtividadesRecentes' + queryKey.recentActivities.recentActivities,
    }),
    []
  );

  const { paginatedQuery, handlePaginatedQuery, handleFilterChange, handleResetFilter } =
    userPaginatedQuery<RecentActivityFilterForm>(defaultQueryOptions);

  const { open: isFilterOpen, onOpen: onOpenFilter, onClose: onCloseFilter } = useDisclosure();

  const filtersApplied = useMemo(
    () =>
      Object.values(paginatedQuery.filter ?? {}).filter((value) =>
        Array.isArray(value)
          ? value.length > 0
          : value !== undefined && value !== null && value !== ''
      ).length,
    [paginatedQuery.filter]
  );

  const activitiesList = useRecentActivitiesList({
    paginatedQuery,
    setPaginatedQuery: handlePaginatedQuery,
    filter: paginatedQuery.filter ?? undefined,
  });

  const columnHelper = createColumnHelper<RecentActivityListItem>();
  const defaultColumns = useMemo(
    () => [
      columnHelper.display({
        id: 'type',
        header: text.list.table.type,
        cell: ({ row }) => (
          <Text fontWeight="medium" lineClamp="1">
            {recentActivityTypeOptions.getLabel(row.original.type, languageGB) ??
              row.original.type_label}
          </Text>
        ),
        // Largura própria: o label mais longo ("Transferência animal/lote") não trunca em 1280.
        meta: { style: typeColumnStyle, gridLabel: text.list.table.type },
      }),
      columnHelper.accessor('created_at', {
        header: text.list.table.date,
        cell: ({ row }) => (
          <Text fontSize="sm" color="fg.muted">
            {formatDate(row.original.created_at, 'dd/MM/yyyy HH:mm')}
          </Text>
        ),
        meta: { ...styleColumTable.date, gridLabel: text.list.table.date },
      }),
      columnHelper.display({
        id: 'status',
        header: text.list.table.status,
        cell: ({ row }) => <RecentActivityStatusCell item={row.original} languageGB={languageGB} />,
        meta: { style: statusColumnStyle, gridLabel: text.list.table.status },
      }),
      columnHelper.display({
        id: 'farm',
        header: text.list.table.farm,
        cell: ({ row }) => (
          <Text fontSize="sm" color="fg.muted" lineClamp="1">
            {row.original.farm?.name ?? '—'}
          </Text>
        ),
        meta: { style: farmColumnStyle, gridLabel: text.list.table.farm },
      }),
      columnHelper.display({
        id: 'actions',
        header: text.list.table.actions,
        cell: ({ row }) => (
          <Flex justify="flex-end">
            <OpenRecentActivityAction
              item={row.original}
              languageGB={languageGB}
              openingKey={openingKey}
              onOpen={handleOpen}
            />
          </Flex>
        ),
        enableHiding: false,
        // `fixed-end`: Ações fica ancorada à direita e sempre visível, mesmo com scroll horizontal.
        meta: {
          ...styleColumTable.sm,
          gridLabel: text.list.table.actions,
          gridOrder: 'fixed-end',
          gridDataColumn: false,
        },
      }),
    ],
    [languageGB, text, openingKey, handleOpen]
  );

  const isLoading = checkLoadingStatus([activitiesList]);
  const items = activitiesList.data?.data?.items;
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
          header={<HeaderTable onOpenFilter={onOpenFilter} filtersApplied={filtersApplied} />}
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
            isError={activitiesList.isError}
            error={activitiesList.error}
            isEmpty={isEmpty}
            onRetry={() => activitiesList.refetch()}
            isRetrying={activitiesList.isFetching}
            emptyIcon={FiClock as ElementType}
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
          />
        </Box>
      </TableProvider>

      <FilterSideAtividadesRecentes
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
