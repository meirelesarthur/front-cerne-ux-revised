// src/pages/Dashboards/LivestockDashboard/blocks/IndicadoresFinanceiros.tsx
// Bloco "Indicadores financeiros" — os 32 KPIs financeiros ATIVOS e fiéis
// ao legado (`LST-001..032` do contrato normalizado: Receita Bruta, COE,
// COT, margens, preço kg/arroba recria/abate, custeio/cabeça dia/mês/ano,
// peso total kg/arroba, etc.). Renderizado a partir do ARRAY
// `general.kpis[]` — o front NUNCA hardcoda os 32 nomes/posições, só itera
// e formata pelo `key` técnico que a própria API publica por item
// (`formatLivestockKpi`/`inferLivestockKpiFormat`).
//
// **CORREÇÃO PÓS-E2E (048):** o payload real NÃO tem campo `format` (só
// `{key,label,value,color}`) — a chamada abaixo usava `kpi.format`
// (sempre `undefined`), fazendo todo card sair sem `R$`/casas decimais.
//
// **AJUSTE DE LAYOUT (homologação, 048):** trocado `Wrap`/`WrapItem`
// (largura fixa por item, alinhado à esquerda — a última fileira ficava com
// vão vazio à direita) por `DashboardRow`, o mesmo kit de grid dos demais
// blocos do dashboard (`DashboardGrid.tsx`). Dentro dela cada `DashboardCard`
// de KPI herda `flex: 1 1 160px` do `RowContext` — os cards de uma mesma
// fileira, inclusive a última incompleta, crescem para dividir a largura
// sobrando (sem buraco) e continuam quebrando por espaço disponível, sem
// breakpoint fixo — preserva a responsividade.

import { Text } from '@chakra-ui/react';

import { DashboardCard, DashboardRow } from '@/components/Dashboard';

import { useLanguage } from '@/hooks/useLanguage';

import { formatLivestockKpi } from '@/constants/dashboards/livestockDashboard/livestock-kpi-format';

import type { LivestockKpiRow } from '@/@types/v2/Dashboards/livestockDashboard';

interface IndicadoresFinanceirosProps {
  data: LivestockKpiRow[];
}

export function IndicadoresFinanceiros({ data }: IndicadoresFinanceirosProps) {
  const { languageGB } = useLanguage();
  const text = languageGB.dashboards.livestockDashboard.financial;
  const commonText = languageGB.dashboards.common;

  return (
    <DashboardCard title={text.title}>
      {data.length === 0 ? (
        <Text fontSize="sm" color="cardTextSecondary">
          {commonText.noData}
        </Text>
      ) : (
        <DashboardRow>
          {data.map((kpi) => (
            <DashboardCard key={kpi.key} minWidth={160} tone="default">
              <Text fontSize="xs" color="cardTextSecondary" marginBottom="1">
                {kpi.label}
              </Text>
              <Text fontSize="lg" fontWeight="bold" color="cardTextPrimary">
                {formatLivestockKpi(kpi.value, kpi.key, languageGB)}
              </Text>
            </DashboardCard>
          ))}
        </DashboardRow>
      )}
    </DashboardCard>
  );
}
