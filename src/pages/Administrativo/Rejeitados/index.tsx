// src/pages/Administrativo/Rejeitados/index.tsx
// -----------------------------------------------------------------------------
// Tela de LISTAGEM (grid) "Rejeitados / Cancelados" — Solicitações de Compra
// com `status IN (5, 10)` (RequestPurchase — Administrativo / Suprimentos,
// esteira 97-Esteiras/022, TASK-RP-FE-13, GRUPO B).
//
// Mirror ESTRUTURAL de `Administrativo/MeusProcessos/index.tsx`/
// `Administrativo/Solicitacao/index.tsx` — só troca a função consumida
// (`listRejectedRequestPurchases`, já escrita em `TASK-RP-FE-06`) e a
// queryKey/storageKey (`rejectedList`, própria).
//
// Rota `/administrativo/rejeitados` em `router/index.tsx`, guardada por
// `rejected-requests_view` (igual ao legado e ao que `GET /request-purchases/
// rejected` exige desde a T-081-API-03; supera o GAP-UX-CPS-01 da execução 036).
// `navigationPermissions.ts["adm-sup-rej"]` usa o mesmo slug (T-081-FE-02).
//
// Execução 081, T-081-FE-07 (LEGADO-SUPRIMENTOS-04, RC01..RC09, LF01..LF05):
// - colunas do legado em `rejectedColumns.tsx` (Código, Dt. Pedido,
//   Descrição/Chamado, Duração, Solicitante, Responsável Atual, Fazenda, Ação);
// - filtros do legado: busca por descrição/chamado/código, Tipo e Pedido /
//   Dt. Início e Dt. Fim, aplicados pelo servidor (`search`, `type`,
//   `date_from`, `date_to`);
// - ordem por código decrescente e 10 por página vêm da API;
// - "Visualizar" e "Relatório SLA" (nova aba, gate `status-sla_report_view`).
// -----------------------------------------------------------------------------

import { useMemo } from 'react';

