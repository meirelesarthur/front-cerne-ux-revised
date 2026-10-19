// src/pages/Dashboards/OverviewPanel/blocks/ResultadoOperacional.tsx
// Bloco #5 — Resultado operacional (F-211, execução 062, Fase B).
//
// DIVERGÊNCIA da Referência UX documentada (`OverviewPanel.tsx@ffe92bc
// L.1477-1527`, `ResultBarGroup` ×3 — Receitas/Despesas/Saldo, cada um com
// 3 barras Realizado/Previsto/Atrasado): o endpoint real
// (`financial-summary.operational_result`) só publica o SALDO já líquido
// (`realized_balance`/`predicted_balance`) + o total de atraso
// (`overdue.receivable`/`overdue.payable`) do mês filtrado — NÃO abre
// receita/despesa separadas dentro deste sub-bloco (essa granularidade só
// existe na série `monthly_revenue`, de OUTRO sub-bloco, cuja soma não é
// idêntica ao balanço do mês por construção — misturar as duas fontes na
// mesma métrica violaria a nota do contrato de API §2.2 "nunca soma
// previsto+realizado silenciosamente"). Adaptação: 1 grupo ("Saldo do mês")
// com 3 barras — Realizado / Previsto / Atrasado (líquido receber−pagar) —
// nenhum valor inventado, só o que a API já devolve.
//
// Fix wave F-211 (execução 062): item G — tooltip do gráfico com
// `formatCurrencyBRL`; item H — loading (skeleton, refetch de período) +
// empty (`commonText.noData`) quando os 3 valores vierem zerados, mirror
// `CoberturaEstoque`/`ResultadoPorProduto`; item C — ícone de info com o
// texto de origem do bloco (auditoria, Bloco #5).

import { Icon, Skeleton, Text, VStack } from '@chakra-ui/react';
import { FiBarChart2 } from 'react-icons/fi';

import { GroupedBarChart } from '@/components/charts';
import { DashboardCard, CardInfoTooltip } from '@/components/Dashboard';

import { useLanguage } from '@/hooks/useLanguage';

import formatCurrencyBRL from '@/utils/formatCurrencyBRL';

import type { OverviewPanelOperationalResult } from '@/@types/v2/Dashboards/overviewPanel';

interface ResultadoOperacionalProps {
  data: OverviewPanelOperationalResult;
  /** Refetch em background (troca de "Período" sobre cache já visitado) — mirror padrão V3 `Skeleton loading`. */
  isLoading?: boolean;
}

export function ResultadoOperacional({ data, isLoading = false }: ResultadoOperacionalProps) {
  const { languageGB } = useLanguage();
  const text = languageGB.dashboards.overviewPanel.operationalResult;
  const commonText = languageGB.dashboards.common;

  const overdueBalance = data.overdue.receivable - data.overdue.payable;

  const isEmpty =
    data.realized_balance === 0 &&
    data.predicted_balance === 0 &&
    data.overdue.receivable === 0 &&
    data.overdue.payable === 0;

  const series = [
    {
      name: text.balanceGroup,
      data: [data.realized_balance, data.predicted_balance, overdueBalance],
    },
  ];
  const labels = [text.realized, text.predicted, text.overdue];

  return (
    <DashboardCard
      flex={1}
      minWidth={280}
      title={text.title}
      action={<CardInfoTooltip content={text.tooltip} />}
    >
      <Skeleton loading={isLoading}>
        {isEmpty ? (
          <VStack align="center" justify="center" height="220px" gap="2" textAlign="center">
            <Icon as={FiBarChart2} boxSize={6} color="fg.muted" />
            <Text fontSize="sm" color="cardTextSecondary">
              {commonText.noData}
            </Text>
          </VStack>
        ) : (
          <GroupedBarChart
            series={series}
            labels={labels}
            height={220}
            showLegend={false}
            yFormat={(value) =>
              value >= 1_000_000
                ? `R$ ${(value / 1_000_000).toLocaleString('pt-BR', { maximumFractionDigits: 1 })}M`
                : `R$ ${(value / 1_000).toFixed(0)}K`
            }
            tooltipFormat={(value) => formatCurrencyBRL(value)}
          />
        )}
      </Skeleton>
    </DashboardCard>
  );
}
