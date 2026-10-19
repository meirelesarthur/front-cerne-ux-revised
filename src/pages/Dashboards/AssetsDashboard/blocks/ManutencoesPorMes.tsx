// src/pages/Dashboards/AssetsDashboard/blocks/ManutencoesPorMes.tsx
// Bloco "Manutenções por mês" (`AT-CHART-02`, execução 046, TASK-AT-FE-08) —
// ATV-11-front (048-dashboards, correções de homologação): o back passou a
// publicar a quebra Corretiva×Preventiva por mês (`corrective`/`preventive`,
// substitui o `total` único do `MUD-046-01` — a lacuna `manutencoes_por_mes`
// foi removida). `GroupedBarChart` com 2 séries, mesmo padrão de
// `LivestockDashboard/blocks/ManejosPorMes.tsx`.

import { GroupedBarChart } from '@/components/charts';
import { DashboardCard } from '@/components/Dashboard';

import { useLanguage } from '@/hooks/useLanguage';

import formatDate from '@/utils/formatDate';

import type { AssetsMaintenanceRow } from '@/@types/v2/Dashboards/assetsDashboard';

interface ManutencoesPorMesProps {
  data: AssetsMaintenanceRow[];
}

export function ManutencoesPorMes({ data }: ManutencoesPorMesProps) {
  const { languageGB } = useLanguage();
  const text = languageGB.dashboards.assetsDashboard.charts;

  const labels = data.map((row) => formatDate(`${row.month}-01`, 'MM/yyyy'));
  const series = [
    { name: text.maintenanceByMonthCorrective, data: data.map((row) => row.corrective) },
    { name: text.maintenanceByMonthPreventive, data: data.map((row) => row.preventive) },
  ];

  return (
    <DashboardCard title={text.maintenanceByMonthTitle}>
      <GroupedBarChart series={series} labels={labels} height={220} />
    </DashboardCard>
  );
}
