// src/pages/Dashboards/LivestockDashboard/blocks/ComposicaoPorRaca.tsx
// Bloco "Composição por raça" — `DonutChart`, catálogo REAL (35 raças,
// DEC-101) agrupado top-N + "Outros" no cliente (`groupLivestockTopN`) —
// NUNCA hardcoda os 5 nomes de exemplo do UX (Angus/Brangus/Cruzado/
// Nelore/Senepol).
//
// **CORREÇÃO PÓS-E2E (048):** campo real é `row.total` (não `row.count`,
// nome antigo especulativo) — com `count` sempre `undefined`, todo slice
// caía em `DonutChart.isEmpty` (`!value` de `undefined` é `true`) e o
// gráfico renderizava um `<Box>` vazio, sem `<svg>`/`<path>` nenhum.
// `DonutChart` já usa `ResponsiveContainer`+`isAnimationActive={false}`
// (kit compartilhado, execução 046) — não era o problema.

import { DonutChart } from '@/components/charts';
import { DashboardCard } from '@/components/Dashboard';

import { useLanguage } from '@/hooks/useLanguage';

import { groupLivestockTopN } from '@/constants/dashboards/livestockDashboard/livestock-top-n';

import type { LivestockBreedRow } from '@/@types/v2/Dashboards/livestockDashboard';

interface ComposicaoPorRacaProps {
  data: LivestockBreedRow[];
}

export function ComposicaoPorRaca({ data }: ComposicaoPorRacaProps) {
  const { languageGB } = useLanguage();
  const text = languageGB.dashboards.livestockDashboard.charts;

  const total = data.reduce((sum, row) => sum + row.total, 0);
  const slices = groupLivestockTopN(data, text.breedOthers);

  return (
    <DashboardCard flex={1} minWidth={300} title={text.breedTitle}>
      <DonutChart
        data={slices}
        height={220}
        centerValue={String(total)}
        showLegend
        valueFormat={(value) => String(value)}
      />
    </DashboardCard>
  );
}
