// src/pages/Dashboards/CashbookDashboard/blocks/FluxoDeCaixa.tsx
// Bloco "Fluxo de caixa realizado" (LM-MON-01..05) — `LineChart` com 3
// séries (Entradas/Saídas/Saldo), 1 ponto por mês do ano filtrado. Mirror
// `fluxoSeries` da Referência UX (`DashLivroCaixa.tsx`).

import { LineChart } from '@/components/charts';
import { FocusableChartCard } from '@/components/Dashboard';

import { useLanguage } from '@/hooks/useLanguage';

import type { CashbookMonthRow } from '@/@types/v2/Dashboards/cashbookDashboard';

interface FluxoDeCaixaProps {
  data: CashbookMonthRow[];
}

export function FluxoDeCaixa({ data }: FluxoDeCaixaProps) {
  const { languageGB } = useLanguage();
  const text = languageGB.dashboards.cashbookDashboard.charts;

  const labels = data.map((row) => row.month_label);
  const series = [
    { name: text.cashFlowEntrance, data: data.map((row) => row.entrance) },
    { name: text.cashFlowExit, data: data.map((row) => row.exit) },
    { name: text.cashFlowBalance, data: data.map((row) => row.balance) },
  ];

  return (
    <FocusableChartCard
      title={text.cashFlowTitle}
      series={series}
      allLabel={languageGB.dashboards.common.allSeries}
    >
      {(focusedSeries) => (
        <LineChart
          series={focusedSeries}
          labels={labels}
          height={260}
          area
          showLegend={false}
          yFormat={(value) =>
            value >= 1_000_000
              ? `R$ ${(value / 1_000_000).toLocaleString('pt-BR', { maximumFractionDigits: 1 })}M`
              : `R$ ${(value / 1_000).toFixed(0)}K`
          }
        />
      )}
    </FocusableChartCard>
  );
}
