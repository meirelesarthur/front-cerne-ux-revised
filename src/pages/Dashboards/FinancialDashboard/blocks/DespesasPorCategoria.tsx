// src/pages/Dashboards/FinancialDashboard/blocks/DespesasPorCategoria.tsx
// Bloco "Despesas por categoria" (`LM-006/007`) — `DonutChart`, labels 100%
// da API (`by_category.expenses[].category`, `financial_categories` pivot)
// — nunca hardcoda nomes de categoria.
//
// **CORREÇÃO PÓS-E2E (048):** campo real é `row.total` (não `row.value`,
// nome antigo especulativo) — com `value` sempre `undefined`, o
// `DonutChart` renderizava em branco (mesma causa-raiz já corrigida na
// Pecuária, `ver ComposicaoPorRaca.tsx`).

import { DonutChart } from '@/components/charts';
import { DashboardCard } from '@/components/Dashboard';

import { useLanguage } from '@/hooks/useLanguage';

import formatCurrencyBRL from '@/utils/formatCurrencyBRL';

import type { FinancialCategoryRow } from '@/@types/v2/Dashboards/financialDashboard';

interface DespesasPorCategoriaProps {
  data: FinancialCategoryRow[];
}

export function DespesasPorCategoria({ data }: DespesasPorCategoriaProps) {
  const { languageGB } = useLanguage();
  const text = languageGB.dashboards.financialDashboard.expensesByCategory;

  const slices = data.map((row) => ({ label: row.category, value: row.total }));
  const total = data.reduce((sum, row) => sum + row.total, 0);

  return (
    <DashboardCard flex={1} minWidth={300} title={text.title}>
      <DonutChart
        data={slices}
        height={220}
        centerLabel={text.centerLabel}
        centerValue={formatCurrencyBRL(total)}
        showLegend
        valueFormat={(value) => formatCurrencyBRL(value)}
      />
    </DashboardCard>
  );
}
