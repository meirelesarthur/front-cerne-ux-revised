// src/pages/Dashboards/FinancialDashboard/blocks/ReceitasDespesasEvolucao.tsx
// Bloco "Receitas vs despesas (12 meses)" (`S-BLOCK-04`) — `LineChart`, 2
// séries reais (`twelve_months[].incomes/expenses`). Ocupa o espaço visual
// do heatmap CORTADO (DEC-191) sem portar `HeatmapChart` nenhum.
//
// **CORREÇÃO PÓS-E2E (048):** `row.month` é STRING `"YYYY-MM"` (ex.
// `"2025-10"`), não `number` 1-12 — a versão anterior fazia
// `String(row.month).padStart(2,'0')` sobre uma string já completa,
// produzindo uma data inválida (`formatDate` retornava `''`, rótulos do
// eixo em branco).

import { LineChart } from '@/components/charts';
import { FocusableChartCard } from '@/components/Dashboard';

import { useLanguage } from '@/hooks/useLanguage';

import formatDate from '@/utils/formatDate';

import type { FinancialTwelveMonthRow } from '@/@types/v2/Dashboards/financialDashboard';

interface ReceitasDespesasEvolucaoProps {
  data: FinancialTwelveMonthRow[];
}

export function ReceitasDespesasEvolucao({ data }: ReceitasDespesasEvolucaoProps) {
  const { languageGB } = useLanguage();
  const text = languageGB.dashboards.financialDashboard.evolution;

  const labels = data.map((row) => formatDate(`${row.month}-01`, 'MMM/yy'));
  const series = [
    { name: text.incomesSeries, data: data.map((row) => row.incomes) },
    { name: text.expensesSeries, data: data.map((row) => row.expenses) },
  ];

  const yFormat = (value: number) =>
    value >= 1_000_000
      ? `R$ ${(value / 1_000_000).toLocaleString('pt-BR', { maximumFractionDigits: 1 })}M`
      : `R$ ${(value / 1_000).toFixed(0)}K`;

  return (
    <FocusableChartCard
      flex={2}
      title={text.title}
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
          yFormat={yFormat}
        />
      )}
    </FocusableChartCard>
  );
}
