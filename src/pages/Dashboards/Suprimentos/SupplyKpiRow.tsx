// src/pages/Dashboards/Suprimentos/SupplyKpiRow.tsx
// -----------------------------------------------------------------------------
// Fileira 1 — 4 KPIs com sparkline e variação (Tarefa 56, contrato de tela
// v2 §5.2/§6.2). 1 `DashboardKpiCard` por item de `kpis[]` (ordem fixa do
// backend), com `SparklineArea` no slot `children` (aditivo da Tarefa 55).
//
// Cor/ícone de tendência e cor da sparkline são FUNÇÃO de
// `variation_direction` — NUNCA heurística local sobre os pontos do array
// (AD-V2-07/contrato de tela §6.2 "Riscos" item 2). `variation_percentage:
// null` (cresceu de base zero) mostra o texto alternativo i18n
// `kpis.noBaseline`, nunca `"null%"`.
// -----------------------------------------------------------------------------

import { SparklineArea } from '@/components/charts/SparklineArea';
import { DashboardKpiCard, DashboardRow } from '@/components/ui/DashboardGrid';

import { useLanguage } from '@/hooks/useLanguage';

import type { SupplyDashboardKpi } from '@/@types/v2/SupplyDashboard';

function formatVariationPercentage(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'percent',
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(value / 100);
}

export interface SupplyKpiRowProps {
  kpis: SupplyDashboardKpi[];
}

export function SupplyKpiRow({ kpis }: SupplyKpiRowProps) {
  const { languageGB } = useLanguage();
  const text = languageGB.supplyDashboard.kpis;

  return (
    <DashboardRow>
      {kpis.map((kpi) => {
        const trend =
          kpi.variation_percentage !== null
            ? `${formatVariationPercentage(kpi.variation_percentage)} ${text.vsPreviousPeriod}`
            : text.noBaseline;

        return (
          <DashboardKpiCard
            key={kpi.stage}
            label={kpi.label}
            value={String(kpi.value)}
            trend={trend}
            direction={kpi.variation_direction}
          >
            <SparklineArea
              data={kpi.sparkline}
              color={kpi.variation_direction === 'down' ? 'feedBack.errorMain' : 'chart.series.0'}
              height={60}
            />
          </DashboardKpiCard>
        );
      })}
    </DashboardRow>
  );
}
