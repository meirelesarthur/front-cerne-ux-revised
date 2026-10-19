// src/pages/Operacional/FeedlotCorrals/Historico.tsx
// -----------------------------------------------------------------------------
// Tela de HISTÓRICO de situação de um CURRAL (FeedlotCorral) — Operacional/
// Confinamento. Rota: /operacional/currais/:uuid/historico, guardada por
// `feedlot-corrals_view` (TASK-043-CUR-T09, `09-Tela-Historico-Curral.md`,
// GAP-API-01 — `[[contrato-api-currais-gaps]]` §3 — endpoint BUILD/entregue).
//
// SUBSTITUI a casca mínima da T01 por inteiro (mirror `IbptDetalhe.tsx`,
// get_pwa_grid_query_pattern "Hook 2: sub-recurso com ID de contexto" —
// `useCustomGridQueryById`, 10/pág, ordenação `created_at DESC` já resolvida
// no backend/`FeedlotCorralRepository::paginateStatusHistories` — sem
// `orderBy` no request). Grid SIMPLES read-only, 6 colunas (LM-012..017):
// corral / before_status / after_status / note / created_at / user
// (`user.people.nickname`, já resolvido pelo Resource).
//
// Estados de UI (contrato §8/DoD T09, `get_spa_ux_fidelity_pattern` — nenhum
// estado silencioso): 1) skeleton — `Table isLoading`, mesmo mecanismo do
// resto do grid; 2) vazio — `EmptyState` (mirror `FeedlotCorralList`); 3) erro
// — mensagem + `Tentar novamente`/`refetch()` (mirror `FindAnimal/index.tsx`,
// único precedente do repositório com bloco de erro dedicado + retry num
// `useQuery`/`useCustomGridQueryById`).
//
// "Voltar → lista" (AC-029) é o X embutido no `FormContainer`
// (`navigate(-1)`) — mesmo mecanismo já usado por `DetalheFeedlotCorral.tsx`,
// sem botão próprio.
// -----------------------------------------------------------------------------

import { useEffect, useMemo } from 'react';

import { Box, EmptyState, Flex, Icon, Text, VStack } from '@chakra-ui/react';
import { createColumnHelper } from '@tanstack/react-table';
import { FiAlertCircle, FiClock } from 'react-icons/fi';
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
import formatDate from '@/utils/formatDate';
import { isValidGuid } from '@/utils/guid';
import { styleColumTable } from '@/utils/style-colum-table';

import { feedlotCorralStatusColor } from '@/constants/FeedlotCorrals/feedlot-corral-status-color';
import { queryKey } from '@/constants/query-key';

import { listFeedlotCorralHistories } from '@/services/v2/FeedlotCorrals/feedlot-corral-service';

import type { FeedlotCorralHistoryItem } from '@/@types/v2/FeedlotCorrals';

const FEEDLOT_CORRALS_LIST_ROUTE = '/operacional/currais';

// Dot colorido de situação — MESMO token semântico da listagem
// (`feedlotCorralStatusColor`, LM-010), reusado aqui para `before_status`/
// `after_status` (LM-013/014). `value` pode vir `null` (transição sem um dos
// lados) — sem dot nesse caso, só o rótulo/fallback.
function StatusCell({ value, label }: { value: string | null; label: string | null }) {
  const colorToken = value ? feedlotCorralStatusColor[value] : undefined;
  return (
    <Flex align="center" gap={2}>
      {colorToken && (
        <Box boxSize="2.5" borderRadius="full" bg={`${colorToken}.500`} flexShrink={0} />
      )}
      <Text fontSize="sm">{label ?? '—'}</Text>
    </Flex>
  );
}

