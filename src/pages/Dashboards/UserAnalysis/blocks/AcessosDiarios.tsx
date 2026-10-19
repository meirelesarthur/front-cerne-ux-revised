// src/pages/Dashboards/UserAnalysis/blocks/AcessosDiarios.tsx
// Bloco "Acessos diários" (`UA-CHART-01`, execução 046, TASK-UA-FE-05) —
// LineChart area, série única "Sessões" (`COUNT(*)` por dia, `DEC-046-D`).

import { LineChart } from '@/components/charts';
import { DashboardCard } from '@/components/Dashboard';

import { useLanguage } from '@/hooks/useLanguage';

import formatDate from '@/utils/formatDate';

import type { UserAnalysisDailyPoint } from '@/@types/v2/Dashboards/userAnalysis';

interface AcessosDiariosProps {
  data: UserAnalysisDailyPoint[];
}

export function AcessosDiarios({ data }: AcessosDiariosProps) {
  const { languageGB } = useLanguage();
  const text = languageGB.dashboards.userAnalysis.charts;

  const labels = data.map((point) => formatDate(point.date, 'dd/MM'));
  const series = [
    {
      name: text.dailyAccessSeries,
      data: data.map((point) => point.value),
    },
  ];

  return (
    <DashboardCard flex={2} title={text.dailyAccessTitle}>
      <LineChart series={series} labels={labels} height={260} area showLegend={false} />
    </DashboardCard>
  );
}
