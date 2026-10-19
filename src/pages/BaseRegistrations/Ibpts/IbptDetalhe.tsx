// src/pages/BaseRegistrations/Ibpts/IbptDetalhe.tsx
// -----------------------------------------------------------------------------
// Tela de VISUALIZAÇÃO (#63 "IBPT {UF}") de uma Tabela IBPT — Cadastros Base,
// execução 032, TASK-FE-2413. Rota própria:
// /cadastros-base/ibpt/:uuid (guardada por `ibpts_view`).
//
// Composição Modelo B SIMPLIFICADA (`get_pwa_complex_screen_compositions_pattern`
// §B — Master-Detail, mas SEM Tabs: só 1 filho, sempre visível, porque o
// cabeçalho é só leitura — sem Tab 0 "formulário do pai"). Cabeçalho
// (dados do pai, `useQuery` direto, mirror `SystemUpdateDetalhe.tsx`) +
// grade paginada de itens do filho (`useCustomGridQueryById`, contrato de
// tela §5).
//
// SEM `headerActions` — não há botão "Editar" (contrato de API §10, sem
// Edição) nem "Excluir" (mantido só na Listagem). SEM coluna de ações na
// grade de itens — somente leitura (RN-05: só a tabela inteira é excluída).
// -----------------------------------------------------------------------------

import { ElementType, useEffect, useMemo } from 'react';

import { Box, EmptyState, Flex, Icon, SimpleGrid, Skeleton, Text, VStack } from '@chakra-ui/react';
import { useQuery } from '@tanstack/react-query';
import { createColumnHelper } from '@tanstack/react-table';
import { FiAlertTriangle, FiArrowLeft } from 'react-icons/fi';
import { useNavigate, useParams } from 'react-router-dom';

import { Button } from '@/components/Button';
import { GridSettingsFloatingPanel } from '@/components/GridSettings/GridSettingsFloatingPanel';
import { HeaderGrid } from '@/components/HeaderGrid';
import { FormContainer } from '@/components/Layout/FormContainer';
import { Table } from '@/components/Table';

import { TableProvider } from '@/contexts/TableContext';

import { useCustomGridQueryById } from '@/hooks/useCustomGridQueryById';
import { useGridSettings } from '@/hooks/useGridSettings';
import { useGridStorageScope } from '@/hooks/useGridStorageScope';
import { useLanguage } from '@/hooks/useLanguage';
import { userPaginatedQuery } from '@/hooks/usePaginatedQueryStorage';

import { checkLoadingStatus } from '@/utils/checkLoadingStatus';
import { isValidGuid } from '@/utils/guid';
import { styleColumTable } from '@/utils/style-colum-table';

import { columnsForm } from '@/constants/coluns-form';
import { queryKey } from '@/constants/query-key';

import { getIbptTable, listIbptItems } from '@/services/v2/BaseRegistrations/ibpt-service';

import type { IbptItemListItem } from '@/@types/v2/BaseRegistrations/ibpt';

const IBPTS_LIST_ROUTE = '/cadastros-base/ibpt';

function InfoField({ label, value }: { label: string; value: string }) {
  return (
    <Box>
      <Text
        fontSize="xs"
        fontWeight="semibold"
        color="fg.muted"
        textTransform="uppercase"
        letterSpacing="wide"
        mb={1}
      >
        {label}
      </Text>
      <Text fontSize="sm" color="fg.default">
        {value}
      </Text>
    </Box>
  );
}

// Percentuais já vêm como string `decimal:2` do backend (ex.: "12.34") —
// sem `formatPercent` no projeto ainda, literal `${value}%` (contrato de
// tela §5).
function formatPercentValue(value: string | null | undefined): string {
  if (value === null || value === undefined || value === '') return '—';
  return `${value}%`;
}