export default function HistoricoFeedlotCorral() {
  const { uuid } = useParams<{ uuid: string }>();
  const navigate = useNavigate();
  const { languageGB } = useLanguage();
  const text = languageGB.feedlotCorrals.feedlotCorral;
  const historyText = text.history;

  // Guard de navegação — uuid mal formado não deve chegar à query nem
  // renderizar conteúdo (mesmo racional de `DetalheFeedlotCorral.tsx`/
  // `IbptDetalhe.tsx`): redireciona para a listagem antes de montar.
  useEffect(() => {
    if (!isValidGuid(uuid)) {
      navigate(FEEDLOT_CORRALS_LIST_ROUTE, { replace: true });
    }
  }, [uuid, navigate]);

  const historyStorageKey =
    'OperacionalFeedlotCorralHistories' + queryKey.feedlotCorrals.feedlotCorralHistories + uuid;

  const historyDefaultQueryOptions = useMemo(
    () => ({
      pageSize: 10, // DoD T09 — 10/pág, desc por created_at (default do backend).
      storageKey: historyStorageKey,
    }),
    [historyStorageKey]
  );

  const { paginatedQuery, handlePaginatedQuery } = userPaginatedQuery(historyDefaultQueryOptions);

  const historiesQuery = useCustomGridQueryById<FeedlotCorralHistoryItem, any>({
    registrationId: uuid as string,
    asyncFunctionById: listFeedlotCorralHistories,
    queryKey: queryKey.feedlotCorrals.feedlotCorralHistories,
    paginatedQuery,
    setPaginatedQuery: handlePaginatedQuery,
    filterQuery: [],
  });

  const columnHelper = createColumnHelper<FeedlotCorralHistoryItem>();
  const columns = useMemo(
    () => [
      // LM-012
      columnHelper.accessor('corral', {
        header: historyText.table.corral,
        enableHiding: false,
        cell: ({ row }) => (
          <Text fontSize="sm" fontWeight="medium">
            {row.original.corral ?? '—'}
          </Text>
        ),
        meta: { gridLabel: historyText.table.corral },
      }),
      // LM-013
      columnHelper.accessor((row) => row.before_status?.label, {
        id: 'before_status',
        header: historyText.table.beforeStatus,
        cell: ({ row }) => (
          <StatusCell
            value={row.original.before_status?.value ?? null}
            label={row.original.before_status?.label ?? null}
          />
        ),
        meta: { ...styleColumTable.sm, gridLabel: historyText.table.beforeStatus },
      }),
      // LM-014
      columnHelper.accessor((row) => row.after_status?.label, {
        id: 'after_status',
        header: historyText.table.afterStatus,
        cell: ({ row }) => (
          <StatusCell
            value={row.original.after_status?.value ?? null}
            label={row.original.after_status?.label ?? null}
          />
        ),
        meta: { ...styleColumTable.sm, gridLabel: historyText.table.afterStatus },
      }),
      // LM-015 — fallback literal `-` (contrato T09, distinto do `—` das
      // demais colunas: observação vazia, não dado ausente do backend).
      columnHelper.accessor('note', {
        header: historyText.table.note,
        cell: ({ row }) => (
          <Text fontSize="sm" color="fg.muted" lineClamp="2">
            {row.original.note ?? '-'}
          </Text>
        ),
        meta: { gridLabel: historyText.table.note },
      }),
      // LM-016
      columnHelper.accessor('created_at', {
        header: historyText.table.createdAt,
        enableHiding: false,
        cell: ({ row }) => (
          <Text fontSize="sm">
            {row.original.created_at
              ? formatDate(row.original.created_at, 'dd/MM/yyyy HH:mm:ss')
              : '—'}
          </Text>
        ),
        meta: { ...styleColumTable.sm, gridLabel: historyText.table.createdAt },
      }),
      // LM-017 — `user.people.nickname`, já resolvido pelo Resource.
      columnHelper.accessor('user', {
        header: historyText.table.user,
        cell: ({ row }) => <Text fontSize="sm">{row.original.user ?? '—'}</Text>,
        meta: { ...styleColumTable.sm, gridLabel: historyText.table.user },
      }),
    ],
    [historyText]
  );

  const gridSettings = useGridSettings<FeedlotCorralHistoryItem>({
    storageKey: historyStorageKey,
    storageScope: useGridStorageScope(),
    columns,
  });
  const { columnOrder, setColumnOrder, columnVisibility, setColumnVisibility } = gridSettings;

  if (!isValidGuid(uuid)) {
    return null;
  }

  const isLoading = checkLoadingStatus([historiesQuery as any]);
  const isError = !isLoading && historiesQuery.isError;
  const items = historiesQuery.data?.data?.items;
  const isEmpty = !isLoading && !isError && (items?.length ?? 0) === 0;

  return (
    <FormContainer title={text.list.actions.history}>
      <Box px={{ base: 4, md: 10 }} pb={8}>
        {isError ? (
          <VStack gap={3} py={16} px={4}>
            <Icon as={FiAlertCircle} boxSize={8} color="red.400" />
            <Text color="fg.muted">{historyText.error.message}</Text>
            <Button
              variant="outline"
              title={historyText.error.retry}
              onClick={() => historiesQuery.refetch()}
            />
          </VStack>
        ) : isEmpty ? (
          <EmptyState.Root>
            <EmptyState.Content>
              <EmptyState.Indicator>
                <Icon as={FiClock} boxSize={8} color="fg.muted" />
              </EmptyState.Indicator>
              <VStack textAlign="center" gap={1}>
                <EmptyState.Title>{historyText.emptyState.title}</EmptyState.Title>
                <EmptyState.Description>
                  {historyText.emptyState.description}
                </EmptyState.Description>
              </VStack>
            </EmptyState.Content>
          </EmptyState.Root>
        ) : (
          <TableProvider
            data={items}
            columns={columns}
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
                {text.list.actions.history}
              </Text>
            </HeaderGrid>
            <Box mt={4}>
              <Table isLoading={isLoading} />
            </Box>
          </TableProvider>
        )}
      </Box>
    </FormContainer>
  );
}
