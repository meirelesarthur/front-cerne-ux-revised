// src/pages/Dashboards/AssetsDashboard/blocks/AtivosPorCategoria.tsx
// Bloco "Ativos por categoria" (`AT-CHART-01`, execução 046, TASK-AT-FE-06) —
// `FocusableChartCard` + GroupedBarChart, eixo Família preservado do legado,
// medida (Total × Em operação) adotada do desenho UX (`DECISAO_DE_ESCOPO`
// já resolvida).

import { GroupedBarChart } from '@/components/charts';
import { FocusableChartCard } from '@/components/Dashboard';

import { useLanguage } from '@/hooks/useLanguage';

import type { AssetsCategoryRow } from '@/@types/v2/Dashboards/assetsDashboard';

interface AtivosPorCategoriaProps {
  data: AssetsCategoryRow[];
}

export function AtivosPorCategoria({ data }: AtivosPorCategoriaProps) {
  const { languageGB } = useLanguage();
  const text = languageGB.dashboards.assetsDashboard.charts;

  const labels = data.map((row) => row.label);
  const series = [
    { name: text.byCategoryTotal, data: data.map((row) => row.total) },
    { name: text.byCategoryInOperation, data: data.map((row) => row.in_operation ?? 0) },
  ];

  return (
    <FocusableChartCard
      flex={3}
      title={text.byCategoryTitle}
      series={series}
      allLabel={languageGB.dashboards.common.allSeries}
    >
      {(focusedSeries) => <GroupedBarChart series={focusedSeries} labels={labels} height={260} />}
    </FocusableChartCard>
  );
}
