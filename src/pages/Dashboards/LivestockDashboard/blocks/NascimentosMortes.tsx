// src/pages/Dashboards/LivestockDashboard/blocks/NascimentosMortes.tsx
// Bloco "Nascimentos/Mortes do período" — 2 `DashboardKpiCard`, dado NOVO
// (`reproductive.births`/`reproductive.deaths`, agregação de
// `birth_animals` vs `death_animals`+`loss_animals` no período,
// `DECISOES-048.md §A`). Renderizado como CARD FLAT na tela única — não é
// uma aba "Reprodutivo" (ver nota em
// `@/@types/v2/Dashboards/livestockDashboard`).

import { DashboardKpiCard, DashboardRow } from '@/components/Dashboard';

import { useLanguage } from '@/hooks/useLanguage';

import type { LivestockPeriodCount } from '@/@types/v2/Dashboards/livestockDashboard';

interface NascimentosMortesProps {
  births: LivestockPeriodCount;
  deaths: LivestockPeriodCount;
}

export function NascimentosMortes({ births, deaths }: NascimentosMortesProps) {
  const { languageGB } = useLanguage();
  const text = languageGB.dashboards.livestockDashboard.kpis;

  return (
    <DashboardRow>
      <DashboardKpiCard label={text.births} value={String(births.total)} sub={births.period} />
      <DashboardKpiCard
        label={text.deaths}
        value={String(deaths.total)}
        sub={deaths.period}
        valueColor={deaths.total > 0 ? 'feedBack.errorMain' : undefined}
      />
    </DashboardRow>
  );
}