import { Box, Text, useDisclosure } from '@chakra-ui/react';
import { FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { ContainerGrid } from '@/components/ContainerGrid';
import { GridSettingsFloatingPanel } from '@/components/GridSettings/GridSettingsFloatingPanel';
import { HeaderGrid } from '@/components/HeaderGrid';
import { canSlaReport, openSlaReport } from '@/components/Suprimentos/slaReport';
import { Table } from '@/components/Table';

import { TableProvider } from '@/contexts/TableContext';

import { useCustomGridQuery } from '@/hooks/useCustomGridQuery';
import { useGridSettings } from '@/hooks/useGridSettings';
import { useGridStorageScope } from '@/hooks/useGridStorageScope';
import { useLanguage } from '@/hooks/useLanguage';
import { userPaginatedQuery } from '@/hooks/usePaginatedQueryStorage';
import { usePermissions } from '@/hooks/usePermissions';

import { checkLoadingStatus } from '@/utils/checkLoadingStatus';

import { queryKey } from '@/constants/query-key';

import { listRejectedRequestPurchases } from '@/services/v2/RequestPurchases/request-purchase-service';

import type {
  RequestPurchaseFilterForm,
  RequestPurchaseListItem,
} from '@/@types/v2/RequestPurchases';

import { buildRejectedColumns } from './rejectedColumns';

import {
  FilterSideSolicitacao,
  type SolicitacaoFilterField,
} from '../Solicitacao/FilterSideSolicitacao';
import { RequestPurchaseStatusLegend } from '../Solicitacao/RequestPurchaseStatusLegend';

import { PageHeader } from '@/components/ui/PageHeader';

import { ListToolbar } from '@/components/ui/ListToolbar';
import { useListSearch } from '@/hooks/useListSearch';

// Filtros do legado em Rejeitados: busca, Tipo e as duas datas (sem Status).
const REJECTED_FILTER_FIELDS: SolicitacaoFilterField[] = ['search', 'type', 'date_from', 'date_to'];

export default function RejeitadosList() {
  const { languageGB } = useLanguage();
  const navigate = useNavigate();
  const { can } = usePermissions();
  const text = languageGB.requestPurchases.requestPurchase;

  // "Visualizar": `rejected-requests_view` no legado (AR01); a tela de destino
  // exige `request-purchases_view`, então o botão só aparece com as duas.
  const canView = can('rejected-requests_view') && can('request-purchases_view');
  const canSla = canSlaReport(can);

  const rejectedStorageKey = text.rejected.titleModule + queryKey.requestPurchases.rejectedList;

  const defaultQueryOptions = useMemo(
    () => ({
      pageSize: 10,
      storageKey: rejectedStorageKey,
    }),
    []
  );

  const { paginatedQuery, handlePaginatedQuery, handleFilterChange, handleResetFilter } =
    userPaginatedQuery<RequestPurchaseFilterForm>(defaultQueryOptions);
  const listSearch = useListSearch(paginatedQuery.filter, handleFilterChange);

  const { open: isFilterOpen, onOpen: onOpenFilter, onClose: onCloseFilter } = useDisclosure();

  const filtersApplied = useMemo(
    () =>
      Object.values(paginatedQuery.filter ?? {}).filter(
        (v) => v !== undefined && v !== null && v !== '' && v !== false
      ).length,
    [paginatedQuery.filter]
  );

  const rejectedList = useCustomGridQuery<RequestPurchaseListItem, RequestPurchaseFilterForm>({
    asyncFunction: listRejectedRequestPurchases,
    queryKey: queryKey.requestPurchases.rejectedList,
    paginatedQuery,
    setPaginatedQuery: handlePaginatedQuery,
    filterQuery: [],
    filter: paginatedQuery.filter ?? ({} as RequestPurchaseFilterForm),
  });

  const defaultColumns = useMemo(
    () =>
      buildRejectedColumns({
        text,
        canView,
        canSla,
        onView: (uuid) => navigate(`/administrativo/solicitacao/${uuid}/visualizar`),
        onSlaReport: openSlaReport,
      }),
    [navigate, text, canView, canSla]
  );

  const gridSettings = useGridSettings<RequestPurchaseListItem>({
    storageKey: rejectedStorageKey,
    storageScope: useGridStorageScope(),
    columns: defaultColumns,
  });
  const { columnOrder, setColumnOrder, columnVisibility, setColumnVisibility } = gridSettings;

  const isLoading = checkLoadingStatus([rejectedList]);
  const items = rejectedList.data?.data?.items;
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
          <PageHeader title={text.rejected.pageTitle} description={text.rejected.pageSubtitle} />
        </HeaderGrid>

        <ListToolbar
          search={listSearch.value}
          onSearch={listSearch.onChange}
          searchPlaceholder={languageGB.defaltStrings.searchList}
          onOpenFilter={onOpenFilter}
          filtersApplied={filtersApplied - (paginatedQuery.filter?.search ? 1 : 0)}
        />

        {/* Legenda de status (acréscimo do novo, D-01 manter). */}
        <Box mt={4}>
          <RequestPurchaseStatusLegend />
        </Box>

        <Box>
          <Table
            isLoading={isLoading}
            isError={rejectedList.isError}
            error={rejectedList.error}
            isEmpty={isEmpty}
            onRetry={() => rejectedList.refetch()}
            isRetrying={rejectedList.isFetching}
            emptyIcon={FileText}
            emptyTitle={
              filtersApplied > 0 ? text.list.emptyState.titleFiltered : text.supply.list.empty
            }
            emptyDescription={filtersApplied > 0 ? text.list.emptyState.descriptionFiltered : ''}
            canCreate={false}
          />
        </Box>
      </TableProvider>

      <FilterSideSolicitacao
        isOpen={isFilterOpen}
        onClose={onCloseFilter}
        handleFilterChange={handleFilterChange}
        handleReset={handleResetFilter}
        filter={paginatedQuery.filter}
        languageGB={languageGB}
        visibleFields={REJECTED_FILTER_FIELDS}
      />
    </ContainerGrid>
  );
}
