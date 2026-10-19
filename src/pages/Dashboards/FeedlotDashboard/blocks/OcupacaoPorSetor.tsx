// src/pages/Dashboards/FeedlotDashboard/blocks/OcupacaoPorSetor.tsx
// Bloco "Ocupação por setor" (`LC-CHART-02`, execução 046, TASK-LC-FE-07) —
// `FocusableChartCard` + StackedBarChart horizontal, séries "Alojados"/
// "Disponível" (mirror `C-009`: empilha `animals_count` e
// `max(0, capacity-animals)`).

import { StackedBarChart } from '@/components/charts';
import { FocusableChartCard } from '@/components/Dashboard';

import { useLanguage } from '@/hooks/useLanguage';

import type { FeedlotSectorRow } from '@/@types/v2/Dashboards/feedlotDashboard';

interface OcupacaoPorSetorProps {
  data: FeedlotSectorRow[];
}

export function OcupacaoPorSetor({ data }: OcupacaoPorSetorProps) {
  const { languageGB } = useLanguage();
  const text = languageGB.dashboards.feedlotDashboard.charts;

  const labels = data.map((sector) => sector.name);
  const series = [
    { name: text.sectorOccupancyAllocated, data: data.map((sector) => sector.allocated) },
    { name: text.sectorOccupancyAvailable, data: data.map((sector) => sector.available) },
  ];

  return (
    <FocusableChartCard
      title={text.sectorOccupancyTitle}
      series={series}
      allLabel={languageGB.dashboards.common.allSeries}
    >
      {(focusedSeries) => (
        <StackedBarChart series={focusedSeries} labels={labels} height={260} horizontal />
      )}
    </FocusableChartCard>
  );
}
