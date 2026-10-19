// src/pages/Dashboards/CashbookDashboard/index.tsx
// Tela "Livro Caixa" (execução 048, TASK-03-FE) — fiel a
// `DashLivroCaixa.tsx@8663490` (ver `contrato-cashbook-dashboard-norm.md`).
// Backend JÁ EXISTE (`CashBookDashboardController`) — escopo REDUZIDO,
// consome o payload publicado sem recriar rota. 2 queries compostas
// (dashboard + movements do mês) — `checkLoadingStatus` para o Skeleton
// único (TASK-03-FE §"Hooks"). Decisão UX: lista inline de movimentações,
// sem modal (mesmo endpoint alimenta os dois — adaptação de apresentação,
// não perda de dado).

import { useMemo, useState } from 'react';

import { useQuery } from '@tanstack/react-query';
import { FiAlertTriangle, FiDollarSign } from 'react-icons/fi';

import {
  DashboardGrid,
  DashboardKpiCard,
  DashboardRow,
  DashboardSkeleton,
  DashboardStateMessage,
} from '@/components/Dashboard';

import { useDelayedLoading } from '@/hooks/useDelayedLoading';
import { useLanguage } from '@/hooks/useLanguage';

import { checkLoadingStatus } from '@/utils/checkLoadingStatus';
import formatCurrencyBRL from '@/utils/formatCurrencyBRL';

import { cashbookOperationOptions } from '@/constants/dashboards/cashbookDashboard/options/cashbook-operation-options';
import { queryKey } from '@/constants/query-key';

import {
  getCashbookDashboard,
  getCashbookMovements,
} from '@/services/v2/Dashboards/cashbookDashboard-service';

import type { CashbookDashboardFilterForm } from '@/@types/v2/Dashboards/cashbookDashboard';

import { FluxoDeCaixa } from './blocks/FluxoDeCaixa';
import { SaldoPorConta } from './blocks/SaldoPorConta';
import { UltimasMovimentacoes } from './blocks/UltimasMovimentacoes';
import { FilterSideCashbookDashboard } from './FilterSideCashbookDashboard';
import { HeaderDashboard } from './HeaderDashboard';

const CURRENT_YEAR = new Date().getFullYear();

