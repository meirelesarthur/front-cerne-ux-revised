// src/pages/Dashboards/LivestockDashboard/blocks/ManejosPorMes.tsx
// Bloco "Manejos por mês" — `GroupedBarChart`, 3 séries reais que a API já
// publica lado a lado (`productive.weighings_count_by_month`,
// `productive.sanitary_management_by_month`,
// `productive.nutrition_management_by_month`, cada uma `{month,total}`).
//
// **CORREÇÃO PÓS-HOMOLOGAÇÃO (048, 3ª rodada):** o card só usava a série de
// pesagens (`MUD-046-01` vedava INVENTAR quebra por tipo quando o schema não
// distinguia — não é mais o caso, a API já entrega as 3 séries). Alinhamento
// pela chave `month` (união das 3 séries, ordem cronológica — string
// `YYYY-MM` ordena lexicograficamente = ordena por data); mês sem evento numa
// série vira `0` nela (`?? 0`), nunca é omitido (barras agrupadas sempre com
// as 3 colunas por mês).

import { GroupedBarChart } from '@/components/charts';
import { DashboardCard } from '@/components/Dashboard';

import { useLanguage } from '@/hooks/useLanguage';

import formatDate from '@/utils/formatDate';

import type { LivestockWeighingsMonthRow } from '@/@types/v2/Dashboards/livestockDashboard';

interface ManejosPorMesProps {
  weighings: LivestockWeighingsMonthRow[];
  sanitary: LivestockWeighingsMonthRow[];
  nutrition: LivestockWeighingsMonthRow[];
}

function totalsByMonth(rows: LivestockWeighingsMonthRow[], months: string[]): number[] {
  const byMonth = new Map(rows.map((row) => [row.month, row.total]));
  return months.map((month) => byMonth.get(month) ?? 0);
}

export function ManejosPorMes({ weighings, sanitary, nutrition }: ManejosPorMesProps) {
  const { languageGB } = useLanguage();
  const text = languageGB.dashboards.livestockDashboard.charts;

  const months = Array.from(
    new Set([...weighings, ...sanitary, ...nutrition].map((row) => row.month))
  ).sort();

  const labels = months.map((month) => formatDate(`${month}-01`, 'MM/yyyy'));
  const series = [
    { name: text.managementSeriesWeighings, data: totalsByMonth(weighings, months) },
    { name: text.managementSeriesSanitary, data: totalsByMonth(sanitary, months) },
    { name: text.managementSeriesNutrition, data: totalsByMonth(nutrition, months) },
  ];

  return (
    <DashboardCard title={text.managementTitle}>
      <GroupedBarChart series={series} labels={labels} height={220} />
    </DashboardCard>
  );
}
