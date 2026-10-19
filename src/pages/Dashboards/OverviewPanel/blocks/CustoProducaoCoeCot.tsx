// src/pages/Dashboards/OverviewPanel/blocks/CustoProducaoCoeCot.tsx
// Blocos #7 (COE×COT) e #8 (Margem operacional) — F-211, execução 062, Fase B.
// Mirror visual de `OverviewPanel.tsx@ffe92bc L.1579-1684` (2 `DashboardCard`
// adjacentes: gauge de margem + composição de custo), adaptado ao dado real
// disponível: REUSO direto de `GET /api/v1/income-statement` (F-272, já
// migrado/homologado) — nenhum endpoint novo, nenhuma Tarefa de backend
// (contrato de API §2.5).
//
// GAP-COE-CODE-EXPOSICAO (contrato de API §2.5, opção "(a)" sancionada pelo
// Front Architect em `PainelControle-Frontend-Contrato.md §7`):
// `IncomeStatementRowResource` não expõe `grouper_code`/`role` — só
// `description` textual. Este bloco casa COE/COT por SUBSTRING de
// `description` ("operacional efetivo"/"operacional total"), a MESMA técnica
// de fallback que o próprio backend usa quando `groupers.code` não está
// preenchido no tenant (`IncomeStatementDataRepository::findSpecialGrouper()`).
// Frágil a customização de nome de grouper por tenant — se o dono precisar de
// robustez determinística, a opção (b) (expor `grouper_code` no endpoint já
// homologado) é uma Tarefa/Gap separada, não bloqueia esta entrega.
//
// Margem operacional (bloco #8): NÃO existe campo pronto no `income-statement`
// nem no `overview` para essa métrica — decisão do Executor documentada:
// Margem = Receita realizada do mês corrente (`overview.kpis.realized_income`)
// − COT do período corrente (extraído acima). Ambos os valores são reais,
// já buscados por outros blocos da mesma tela — nenhum número inventado.

import { Text } from '@chakra-ui/react';

import { GaugeChart, isGaugeEmpty } from '@/components/charts';
import { DashboardCard, DashboardRow, CardInfoTooltip } from '@/components/Dashboard';

import { useLanguage } from '@/hooks/useLanguage';

import formatCurrencyBRL from '@/utils/formatCurrencyBRL';

import type { IncomeStatementRow } from '@/@types/v2/Relatorios/income-statement';

// Mesmas strings de fallback textual do backend (`trad.is_cefetivo`/
// `trad.is_optotal`, locale pt-BR — idioma do projeto, `GB.Cerne.Api/CLAUDE.md`).
const COE_MATCH = 'operacional efetivo';
const COT_MATCH = 'operacional total';

function findRowValue(rows: IncomeStatementRow[], match: string): number | null {
  const row = rows.find((item) => item.description.toLowerCase().includes(match));
  return row ? row.value : null;
}

interface CustoProducaoCoeCotProps {
  rows: IncomeStatementRow[];
  /** Receita realizada do mês corrente (`overview.kpis.realized_income`) — base da Margem operacional (#8). */
  realizedIncome: number;
  /** `false` quando não há safra vigente (nenhuma safra ativa cobre a data de hoje) — estado vazio honesto, não fallback silencioso para outro período. */
  hasCurrentHarvest: boolean;
}

export function CustoProducaoCoeCot({
  rows,
  realizedIncome,
  hasCurrentHarvest,
}: CustoProducaoCoeCotProps) {
  const { languageGB } = useLanguage();
  const coeCotText = languageGB.dashboards.overviewPanel.coeCot;
  const marginText = languageGB.dashboards.overviewPanel.operationalMargin;
  const commonText = languageGB.dashboards.common;

  const coe = hasCurrentHarvest ? findRowValue(rows, COE_MATCH) : null;
  const cot = hasCurrentHarvest ? findRowValue(rows, COT_MATCH) : null;

  const marginValue = cot !== null ? realizedIncome - cot : null;
  const marginPercent =
    marginValue !== null && realizedIncome > 0 ? (marginValue / realizedIncome) * 100 : null;

  return (
    <DashboardRow>
      <DashboardCard
        flex={2}
        title={coeCotText.title}
        action={<CardInfoTooltip content={coeCotText.tooltip} />}
      >
        {!hasCurrentHarvest ? (
          <Text fontSize="sm" color="cardTextSecondary">
            {coeCotText.noCurrentHarvest}
          </Text>
        ) : coe === null && cot === null ? (
          <Text fontSize="sm" color="cardTextSecondary">
            {commonText.noData}
          </Text>
        ) : (
          <DashboardRow>
            <DashboardCard flex={1} minWidth={140} tone="default">
              <Text fontSize="xs" color="cardTextSecondary" marginBottom="1">
                {coeCotText.coeLabel}
              </Text>
              <Text fontSize="xl" fontWeight="bold" color="cardTextPrimary">
                {coe !== null ? formatCurrencyBRL(coe) : commonText.noData}
              </Text>
            </DashboardCard>
            <DashboardCard flex={1} minWidth={140} tone="default">
              <Text fontSize="xs" color="cardTextSecondary" marginBottom="1">
                {coeCotText.cotLabel}
              </Text>
              <Text fontSize="xl" fontWeight="bold" color="cardTextPrimary">
                {cot !== null ? formatCurrencyBRL(cot) : commonText.noData}
              </Text>
            </DashboardCard>
          </DashboardRow>
        )}
      </DashboardCard>

      <DashboardCard
        flex={1}
        minWidth={220}
        title={marginText.title}
        action={<CardInfoTooltip content={marginText.tooltip} />}
      >
        {isGaugeEmpty(marginPercent) ? (
          <Text fontSize="sm" color="cardTextSecondary">
            {hasCurrentHarvest ? commonText.noData : coeCotText.noCurrentHarvest}
          </Text>
        ) : (
          <GaugeChart
            value={marginPercent as number}
            height={160}
            centerValue={`${Math.round(marginPercent as number)}%`}
            centerLabel={formatCurrencyBRL(marginValue as number)}
          />
        )}
      </DashboardCard>
    </DashboardRow>
  );
}
