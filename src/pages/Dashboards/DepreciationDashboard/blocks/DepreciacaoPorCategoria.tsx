// src/pages/Dashboards/DepreciationDashboard/blocks/DepreciacaoPorCategoria.tsx
// Bloco "Depreciação por categoria" — `StackedBarChart` com 2 séries reais
// (Equipamento/Animal, `monthly[].equipment_total/animal_total`). A UX mostra
// 4 categorias decorativas (Máquinas/Veículos/Benfeitorias/Outros) que o
// contrato de API FINAL não fornece por mês (só por `composition[]`, sem
// corte mensal) — front usa o corte REAL disponível (equipamento×animal),
// mesmo racional de adaptação já aplicado em outras telas desta execução
// (dado tem precedência sobre decoração do protótipo).

import { StackedBarChart } from '@/components/charts';
import { DashboardCard } from '@/components/Dashboard';

import { useLanguage } from '@/hooks/useLanguage';

import formatDate from '@/utils/formatDate';

import type { DepreciationMonthlyRow } from '@/@types/v2/Dashboards/depreciationDashboard';

interface DepreciacaoPorCategoriaProps {
  data: DepreciationMonthlyRow[];
}

export function DepreciacaoPorCategoria({ data }: DepreciacaoPorCategoriaProps) {
  const { languageGB } = useLanguage();
  const text = languageGB.dashboards.depreciationDashboard.charts;

  const labels = data.map((row) =>
    formatDate(`${row.year}-${String(row.month).padStart(2, '0')}-01`, 'MM/yyyy')
  );
  const series = [
    { name: text.monthlyEquipmentSeries, data: data.map((row) => row.equipment_total) },
    { name: text.monthlyAnimalSeries, data: data.map((row) => row.animal_total) },
  ];

  return (
    <DashboardCard title={text.monthlyTitle}>
      <StackedBarChart
        series={series}
        labels={labels}
        height={260}
        yFormat={(value) => `${(value / 1000).toFixed(0)}K`}
      />
    </DashboardCard>
  );
}
