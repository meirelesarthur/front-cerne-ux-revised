// src/pages/Dashboards/DepreciationDashboard/blocks/ComposicaoPorTipo.tsx
// Bloco "Composição por tipo de bem" — `DonutChart`, labels vindas 100% da
// API (`composition[].category`, texto livre de `family_equipments`) — NUNCA
// hardcoda os 4 nomes do protótipo (DEC-190).
//
// CORREÇÃO PÓS-HOMOLOGAÇÃO (048) — decisão do dono: as FATIAS são saldo
// residual por tipo (`composition[].value` = `sd_depreciate`), então o
// número CENTRAL do donut passa a ser a SOMA das próprias fatias exibidas
// (nunca mais `accumulated.total`, que é depreciação ACUMULADA — métrica
// diferente, por isso uma fatia isolada podia superar o "total" mostrado).
// Central e fatias agora sempre batem, por construção. Rótulo do centro
// também muda de "total" para "Saldo residual" (i18n). O KPI "Depreciação
// acumulada" da tela (outro card) continua usando `accumulated.total` —
// intocado, é só o centro DESTE donut.

import { DonutChart } from '@/components/charts';
import { DashboardCard } from '@/components/Dashboard';

import { useLanguage } from '@/hooks/useLanguage';

import formatCurrencyBRL from '@/utils/formatCurrencyBRL';

import type { DepreciationCompositionRow } from '@/@types/v2/Dashboards/depreciationDashboard';

interface ComposicaoPorTipoProps {
  data: DepreciationCompositionRow[];
}

export function ComposicaoPorTipo({ data }: ComposicaoPorTipoProps) {
  const { languageGB } = useLanguage();
  const text = languageGB.dashboards.depreciationDashboard.charts;

  const slices = data.map((row) => ({ label: row.category, value: row.value }));
  const residualTotal = slices.reduce((sum, slice) => sum + slice.value, 0);

  return (
    <DashboardCard flex={1} minWidth={300} title={text.compositionTitle}>
      <DonutChart
        data={slices}
        height={220}
        centerLabel={text.compositionCenterLabel}
        centerValue={formatCurrencyBRL(residualTotal)}
        valueFormat={(value) => formatCurrencyBRL(value)}
      />
    </DashboardCard>
  );
}
