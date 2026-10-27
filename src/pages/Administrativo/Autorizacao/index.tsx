// src/pages/Administrativo/Autorizacao/index.tsx
// -----------------------------------------------------------------------------
// Tela de LISTAGEM (grid) "Autorização" — pendências de aprovação/ciência de
// Solicitação de Compra (`RequestPurchase` — Administrativo / Suprimentos,
// esteira 97-Esteiras/038, TASK-AUTH-FE-02). Subconjunto de status
// `{3 aguardandoAprovacao, 4 aguardandoCiencia, 11 analisarProcesso}` (BR-01,
// `GET /request-authorizations`).
//
// Mirror ESTRUTURAL de `Administrativo/Rejeitados/index.tsx` — mesma casca
// `ContainerGrid → TableProvider → HeaderGrid → Table/EmptyState`,
// `GridSettingsFloatingPanel`, legenda de status reaproveitada — SEM dropdown
// condicional (ação por linha é só navegação para o detalhe único, decidido
// internamente por `AutorizarSolicitacao.tsx`, TASK-AUTH-FE-03/04).
//
// Referência UX (Passo UX, `get_spa_ux_fidelity_pattern`): `GB.Cerne.UX/src/
// pages/administrativo/autorizacao/AutorizacaoCompraPage.tsx`, commit âncora
// `24bd91603a6ee4e19b58fa5efe2221835c83e306`. Adaptação (não cópia) — `cerne`
// `PageContainer`+`PageCard` → `ContainerGrid`; `PageHeader`+`ListToolbar` →
// `HeaderGrid`+`GridSettingsFloatingPanel`+`ButtonFilter`; `StatusLegend` →
// `RequestPurchaseStatusLegend` (reuso cross-folder); `ResponsiveDataTable` →
// `TableProvider`+`Table`; `DropdownMenu` (ação por linha) → `Actions`/
// `Actions.Item`. Tokens do `theme.ts` da SPA (Chakra v3), light+dark.
//
// Execução 081, T-081-FE-06 (legado `request-authorization/index.blade.php`): colunas na
// ordem bolinha de status, Código, Dt. Pedido, Descrição/Chamado, Duração, Solicitante,
// Fazenda, Responsável Atual e Ação; linha do tipo U destacada (`getRowHighlight`);
// busca por descrição/chamado/código; `?search=` da URL (links das notificações) aplica
// o filtro ao abrir. A ação abre o detalhe, que decide Aprovação, Ciência ou, sem ação
// pendente, a visualização da solicitação (nunca mais "sem ação").
//
// Legenda de status (`RequestPurchaseStatusLegend`) mostra os 11 valores do
// enum por padrão — esta listagem só FILTRA por 3, mas a legenda NÃO é
// restringida (fidelidade ao legado, mirror achado CLM-40 já documentado em
// `Rejeitados/index.tsx`).
// -----------------------------------------------------------------------------

import { useEffect, useMemo, useRef, type ElementType } from 'react';

import { Box, Flex, Icon, Text, useDisclosure } from '@chakra-ui/react';
import { createColumnHelper } from '@tanstack/react-table';
import { FileText } from 'lucide-react';
import { FiEye } from 'react-icons/fi';
import { useNavigate, useSearchParams } from 'react-router-dom';

import { Actions } from '@/components/Action';
import { ContainerGrid } from '@/components/ContainerGrid';
import { GridSettingsFloatingPanel } from '@/components/GridSettings/GridSettingsFloatingPanel';
import { HeaderGrid } from '@/components/HeaderGrid';
import { emergencyRowHighlight } from '@/components/Suprimentos/emergencyRow';
import { Table } from '@/components/Table';

import { TableProvider } from '@/contexts/TableContext';

import { useCustomGridQuery } from '@/hooks/useCustomGridQuery';
import { useGridSettings } from '@/hooks/useGridSettings';
import { useGridStorageScope } from '@/hooks/useGridStorageScope';
import { useLanguage } from '@/hooks/useLanguage';
import { userPaginatedQuery } from '@/hooks/usePaginatedQueryStorage';

import { checkLoadingStatus } from '@/utils/checkLoadingStatus';
import formatDate from '@/utils/formatDate';
import { styleColumTable } from '@/utils/style-colum-table';

