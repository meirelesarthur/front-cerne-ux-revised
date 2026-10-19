// src/pages/Dashboards/AbcIndicators/blocks/OcupacaoDoModulo.tsx
// Bloco "Ocupação do módulo" (`ABC-CHART-02a/b`, execução 046, TASK-ABC-FE-07)
// — DonutChart: Período de uso × Período de desocupação (dias).

import { DonutChart } from '@/components/charts';
import { DashboardCard } from '@/components/Dashboard';

import { useLanguage } from '@/hooks/useLanguage';

import type { AbcIndicatorsData } from '@/@types/v2/Dashboards/abcIndicators';

interface OcupacaoDoModuloProps {
  data: AbcIndicatorsData;
}

export function OcupacaoDoModulo({ data }: OcupacaoDoModuloProps) {
  const { languageGB } = useLanguage();
  const text = languageGB.dashboards.abcIndicators.charts;

  const total = data.days_filled + data.days_empty;
  const slices = [
    { label: text.occupancyFilled, value: data.days_filled },
    { label: text.occupancyEmpty, value: data.days_empty },
  ];

  return (
    <DashboardCard flex={2} title={text.occupancyTitle}>
      <DonutChart
        data={slices}
        height={220}
        centerValue={String(total)}
        centerLabel={text.occupancyCenterLabel}
        showLegend
      />
    </DashboardCard>
  );
}
