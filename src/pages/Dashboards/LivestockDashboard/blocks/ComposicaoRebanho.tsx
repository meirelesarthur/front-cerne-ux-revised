// src/pages/Dashboards/LivestockDashboard/blocks/ComposicaoRebanho.tsx
// Bloco "Composição do rebanho (categoria)" — `DonutChart`, catálogo REAL
// (42 categorias, DEC-101) agrupado top-N + "Outros" no cliente, mesma
// técnica de `ComposicaoPorRaca.tsx`.
//
// **CORREÇÃO PÓS-E2E (048):** campo real é `row.total` (não `row.count`) —
// mesmo bug/causa-raiz de `ComposicaoPorRaca.tsx` (ver comentário lá).

import { DonutChart } from '@/components/charts';
import { DashboardCard } from '@/components/Dashboard';

import { useLanguage } from '@/hooks/useLanguage';

import { groupLivestockTopN } from '@/constants/dashboards/livestockDashboard/livestock-top-n';

import type { LivestockCategoryRow } from '@/@types/v2/Dashboards/livestockDashboard';

interface ComposicaoRebanhoProps {
  data: LivestockCategoryRow[];
}

export function ComposicaoRebanho({ data }: ComposicaoRebanhoProps) {
  const { languageGB } = useLanguage();
  const text = languageGB.dashboards.livestockDashboard.charts;

  const total = data.reduce((sum, row) => sum + row.total, 0);
  const slices = groupLivestockTopN(data, text.categoryOthers);

  return (
    <DashboardCard flex={1} minWidth={300} title={text.categoryTitle}>
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
