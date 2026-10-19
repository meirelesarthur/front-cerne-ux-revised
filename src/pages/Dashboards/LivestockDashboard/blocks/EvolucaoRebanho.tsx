// src/pages/Dashboards/LivestockDashboard/blocks/EvolucaoRebanho.tsx
// Bloco "Evolução do rebanho" — `LineChart`, mensal real.
//
// **CORREÇÃO PÓS-HOMOLOGAÇÃO (048, 2ª rodada):** multi-série POR CATEGORIA
// (`herd_evolution_by_category[].categories[]{category_uuid,label,total}`)
// — uma linha por categoria real (Fêmeas 0-12/13-24/25-36/>36 meses,
// Machos idem, etc.), legenda com o NOME de cada categoria (`chart.series`
// configurado com `name: cat.label`, mirror `ReceitasDespesasEvolucao.tsx`
// — diferente do `DonutChart`, aqui o `Chart.Legend` já resolve o nome
// certo porque `useChart({series})` é passado). Campo NOVO e opcional —
// **fallback**: sem `herd_evolution_by_category` (ou vazio), volta para a
// linha única de total (`herd_evolution[].headcount`, comportamento
// anterior), sem crash (`?? []` em toda leitura).

import { LineChart } from '@/components/charts';
import { DashboardCard } from '@/components/Dashboard';

import { useLanguage } from '@/hooks/useLanguage';

import formatDate from '@/utils/formatDate';

import type {
  LivestockHerdEvolutionByCategoryRow,
  LivestockHerdEvolutionRow,
} from '@/@types/v2/Dashboards/livestockDashboard';

interface EvolucaoRebanhoProps {
  /** Fallback (série única de total) — usado quando `dataByCategory` não vier. */
  data: LivestockHerdEvolutionRow[];
  /** Preferencial — multi-série por categoria real. */
  dataByCategory?: LivestockHerdEvolutionByCategoryRow[];
}

export function EvolucaoRebanho({ data, dataByCategory }: EvolucaoRebanhoProps) {
  const { languageGB } = useLanguage();
  const text = languageGB.dashboards.livestockDashboard.charts;

  const byCategory = dataByCategory ?? [];

  if (byCategory.length > 0) {
    const labels = byCategory.map((row) => formatDate(`${row.month}-01`, 'MM/yyyy'));

    // Catálogo de categorias na ordem de 1ª aparição — nunca hardcoda
    // nomes/quantidade (DEC-101, mesmo racional de `groupLivestockTopN`).
    const categoryOrder: { uuid: string; label: string }[] = [];
    const seenUuids = new Set<string>();
    byCategory.forEach((row) => {
      (row.categories ?? []).forEach((slice) => {
        if (!seenUuids.has(slice.category_uuid)) {
          seenUuids.add(slice.category_uuid);
          categoryOrder.push({ uuid: slice.category_uuid, label: slice.label });
        }
      });
    });

    const series = categoryOrder.map((category) => ({
      name: category.label,
      data: byCategory.map((row) => {
        const slice = (row.categories ?? []).find((s) => s.category_uuid === category.uuid);
        return slice?.total ?? 0;
      }),
    }));

    return (
      <DashboardCard flex={2} minWidth={340} title={text.evolutionTitle}>
        <LineChart series={series} labels={labels} height={240} showLegend />
      </DashboardCard>
    );
  }

  // Fallback — payload ainda sem `herd_evolution_by_category`: linha única
  // de total, comportamento anterior preservado.
  const totalRows = data ?? [];
  const labels = totalRows.map((row) => formatDate(`${row.month}-01`, 'MM/yyyy'));
  const series = [{ name: text.evolutionSeries, data: totalRows.map((row) => row.headcount) }];

  return (
    <DashboardCard flex={2} minWidth={340} title={text.evolutionTitle}>
      <LineChart series={series} labels={labels} height={240} area showLegend={false} />
    </DashboardCard>
  );
}