export default function CashbookDashboard() {
  const { languageGB, languageInUse } = useLanguage();
  const text = languageGB.dashboards.cashbookDashboard;
  const commonText = languageGB.dashboards.common;

  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [movementsMonth, setMovementsMonth] = useState(() => new Date().getMonth() + 1);

  // Default do form — `operation: 'A'` com o rótulo REAL traduzido (nunca
  // string vazia), mesmo racional de `assetsPeriodOptions.getOption`.
  // Memoizado por `languageGB` (o rótulo traduzido muda com o idioma).
  // CORREÇÃO — decisão do dono (048): dashboard NÃO pagina, o filtro NÃO
  // vai mais para a URL (`usePaginatedQueryUrl` removido). Estado LOCAL
  // por requisição — resolve URL suja, flicker do contador (loop de
  // resync com a URL) e o crash `dateString.match is not a function` no
  // drawer de outros dashboards (`reviveFilterData` da URL reidratava
  // datas como `Date`; com estado local elas nunca saem de `string
  // yyyy-MM-dd`/`null`).
  const defaultFilter = useMemo<CashbookDashboardFilterForm>(
    () => ({
      year: { label: String(CURRENT_YEAR), value: CURRENT_YEAR },
      proprietary: null,
      operation: cashbookOperationOptions.getOption('A', languageGB),
    }),
    [languageGB]
  );

  const [filter, setFilter] = useState<CashbookDashboardFilterForm>(defaultFilter);
  const handleFilterChange = setFilter;
  const handleResetFilter = () => setFilter(defaultFilter);

  const year = filter.year?.value ?? CURRENT_YEAR;
  const proprietaryUuid = filter.proprietary?.value;
  const operation = filter.operation?.value ?? 'A';

  const filtersApplied = useMemo(
    () =>
      (filter.year && filter.year.value !== CURRENT_YEAR ? 1 : 0) +
      (filter.proprietary ? 1 : 0) +
      (filter.operation && filter.operation.value !== 'A' ? 1 : 0),
    [filter]
  );

  const dashboardQuery = useQuery({
    queryKey: [
      queryKey.dashboards.cashbookDashboard,
      languageInUse,
      filter,
      year,
      proprietaryUuid,
      operation,
    ],
    queryFn: async () => {
      const response = await getCashbookDashboard({
        year,
        proprietary_id: proprietaryUuid,
        operation,
      });
      return response.data;
    },
  });

  const movementsQuery = useQuery({
    queryKey: [
      queryKey.dashboards.cashbookDashboardMovements,
      languageInUse,
      year,
      movementsMonth,
      proprietaryUuid,
      operation,
    ],
    queryFn: async () => {
      const response = await getCashbookMovements({
        year,
        month: movementsMonth,
        proprietary_id: proprietaryUuid,
        operation,
      });
      return response.data;
    },
  });

  const showSkeleton = useDelayedLoading(checkLoadingStatus([dashboardQuery]));

  if (dashboardQuery.isPending) {
    return showSkeleton ? <DashboardSkeleton kpis={4} blocks={[260, 220]} /> : null;
  }

  const data = dashboardQuery.data;

  // Regra de ouro: TODO array lido com `?? []` — nunca acesso direto que
  // possa explodir em `undefined`.
  const accounts = data?.accounts ?? [];
  const months = data?.months ?? [];

  const isEmpty =
    !dashboardQuery.isError &&
    (!data ||
      (accounts.length === 0 && data.kpis.total_entrance === 0 && data.kpis.total_exit === 0));

  return (
    <DashboardGrid>
      <HeaderDashboard filtersApplied={filtersApplied} onOpenFilter={() => setIsFilterOpen(true)} />

      {dashboardQuery.isError ? (
        <DashboardStateMessage
          icon={FiAlertTriangle}
          title={commonText.error.title}
          description={commonText.error.description}
          actionLabel={commonText.error.retry}
          onAction={() => dashboardQuery.refetch()}
        />
      ) : isEmpty ? (
        <DashboardStateMessage
          icon={FiDollarSign}
          title={commonText.empty.title}
          description={commonText.empty.description}
        />
      ) : (
        data && (
          <>
            <DashboardRow>
              <DashboardKpiCard
                label={text.kpis.totalEntrance}
                value={formatCurrencyBRL(data.kpis.total_entrance)}
                trend={
                  data.kpis.entrance_variation != null ? `${data.kpis.entrance_variation}%` : null
                }
                up={(data.kpis.entrance_variation ?? 0) >= 0}
                sub={data.kpis.entrance_variation != null ? text.kpis.vsLastYear : undefined}
              />
              <DashboardKpiCard
                label={text.kpis.totalExit}
                value={formatCurrencyBRL(data.kpis.total_exit)}
                trend={data.kpis.exit_variation != null ? `${data.kpis.exit_variation}%` : null}
                up={(data.kpis.exit_variation ?? 0) < 0}
                sub={data.kpis.exit_variation != null ? text.kpis.vsLastYear : undefined}
              />
              <DashboardKpiCard
                label={text.kpis.totalBalance}
                value={formatCurrencyBRL(data.kpis.total_balance)}
                trend={`${data.kpis.balance_percentage}%`}
                up={data.kpis.balance_percentage >= 0}
                sub={text.kpis.vsLastYear}
              />
              <DashboardKpiCard
                label={text.kpis.projectedBalance}
                value={formatCurrencyBRL(data.kpis.projected_balance)}
                sub={text.kpis.projectedBalanceNote}
              />
            </DashboardRow>

            <FluxoDeCaixa data={months} />

            <DashboardRow>
              <UltimasMovimentacoes
                data={movementsQuery.data ?? []}
                month={movementsMonth}
                onMonthChange={setMovementsMonth}
                isLoading={movementsQuery.isPending}
              />
              <SaldoPorConta data={accounts} />
            </DashboardRow>
          </>
        )
      )}

      <FilterSideCashbookDashboard
        isOpen={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
        handleReset={handleResetFilter}
        handleFilterChange={handleFilterChange}
        filter={filter}
        languageGB={languageGB}
        filtersApplied={filtersApplied}
      />
    </DashboardGrid>
  );
}