export default function IbptDetalhe() {
  const { uuid } = useParams<{ uuid: string }>();
  const navigate = useNavigate();
  const { languageGB } = useLanguage();
  const text = languageGB.baseRegistrations.ibpt;

  // Guard de navegação — uuid mal formado não deve chegar à query nem
  // renderizar conteúdo (mesmo racional de `SystemUpdateDetalhe.tsx`).
  useEffect(() => {
    if (!isValidGuid(uuid)) {
      navigate(IBPTS_LIST_ROUTE, { replace: true });
    }
  }, [uuid, navigate]);

  const detailQuery = useQuery({
    queryKey: [queryKey.baseRegistrations.ibpt, uuid],
    queryFn: async () => {
      const response = await getIbptTable(uuid as string);
      return response.data;
    },
    enabled: isValidGuid(uuid),
    retry: false,
  });

  const itemsStorageKey =
    'BaseRegistrationsIbptItems' + queryKey.baseRegistrations.ibptItems + uuid;

  const itemsDefaultQueryOptions = useMemo(
    () => ({
      pageSize: 10, // contrato de API §6 (`IbptItemFilterData`), teto 100.
      orderBy: { name: 'codigo', ascOrDesc: 'asc' }, // default do backend, contrato de API §8.
      storageKey: itemsStorageKey,
    }),
    [itemsStorageKey]
  );

  const { paginatedQuery, handlePaginatedQuery } = userPaginatedQuery(itemsDefaultQueryOptions);

  const itemsList = useCustomGridQueryById<IbptItemListItem, any>({
    registrationId: uuid as string,
    asyncFunctionById: listIbptItems,
    queryKey: queryKey.baseRegistrations.ibptItems,
    paginatedQuery,
    setPaginatedQuery: handlePaginatedQuery,
    filterQuery: [],
  });

  const columnHelper = createColumnHelper<IbptItemListItem>();
  const itemColumns = useMemo(
    () => [
      columnHelper.accessor('codigo', {
        header: text.detail.table.codigo,
        enableHiding: false,
        meta: { ...styleColumTable.sm, gridLabel: text.detail.table.codigo },
        cell: ({ row }) => (
          <Text fontSize="sm" fontWeight="medium">
            {row.original.codigo}
          </Text>
        ),
      }),
      columnHelper.accessor('nacional_federal', {
        header: text.detail.table.nacionalFederal,
        meta: { ...styleColumTable.sm, gridLabel: text.detail.table.nacionalFederal },
        cell: ({ row }) => (
          <Text fontSize="sm" color="fg.muted" textAlign="right">
            {formatPercentValue(row.original.nacional_federal)}
          </Text>
        ),
      }),
      columnHelper.accessor('importado_federal', {
        header: text.detail.table.importadoFederal,
        meta: { ...styleColumTable.sm, gridLabel: text.detail.table.importadoFederal },
        cell: ({ row }) => (
          <Text fontSize="sm" color="fg.muted" textAlign="right">
            {formatPercentValue(row.original.importado_federal)}
          </Text>
        ),
      }),
      columnHelper.accessor('estadual', {
        header: text.detail.table.estadual,
        meta: { ...styleColumTable.sm, gridLabel: text.detail.table.estadual },
        cell: ({ row }) => (
          <Text fontSize="sm" color="fg.muted" textAlign="right">
            {formatPercentValue(row.original.estadual)}
          </Text>
        ),
      }),
      columnHelper.accessor('municipal', {
        header: text.detail.table.municipal,
        meta: { ...styleColumTable.sm, gridLabel: text.detail.table.municipal },
        cell: ({ row }) => (
          <Text fontSize="sm" color="fg.muted" textAlign="right">
            {formatPercentValue(row.original.municipal)}
          </Text>
        ),
      }),
    ],
    [text]
  );

  const gridSettings = useGridSettings<IbptItemListItem>({
    storageKey: itemsStorageKey,
    storageScope: useGridStorageScope(),
    columns: itemColumns,
  });
  const { columnOrder, setColumnOrder, columnVisibility, setColumnVisibility } = gridSettings;

  if (!isValidGuid(uuid)) {
    return null;
  }

  const isLoadingHeader = checkLoadingStatus([detailQuery as any]);
  const isLoadingItems = checkLoadingStatus([itemsList]);
  const item = detailQuery.data;
  const notFound = !isLoadingHeader && detailQuery.isError;
  const itemsData = itemsList.data?.data?.items;

  if (notFound) {
    return (
      <FormContainer title={text.singularLabel}>
        <Flex direction="column" align="center" justify="center" py={16} px={4}>
          <EmptyState.Root>
            <EmptyState.Content>
              <EmptyState.Indicator>
                <Icon as={FiAlertTriangle} boxSize={8} color="fg.muted" />
              </EmptyState.Indicator>
              <VStack textAlign="center" gap={1}>
                <EmptyState.Title>{text.detail.notFound.title}</EmptyState.Title>
                <EmptyState.Description>{text.detail.notFound.description}</EmptyState.Description>
              </VStack>
              <Button
                title={text.detail.notFound.back}
                icon={FiArrowLeft as ElementType}
                variant="outline"
                size="sm"
                onClick={() => navigate(IBPTS_LIST_ROUTE)}
              />
            </EmptyState.Content>
          </EmptyState.Root>
        </Flex>
      </FormContainer>
    );
  }

  const pageTitle = text.detail.pageTitle.replace('{uf}', item?.uf ?? '');

  return (
    <FormContainer title={pageTitle}>
      <Box px={{ base: 4, md: 10 }} pb={8}>
        <Skeleton loading={isLoadingHeader}>
          <SimpleGrid columns={columnsForm.default} gap={6} mb={8}>
            <InfoField label={text.detail.fields.uf} value={item?.uf ?? '—'} />
            <InfoField label={text.detail.fields.versao} value={item?.versao ?? '—'} />
            <InfoField
              label={text.detail.fields.itemsCount}
              value={item?.items_count != null ? String(item.items_count) : '—'}
            />
          </SimpleGrid>
        </Skeleton>

        <TableProvider
          data={itemsData}
          columns={itemColumns}
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
              <GridSettingsFloatingPanel
                gridSettings={gridSettings}
                triggerLabel={languageGB.defaltStrings.gridSettings.trigger}
              />
            }
          >
            <Text fontSize="md" fontWeight="semibold" color="fg.default">
              {text.detail.itemsLabel}
            </Text>
          </HeaderGrid>

          <Box mt={4}>
            <Table isLoading={isLoadingItems} />
          </Box>
        </TableProvider>
      </Box>
    </FormContainer>
  );
}
