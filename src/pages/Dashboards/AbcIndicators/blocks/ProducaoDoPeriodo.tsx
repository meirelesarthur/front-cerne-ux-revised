// src/pages/Dashboards/AbcIndicators/blocks/ProducaoDoPeriodo.tsx
// Bloco "Produção do período" (`ABC-CHART-01a/b/c`, execução 046,
// TASK-ABC-FE-06) — `FocusableChartCard` + GroupedBarChart, 3 séries
// (Recria/Abate/Comercializado) sobre a única categoria do período filtrado.

import { GroupedBarChart } from '@/components/charts';
import { FocusableChartCard } from '@/components/Dashboard';

import { useLanguage } from '@/hooks/useLanguage';

import type { AbcIndicatorsData } from '@/@types/v2/Dashboards/abcIndicators';

interface ProducaoDoPeriodoProps {
  data: AbcIndicatorsData;
}

export function ProducaoDoPeriodo({ data }: ProducaoDoPeriodoProps) {
  const { languageGB } = useLanguage();
  const text = languageGB.dashboards.abcIndicators.charts;

  const labels = [text.productionTitle];
  const series = [
    { name: text.productionRearing, data: [data.total_production_rearing] },
    { name: text.productionSlaughter, data: [data.total_production_slaughter] },
    { name: text.productionComercialize, data: [data.total_comercialize] },
  ];

  return (
    <FocusableChartCard
      flex={3}
      title={text.productionTitle}
      series={series}
      allLabel={languageGB.dashboards.common.allSeries}
    >
      {(focusedSeries) => <GroupedBarChart series={focusedSeries} labels={labels} height={260} />}
    </FocusableChartCard>
  );
}