import { queryKey } from '@/constants/query-key';
import { requestPurchaseStatusDotToken } from '@/constants/RequestPurchases/request-purchase-status';
import type { RequestPurchaseStatus } from '@/constants/RequestPurchases/request-purchase-status';

import { listRequestAuthorizations } from '@/services/v2/RequestAuthorizations/request-authorization-service';

import type {
  RequestAuthorizationFilterForm,
  RequestAuthorizationListItem,
} from '@/@types/v2/RequestAuthorizations';

import { FilterSideAutorizacao } from './FilterSideAutorizacao';

import { RequestPurchaseStatusLegend } from '../Solicitacao/RequestPurchaseStatusLegend';

import { PageHeader } from '@/components/ui/PageHeader';

import { ListToolbar } from '@/components/ui/ListToolbar';
import { useListSearch } from '@/hooks/useListSearch';

export default function AutorizacaoList() {
  const { languageGB } = useLanguage();
  const navigate = useNavigate();
  const text = languageGB.requestAuthorizations.requestAuthorization;

  const autorizacaoStorageKey =
    text.titleModule + queryKey.requestAuthorizations.requestAuthorization;

  const defaultQueryOptions = useMemo(
    () => ({
      pageSize: 10,
      storageKey: autorizacaoStorageKey,
    }),
    []
  );

  const { paginatedQuery, handlePaginatedQuery, handleFilterChange, handleResetFilter } =
    userPaginatedQuery<RequestAuthorizationFilterForm>(defaultQueryOptions);
  const listSearch = useListSearch(paginatedQuery.filter, handleFilterChange);

  const { open: isFilterOpen, onOpen: onOpenFilter, onClose: onCloseFilter } = useDisclosure();

  // `?search=` (links das notificações "Autorização nº X pendente"): aplica o filtro uma vez.
  const [searchParams] = useSearchParams();
  const urlSearch = searchParams.get('search')?.trim() || undefined;
  const appliedUrlSearch = useRef<string | undefined>(undefined);
  useEffect(() => {
    if (!urlSearch || appliedUrlSearch.current === urlSearch) return;
    appliedUrlSearch.current = urlSearch;
    handleFilterChange({ search: urlSearch });
  }, [urlSearch]);

  const filtersApplied = useMemo(
    () =>
      Object.values(paginatedQuery.filter ?? {}).filter(
        (v) => v !== undefined && v !== null && v !== '' && v !== false
      ).length,
    [paginatedQuery.filter]
  );

  const autorizacaoList = useCustomGridQuery<
    RequestAuthorizationListItem,
    RequestAuthorizationFilterForm
  >({
    asyncFunction: listRequestAuthorizations,
    queryKey: queryKey.requestAuthorizations.requestAuthorization,
    paginatedQuery,
    setPaginatedQuery: handlePaginatedQuery,
    filterQuery: [],
    filter: paginatedQuery.filter ?? ({} as RequestAuthorizationFilterForm),
  });

  const columnHelper = createColumnHelper<RequestAuthorizationListItem>();
  const defaultColumns = useMemo(
    () => [
      // Bolinha de status do legado (LI01): cor pelo token, nome acessível pelo status.
      columnHelper.display({
        id: 'statusDot',
        header: '',
        enableHiding: false,
        cell: ({ row }) => (
          <Box
            boxSize="2.5"
            borderRadius="full"
            backgroundColor={
              requestPurchaseStatusDotToken[row.original.status as RequestPurchaseStatus]
            }
            role="img"
            aria-label={row.original.status_label}
            title={row.original.status_label}
          />
        ),
        meta: {
          ...styleColumTable.sm,
          gridLabel: text.list.table.status,
          gridOrder: 'fixed-start',
          gridDataColumn: false,
        },
      }),
      columnHelper.accessor('code', {
        header: text.list.table.code,
        cell: ({ row }) => (
          <Text fontFamily="mono" fontSize="sm" fontWeight="medium">
            {row.original.code ?? '—'}
          </Text>
        ),
        meta: { ...styleColumTable.sm, gridLabel: text.list.table.code },
      }),
      columnHelper.accessor('request_date', {
        header: text.list.table.requestDate,
        cell: ({ row }) => (
          <Text fontSize="sm" color="fg.muted">
            {formatDate(row.original.request_date)}
          </Text>
        ),
        meta: { ...styleColumTable.date, gridLabel: text.list.table.requestDate },
      }),
      columnHelper.accessor('description', {
        header: text.list.table.description,
        cell: ({ row }) => (
          <Text fontSize="sm" color="fg.muted" lineClamp="2">
            {row.original.description ?? '—'}
          </Text>
        ),
        meta: { ...styleColumTable.md, gridLabel: text.list.table.description },
      }),
      columnHelper.accessor('duration_label', {
        header: text.list.table.duration,
        cell: ({ row }) => (
          <Text fontSize="sm" color="fg.muted">
            {row.original.duration_label ?? '—'}
          </Text>
        ),
        meta: { ...styleColumTable.sm, gridLabel: text.list.table.duration },
      }),
      columnHelper.accessor((row) => row.user?.name ?? '', {
        id: 'requester',
        header: text.list.table.requester,
        cell: ({ row }) => (
          <Text fontSize="sm" color="fg.muted" lineClamp="1">
            {row.original.user?.name ?? '—'}
          </Text>
        ),
        meta: { ...styleColumTable.md, gridLabel: text.list.table.requester },
      }),
      columnHelper.accessor((row) => row.farm?.description ?? '', {
        id: 'farm',
        header: text.list.table.farm,
        cell: ({ row }) => (
          <Text fontSize="sm" color="fg.muted" lineClamp="1">
            {row.original.farm?.description ?? '—'}
          </Text>
        ),
        meta: { ...styleColumTable.md, gridLabel: text.list.table.farm },
      }),
      columnHelper.accessor((row) => row.responsible?.name ?? '', {
        id: 'responsible',
        header: text.list.table.responsible,
        cell: ({ row }) => (
          <Text fontSize="sm" color="fg.muted" lineClamp="1">
            {row.original.responsible?.name ?? '—'}
          </Text>
        ),
        meta: { ...styleColumTable.md, gridLabel: text.list.table.responsible },
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
                onClick={() => navigate(`/administrativo/autorizacao/${row.original.uuid}`)}
              >
                {text.list.table.actions.view}
              </Actions.Item>
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
    [navigate, languageGB, text]
  );

  const gridSettings = useGridSettings<RequestAuthorizationListItem>({
    storageKey: autorizacaoStorageKey,
    storageScope: useGridStorageScope(),
    columns: defaultColumns,
  });
  const { columnOrder, setColumnOrder, columnVisibility, setColumnVisibility } = gridSettings;

  const isLoading = checkLoadingStatus([autorizacaoList]);
  const items = autorizacaoList.data?.data?.items;
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
            <>
              <GridSettingsFloatingPanel
                gridSettings={gridSettings}
                triggerLabel={languageGB.defaltStrings.gridSettings.trigger}
              />
            </>
          }
        >
          <PageHeader title={text.pageTitle} description={text.pageSubtitle} />
        </HeaderGrid>

        <ListToolbar
          search={listSearch.value}
          onSearch={listSearch.onChange}
          searchPlaceholder={languageGB.defaltStrings.searchList}
          onOpenFilter={onOpenFilter}
          filtersApplied={filtersApplied - (paginatedQuery.filter?.search ? 1 : 0)}
        />

        {/* Legenda de status — TODOS os 11 valores do enum (default do
            componente), fiel ao legado (CLM-40) mesmo esta fila filtrando só
            3 status (BR-01). Reuso cross-folder, mesmo componente já usado
            em `Rejeitados`/`Cotacoes`/`Solicitacao`. */}
        <Box mt={4}>
          <RequestPurchaseStatusLegend />
        </Box>

        <Box>
          <Table
            isLoading={isLoading}
            isError={autorizacaoList.isError}
            error={autorizacaoList.error}
            isEmpty={isEmpty}
            onRetry={() => autorizacaoList.refetch()}
            isRetrying={autorizacaoList.isFetching}
            emptyIcon={FileText as ElementType}
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
            canCreate={false}
            getRowHighlight={emergencyRowHighlight}
          />
        </Box>
      </TableProvider>

      <FilterSideAutorizacao
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
