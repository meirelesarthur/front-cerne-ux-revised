// src/pages/Dashboards/OverviewPanel/blocks/PrevisaoReceberPagar.tsx
// Bloco #9a — Previsão a Receber/Pagar/Saldo (F-211, execução 062, Fase B).
// Mirror `OverviewPanel.tsx@ffe92bc L.1686-1703` — 3 valores (mirror
// `PagamentosRecebimentosAtrasados`/fileira de KPIs topo). Fonte:
// `financial-summary.forecast` (posição atual, sem corte de data — API §2.2).
// SEM sparkline: `forecast` é uma posição pontual, não série histórica —
// diferente da Referência UX (que usa `AGING_BUCKETS` como proxy de série,
// dado ilustrativo do protótipo). "Saldo previsto" ganha o mesmo texto de
// apoio da UX ("cobre X% do a pagar"), percentual DERIVADO dos 2 valores
// reais já buscados — nenhum número inventado.
//
// GAP-FE-254 (RESOLVIDO, exec. 062): o bloco nunca exibia `text.title`,
// diferente de TODOS os blocos irmãos da mesma tela (`AgingTitulos`,
// `ConcentracaoReceita`, `CustoProducaoCoeCot`, `CoberturaEstoque`,
// `ResultadoPorProduto`), que envolvem seu conteúdo num único
// `<DashboardCard title={text.title}>`. A causa raiz também explicava um
// segundo achado (Ajuste 5, mesma sessão): os 3 valores viviam num
// `<DashboardRow>` PRÓPRIO, que por sua vez era o único filho do
// `<DashboardRow>` de `index.tsx` — Row DENTRO de Row. Só `DashboardCard`
// consome o `RowContext` para crescer (`flex-grow`) dentro de uma fileira;
// uma `DashboardRow` aninhada não cresce sozinha, então a fileira externa
// ficava do tamanho do CONTEÚDO (sobrava espaço vazio à direita) e o valor
// "A receber" quebrava em 2 linhas por falta de largura. Correção: 1 único
// `DashboardCard` (mesmo padrão dos irmãos — cresce para ocupar a fileira
// inteira) com as 3 colunas de valor em `flex="1"` cada, dividindo a largura
// TOTAL do card igualmente (mirror do pedido "grid de 3 colunas iguais").

import { Flex, Text } from '@chakra-ui/react';

import { DashboardCard, CardInfoTooltip } from '@/components/Dashboard';

import { useLanguage } from '@/hooks/useLanguage';

import formatCurrencyBRL from '@/utils/formatCurrencyBRL';

import type { OverviewPanelForecast } from '@/@types/v2/Dashboards/overviewPanel';

interface PrevisaoReceberPagarProps {
  data: OverviewPanelForecast;
}

interface ForecastFigureProps {
  label: string;
  value: string;
  valueColor?: string;
  sub?: string;
}

/**
 * 1 coluna de valor do bloco — mesma tipografia de `DashboardKpiCard`, sem o
 * card próprio (o agrupamento visual já é o `DashboardCard` externo único).
 * @return {JSX.Element} Coluna com rótulo, valor e nota de apoio opcional, `flex="1"` para dividir a largura do card igualmente entre as 3 colunas.
 */
function ForecastFigure({ label, value, valueColor, sub }: ForecastFigureProps) {
  return (
    <Flex direction="column" flex="1" minWidth="0">
      <Text fontSize="xs" color="cardTextSecondary" marginBottom="1">
        {label}
      </Text>
      <Text
        fontSize="2xl"
        fontWeight="bold"
        color={valueColor ?? 'cardTextPrimary'}
        lineHeight="tight"
        marginBottom={sub ? '2' : '0'}
      >
        {value}
      </Text>
      {sub && (
        <Text fontSize="xs" color="cardTextSecondary">
          {sub}
        </Text>
      )}
    </Flex>
  );
}

export function PrevisaoReceberPagar({ data }: PrevisaoReceberPagarProps) {
  const { languageGB } = useLanguage();
  const text = languageGB.dashboards.overviewPanel.forecast;

  const balance = data.receivable - data.payable;
  const coveragePct = data.payable > 0 ? (data.receivable / data.payable) * 100 : null;

  return (
    <DashboardCard title={text.title} action={<CardInfoTooltip content={text.tooltip} />}>
      <Flex gap="4" width="full">
        <ForecastFigure label={text.receivable} value={formatCurrencyBRL(data.receivable)} />
        <ForecastFigure label={text.payable} value={formatCurrencyBRL(data.payable)} />
        <ForecastFigure
          label={text.balance}
          value={formatCurrencyBRL(balance)}
          valueColor={balance < 0 ? 'feedBack.errorMain' : undefined}
          sub={
            coveragePct !== null
              ? text.coverageNote.replace(
                  '{value}',
                  coveragePct.toLocaleString('pt-BR', { maximumFractionDigits: 0 })
                )
              : undefined
          }
        />
      </Flex>
    </DashboardCard>
  );
}
