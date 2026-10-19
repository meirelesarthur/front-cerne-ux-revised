// src/pages/Dashboards/FinancialDashboard/index.tsx
// Tela "Financeiro" (execução 048, TASK-04-FE) — fiel a
// `DashFinanceiro.tsx@8663490` **MENOS o bloco de heatmap "Atividade de
// receita por hora" (DEC-191 — CORTADO, PROIBIDO portar `HeatmapChart`)**.
// Dado real via `GET /dashboards/financial`. Filtro real é
// `year`/`month`/`cost_center_uuid`.
//
// **CORREÇÃO PÓS-E2E (048):** regra de ouro aplicada em TODO array/objeto
// lido aqui — `?? []`/`?? 0` antes de `.length`/`.map`/soma, nunca acesso
// direto que possa explodir em `undefined` (reconciliado contra
// `GB.Cerne.FrontEnd/e2e/_048-dash/financeiro.json`).

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

import formatCurrencyBRL from '@/utils/formatCurrencyBRL';

import { queryKey } from '@/constants/query-key';

import { getFinancialDashboard } from '@/services/v2/Dashboards/financialDashboard-service';

import type { FinancialDashboardFilterForm } from '@/@types/v2/Dashboards/financialDashboard';

import { DespesasPorCategoria } from './blocks/DespesasPorCategoria';
import { OrcamentoAnual } from './blocks/OrcamentoAnual';
import { PagamentosRecebimentosAtrasados } from './blocks/PagamentosRecebimentosAtrasados';
import { PosicaoPorCentroCusto } from './blocks/PosicaoPorCentroCusto';
import { ReceitasDespesasEvolucao } from './blocks/ReceitasDespesasEvolucao';
import { VencimentosProximos } from './blocks/VencimentosProximos';
import { FilterSideFinancialDashboard } from './FilterSideFinancialDashboard';
import { HeaderDashboard } from './HeaderDashboard';

const DEFAULT_FILTER: FinancialDashboardFilterForm = {
  year: null,
  month: null,
  costCenter: null,
};

export default function FinancialDashboard() {
  const { languageGB, languageInUse } = useLanguage();
  const text = languageGB.dashboards.financialDashboard;
  const commonText = languageGB.dashboards.common;

  const [isFilterOpen, setIsFilterOpen] = useState(false);
  // CORREÇÃO — decisão do dono (048): dashboard NÃO pagina, o filtro NÃO
  // vai mais para a URL (`usePaginatedQueryUrl` removido). Estado LOCAL
  // por requisição — resolve URL suja, flicker do contador e o crash
  // `dateString.match is not a function` no drawer de outros dashboards
  // (mesma correção sistêmica nos 5).
  const [filter, setFilter] = useState<FinancialDashboardFilterForm>(DEFAULT_FILTER);
  const handleFilterChange = setFilter;
  const handleResetFilter = () => setFilter(DEFAULT_FILTER);

  const year = filter.year?.value;
  const month = filter.month?.value;
  const costCenterUuid = filter.costCenter?.value;

  const filtersApplied = useMemo(
    () => (filter.year ? 1 : 0) + (filter.month ? 1 : 0) + (filter.costCenter ? 1 : 0),
    [filter]
  );

  const query = useQuery({
    queryKey: [
      queryKey.dashboards.financialDashboard,
      languageInUse,
      filter,
      year,
      month,
      costCenterUuid,
    ],
    queryFn: async () => {
      const response = await getFinancialDashboard({
        year,
        month,
        cost_center_uuid: costCenterUuid,
      });
      return response.data;
    },
  });

  const showSkeleton = useDelayedLoading(query.isPending);

  if (query.isPending) {
    return showSkeleton ? <DashboardSkeleton kpis={4} blocks={[200, 240, 220, 200]} /> : null;
  }

  const data = query.data;

  // Regra de ouro: TODO array/objeto lido com `?? []`/`?? 0` — nunca
  // acesso direto que possa explodir em `undefined`.
  const monthSummary = data?.month_summary ?? { incomes: 0, expenses: 0, balance: 0 };
  const twelveMonths = data?.twelve_months ?? [];
  const expensesByCategory = data?.by_category?.expenses ?? [];
  const overdue = data?.overdue ?? { payable_total: 0, receivable_total: 0, items: [] };
  const dueSoon = data?.due_soon ?? [];
  const byCostCenter = data?.by_cost_center ?? [];

  const isEmpty =
    !query.isError && (!data || (monthSummary.incomes === 0 && monthSummary.expenses === 0));

  return (
    <DashboardGrid>
      <HeaderDashboard filtersApplied={filtersApplied} onOpenFilter={() => setIsFilterOpen(true)} />

      {query.isError ? (
        <DashboardStateMessage
          icon={FiAlertTriangle}
          title={commonText.error.title}
          description={commonText.error.description}
          actionLabel={commonText.error.retry}
          onAction={() => query.refetch()}
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
                label={text.kpis.monthIncomes}
                value={formatCurrencyBRL(monthSummary.incomes)}
              />
              <DashboardKpiCard
                label={text.kpis.monthExpenses}
                value={formatCurrencyBRL(monthSummary.expenses)}
              />
              <DashboardKpiCard
                label={text.kpis.monthBalance}
                value={formatCurrencyBRL(monthSummary.balance)}
                valueColor={monthSummary.balance < 0 ? 'feedBack.errorMain' : undefined}
              />
              <DashboardKpiCard
                label={text.kpis.overdueTotal}
                value={formatCurrencyBRL(overdue.payable_total + overdue.receivable_total)}
                valueColor={
                  overdue.payable_total + overdue.receivable_total > 0
                    ? 'feedBack.warnMain'
                    : undefined
                }
              />
            </DashboardRow>

            <DashboardRow>
              <ReceitasDespesasEvolucao data={twelveMonths} />
              <DespesasPorCategoria data={expensesByCategory} />
            </DashboardRow>

            <DashboardRow>
              <OrcamentoAnual data={data.budget ?? null} />
              <PagamentosRecebimentosAtrasados data={overdue} />
            </DashboardRow>

            <DashboardRow>
              <VencimentosProximos data={dueSoon} />
              <PosicaoPorCentroCusto data={byCostCenter} />
            </DashboardRow>
          </>
        )
      )}

      <FilterSideFinancialDashboard
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
