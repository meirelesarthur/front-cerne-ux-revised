// src/pages/Dashboards/FinancialDashboard/blocks/OrcamentoAnual.tsx
// Bloco "Orçamento anual" (S-BLOCK-09) — `GaugeChart` NOVO (ver ROTEIRO §2),
// consumindo `budget` (REUSO de `GetBudgetPlanningPredictedReportAction`,
// `CONTRATO-API-048-04 §5`).
//
// NOTA DE CONSOLIDAÇÃO: a Referência UX usa o `GaugeChart`/`ArcGauge` neste
// MESMO bloco ("Orçamento anual" — `DashFinanceiro.tsx@8663490` linha 332),
// não num bloco separado "Disponível vs limite" como o rascunho do ROTEIRO
// §"Componentes" sugeria (`SaldoDisponivel.tsx`) — esse rótulo não tem
// dado próprio no contrato de API final (`month_summary.balance` já é o KPI
// "Saldo disponível" da fileira 1); o gauge novo vai aqui, fiel à UX real.
//
// **CORREÇÃO PÓS-E2E CRÍTICA (048):** `budget` NÃO é o objeto simples
// `{predicted,realized,variance_percent}` assumido — é uma ÁRVORE completa
// do relatório de orçamento (`{year,balance_label,farm,groups[]}`, cada
// grupo já com `months[]`/`accumulated[]` PRÓPRIOS agregados dos seus
// `children[]`). O gauge soma `predicted`/`realized` de TODOS os
// `groups[].months[]` — não precisa descer a `children[]` (o grupo já
// chega com o total). Guard defensivo (`?? []`) em toda soma — nunca
// crasha se `groups`/`months` vier ausente.

import { Text } from '@chakra-ui/react';

import { GaugeChart, isGaugeEmpty } from '@/components/charts';
import { DashboardCard } from '@/components/Dashboard';

import { useLanguage } from '@/hooks/useLanguage';

import formatCurrencyBRL from '@/utils/formatCurrencyBRL';

import type { FinancialBudget } from '@/@types/v2/Dashboards/financialDashboard';

interface OrcamentoAnualProps {
  data: FinancialBudget | null;
}

export function OrcamentoAnual({ data }: OrcamentoAnualProps) {
  const { languageGB } = useLanguage();
  const text = languageGB.dashboards.financialDashboard.budget;
  const commonText = languageGB.dashboards.common;

  const groups = data?.groups ?? [];
  const predicted = groups.reduce(
    (sum, group) => sum + (group.months ?? []).reduce((s, m) => s + m.predicted, 0),
    0
  );
  const realized = groups.reduce(
    (sum, group) => sum + (group.months ?? []).reduce((s, m) => s + m.realized, 0),
    0
  );

  const percent = predicted > 0 ? (realized / predicted) * 100 : null;

  return (
    <DashboardCard flex={1} minWidth={280} title={text.title}>
      {isGaugeEmpty(percent) ? (
        <Text fontSize="sm" color="cardTextSecondary">
          {commonText.noData}
        </Text>
      ) : (
        <GaugeChart
          value={percent as number}
          height={180}
          centerValue={`${Math.round(percent as number)}%`}
          centerLabel={`${formatCurrencyBRL(realized)} / ${formatCurrencyBRL(predicted)}`}
        />
      )}
    </DashboardCard>
  );
}
