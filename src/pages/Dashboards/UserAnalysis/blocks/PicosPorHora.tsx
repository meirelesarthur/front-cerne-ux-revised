// src/pages/Dashboards/UserAnalysis/blocks/PicosPorHora.tsx
// Bloco "Picos de acesso por hora" (`UA-CHART-03`, execução 046,
// TASK-UA-FE-07) — originalmente `FocusableChartCard` + StackedBarChart
// quebrado por canal (Web/Mobile/API), com badge "Estimado" porque o canal
// era heurística declarada (`DEC-046-E`, `meta.proxies[]`/`MUD-046-04`).
//
// CORREÇÃO PÓS-HOMOLOGAÇÃO (048) — decisão do dono: a quebra por canal é só
// estimativa (quase tudo cai em Web) e não agrega leitura confiável.
// Simplificado para SÉRIE ÚNICA — soma `web + mobile + api` por hora no
// cliente (o back continua entregando os 3 campos; a soma é front-only).
// Sem legenda de canal e sem o badge "Estimado" DESTE card (a estimativa
// existia só por causa da heurística de canal; a série única é contagem
// honesta). `DashboardCard` simples, sem foco de série — mesmo padrão de
// `AcessosDiarios.tsx` para gráfico de série única.

import { StackedBarChart } from '@/components/charts';
import { DashboardCard } from '@/components/Dashboard';

import { useLanguage } from '@/hooks/useLanguage';

import type { UserAnalysisHourlyPoint } from '@/@types/v2/Dashboards/userAnalysis';

interface PicosPorHoraProps {
  data: UserAnalysisHourlyPoint[];
}

export function PicosPorHora({ data }: PicosPorHoraProps) {
  const { languageGB } = useLanguage();
  const text = languageGB.dashboards.userAnalysis.charts;

  const labels = data.map(
    (point) => `${String(point.hour).padStart(2, '0')}${text.hourlyPeaksHourSuffix}`
  );
  const series = [
    {
      name: text.hourlyPeaksSeries,
      data: data.map((point) => point.web + point.mobile + point.api),
    },
  ];

  return (
    <DashboardCard title={text.hourlyPeaksTitle}>
      <StackedBarChart series={series} labels={labels} height={260} showLegend={false} />
    </DashboardCard>
  );
}
