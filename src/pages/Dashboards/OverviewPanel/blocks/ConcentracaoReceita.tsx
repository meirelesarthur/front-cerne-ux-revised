// src/pages/Dashboards/OverviewPanel/blocks/ConcentracaoReceita.tsx
// Bloco #11 — Concentração de receita por comprador (F-211, execução 062,
// Fase B). Referência UX usa `SegmentedBar` (`OverviewPanel.tsx@ffe92bc
// L.1735-1764», barra única com segmentos coloridos por comprador) — esse
// componente NÃO existe no fork ainda. Adaptação (Regra F — reusar antes de
// criar): `DonutChart`, já existente e usado por outros dashboards migrados
// (`DespesasPorCategoria`) para a MESMA semântica (composição proporcional
// por categoria, com legenda) — não justifica criar um 4º primitivo de
// gráfico só para este bloco. Fonte:
// `financial-summary.revenue_concentration` (Top-10 + "outros", GAP-03
// default do contrato de API §2.2/§5).
//
// Fix wave F-211 (execução 062), item B: bloco era o ÚNICO gráfico da tela
// SEM guarda de vazio (`AUDITORIA-cards-kpis-F211.md` Bloco #11) — `top=[]`
// renderizava `DonutChart` com `slices` vazio (donut em branco). Corrigido
// para o MESMO padrão `commonText.noData` dos irmãos `ResultadoPorProduto`/
// `CoberturaEstoque` (ícone + texto, sem gráfico quebrado).
//
// Correção pós-entrega (exec. 062, item #4, decisão do dono): o backend
// pode devolver uma fatia com `client_uuid: null` para vendas SEM cliente
// vinculado no romaneio — resolvendo `client_name` para o rótulo fixo
// `'Sem cliente'` (fonte: `HomeFinancialSummaryDashboardRepository::
// revenueByClient()`). O bloco renderiza essa fatia normalmente, como
// qualquer outro comprador (fallback i18n `noClientLabel` só como rede de
// segurança honesta, caso o backend um dia mande `client_name` vazio/nulo
// — nunca inventa um nome de cliente).

import { Badge, Flex, Icon, Text, VStack } from '@chakra-ui/react';
import { FiPieChart } from 'react-icons/fi';

import { DonutChart } from '@/components/charts';
import { DashboardCard, CardInfoTooltip } from '@/components/Dashboard';

import { useLanguage } from '@/hooks/useLanguage';

import formatCurrencyBRL from '@/utils/formatCurrencyBRL';

import type { OverviewPanelRevenueConcentration } from '@/@types/v2/Dashboards/overviewPanel';

const CONCENTRATION_ALERT_THRESHOLD_PCT = 40;

interface ConcentracaoReceitaProps {
  data: OverviewPanelRevenueConcentration;
}

export function ConcentracaoReceita({ data }: ConcentracaoReceitaProps) {
  const { languageGB } = useLanguage();
  const text = languageGB.dashboards.overviewPanel.revenueConcentration;
  const commonText = languageGB.dashboards.common;

  const total = data.top.reduce((sum, item) => sum + item.total, 0) + data.others_total;
  const isEmpty = data.top.length === 0 || total === 0;

  const slices = [
    ...data.top.map((item) => ({
      label: item.client_name?.trim() ? item.client_name : text.noClientLabel,
      value: item.total,
    })),
    ...(data.others_total > 0 ? [{ label: text.othersLabel, value: data.others_total }] : []),
  ];

  const topShare = total > 0 && data.top.length > 0 ? (data.top[0].total / total) * 100 : 0;

  return (
    <DashboardCard
      flex={1}
      minWidth={300}
      title={text.title}
      action={
        <Flex align="center" gap="2">
          {topShare > CONCENTRATION_ALERT_THRESHOLD_PCT && (
            <Badge colorPalette="orange" borderRadius="full">
              {text.alertLabel.replace('{value}', Math.round(topShare).toString())}
            </Badge>
          )}
          <CardInfoTooltip content={text.tooltip} />
        </Flex>
      }
    >
      {isEmpty ? (
        <VStack align="center" justify="center" height="220px" gap="2" textAlign="center">
          <Icon as={FiPieChart} boxSize={6} color="fg.muted" />
          <Text fontSize="sm" color="cardTextSecondary">
            {commonText.noData}
          </Text>
        </VStack>
      ) : (
        <DonutChart
          data={slices}
          height={220}
          centerLabel={text.centerLabel}
          centerValue={formatCurrencyBRL(total)}
          showLegend
          valueFormat={(value) => formatCurrencyBRL(value)}
        />
      )}
    </DashboardCard>
  );
}
