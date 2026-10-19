// src/components/ui/DashboardGrid.tsx
// -----------------------------------------------------------------------------
// Casca canônica de Dashboards (Regra G do design system `cerne`, `GB.Cerne.UX`
// commit `8663490`, `src/components/ui/DashboardGrid.tsx`) — ADAPTADA (não
// copiada) para Chakra UI v3 + tokens semânticos do fork (`src/theme.ts`,
// `get_spa_ux_fidelity_pattern`). GENÉRICO (não específico de nenhuma
// feature): qualquer dashboard futuro (`/dashboards/*`) reusa este arquivo sem
// recriar nada. Primeiro consumidor: `Dashboards/Suprimentos` (Tarefa 42,
// emenda pós-entrega às Tarefas 38/39, `FID-G3F §Emenda v2/D3`).
//
// `DashboardGrid` NÃO pinta o próprio canvas (o `background: colors.bg.outer`
// do `cerne` foi OMITIDO de propósito): o token equivalente (`contentOuterBG`)
// já é pintado por `DashboardLayout.tsx:106` atrás de toda rota do módulo —
// repintar aqui duplicaria o chassi. Também sem `StaggerContext`/animação de
// entrada escalonada do `cerne` (YAGNI — nenhuma diretriz do dono pediu
// animação; aditivo futuro, nunca regressivo).
//
// `DashboardCard`/`DashboardKpiCard` PRECISAM do `RowContext` do `cerne`
// (restaurado nesta correção, Execução 019): o `DashboardGrid` já é um flex
// container em COLUNA (`flexDirection="column"`), então a propriedade `flex`
// de um `DashboardCard` sempre tem efeito — só que no eixo VERTICAL quando o
// card está direto sob o Grid, e não no eixo horizontal como pretendido. Sem
// o contexto, um card fora de `DashboardRow` herdava `flex-basis` como altura
// (ex.: `280px`) e `overflow="hidden"` cortava todo o conteúdo excedente. O
// `RowContext` resolve isso: `DashboardRow` provê `inRow: true` para os
// filhos, e `DashboardCard`/`DashboardKpiCard` só aplicam `flex`/`minWidth`
// quando estão DENTRO de uma fileira — fora dela o card ocupa a largura total
// e cresce livremente pela altura do próprio conteúdo.
//
// NÃO portados nesta emenda (D3 do FID-G3F, YAGNI): `DashboardStack`
// (colunas empilhadas dentro de uma fileira), `DashboardFilters` (o filtro de
// Suprimentos é `FilterSideSuprimentos.tsx`, Contrato B — multiseleção de
// fazendas/Safra assíncrona/par de datas, que o `DashboardFilters` de opção
// única do cerne não cobre) e `DashboardAnalysis` (nenhum dashboard do fork
// tem "Análise assistida" contratada). `DashboardSkeleton` também não é
// portado como componente genérico aqui — a composição de Suprimentos mantém
// o cabeçalho sempre visível durante o loading (o `DashboardSkeleton` do
// cerne desenha a própria casca+header), então o loading é resolvido inline
// na tela consumidora com `DashboardRow` + `Skeleton` nativo do Chakra.
// -----------------------------------------------------------------------------

import type { ReactNode } from 'react';
import { createContext, useContext } from 'react';

import { Box, Flex, Heading, HStack, Icon, Text } from '@chakra-ui/react';
import { FiTrendingDown, FiTrendingUp } from 'react-icons/fi';

/** Largura mínima (px) de um `DashboardCard` antes de quebrar linha na fileira. */
const DASH_CARD_MIN_WIDTH = 280;
/** Largura mínima (px) de um `DashboardKpiCard` — mirror `t.size.dashKpiMin` do cerne. */
const DASH_KPI_MIN_WIDTH = 180;

// ─── RowContext ──────────────────────────────────────────────────────────────

interface RowContextValue {
  /** O card está dentro de uma `DashboardRow`? Define se ele divide a largura. */
  inRow: boolean;
}

const RowContext = createContext<RowContextValue>({ inRow: false });

// ─── DashboardGrid ───────────────────────────────────────────────────────────

interface DashboardGridProps {
  children: ReactNode;
}

// Canvas do dashboard: só distribui as fileiras com gap uniforme e padding.
// Transparente de propósito — o "segundo nível" (`contentOuterBG`) já vem
// pintado pelo `DashboardLayout` atrás da rota (ver nota no topo do arquivo).
export function DashboardGrid({ children }: DashboardGridProps) {
  return (
    <Box
      display="flex"
      flexDirection="column"
      gap={4}
      padding={4}
      minHeight="100%"
      boxSizing="border-box"
    >
      {children}
    </Box>
  );
}

// ─── DashboardHeader ─────────────────────────────────────────────────────────

interface DashboardHeaderProps {
  /** Título do dashboard. */
  title: string;
  /** Linha de apoio acima do título (ex.: período aplicado). Omitir enquanto pendente. */
  subtitle?: string;
  /** Slot de ações à direita — botão de filtro, tabs, etc. */
  actions?: ReactNode;
}

// Cabeçalho do dashboard. Fica sobre o canvas, fora dos cards.
export function DashboardHeader({ title, subtitle, actions }: DashboardHeaderProps) {
  return (
    <Flex flexWrap="wrap" alignItems="center" justifyContent="space-between" gap={3} paddingX={1}>
      <Box display="flex" flexDirection="column" gap={1} minWidth={0} flex="1 1 auto">
        {subtitle && (
          <Text fontSize="sm" color="cardTextSecondary">
            {subtitle}
          </Text>
        )}
        <Heading as="h1" size="lg">
          {title}
        </Heading>
      </Box>
      {actions && (
        <Flex alignItems="center" flexWrap="wrap" gap={2} marginLeft="auto">
          {actions}
        </Flex>
      )}
    </Flex>
  );
}

// ─── DashboardRow ────────────────────────────────────────────────────────────

interface DashboardRowProps {
  children: ReactNode;
  /** Alinhamento vertical dos cards da fileira. Default `stretch` (mesma altura). */
  align?: 'stretch' | 'flex-start';
}

// Fileira de cards do dashboard. Distribui a largura pelos pesos de cada
// `DashboardCard` (`flex`) e quebra para a linha seguinte quando os cards não
// cabem na largura mínima declarada por eles — por espaço, não por breakpoint
// de janela (propriedade inerente ao `flexWrap`, sem algoritmo em JS).
export function DashboardRow({ children, align = 'stretch' }: DashboardRowProps) {
  return (
    <RowContext.Provider value={{ inRow: true }}>
      <Flex flexWrap="wrap" alignItems={align} gap={4}>
        {children}
      </Flex>
    </RowContext.Provider>
  );
}

// ─── DashboardCard ───────────────────────────────────────────────────────────

export interface DashboardCardProps {
  children: ReactNode;
  /** Rótulo do bloco, no topo do card. */
  title?: ReactNode;
  /** Slot à direita do rótulo — botão, legenda, etc. */
  action?: ReactNode;
  /** Peso da largura dentro de uma `DashboardRow`. Default `1`. */
  flex?: number;
  /** Largura mínima (px) antes de o card passar para a linha seguinte da fileira. */
  minWidth?: number;
  /** Remove o padding interno — blocos que sangram até a borda. */
  bare?: boolean;
}

// Bloco preenchido do dashboard — fill próprio, raio e sombra do tema; quem
// separa os blocos é o canvas transparente do `DashboardGrid`, não uma borda.
export function DashboardCard({
  children,
  title,
  action,
  flex = 1,
  minWidth = DASH_CARD_MIN_WIDTH,
  bare = false,
}: DashboardCardProps) {
  const { inRow } = useContext(RowContext);

  return (
    <Box
      display="flex"
      flexDirection="column"
      flex={inRow ? `${flex} 1 ${minWidth}px` : undefined}
      minWidth={inRow ? `${minWidth}px` : undefined}
      background="cardBG"
      borderRadius="2xl"
      boxShadow="cardShadow"
      padding={bare ? 0 : 5}
      overflow="hidden"
      boxSizing="border-box"
    >
      {(title || action) && (
        <Flex
          alignItems="center"
          justifyContent="space-between"
          gap={3}
          marginBottom={4}
          paddingX={bare ? 5 : 0}
          paddingTop={bare ? 4 : 0}
        >
          {title ? (
            <Heading as="h3" size="sm" fontWeight="medium" color="cardTextSecondary">
              {title}
            </Heading>
          ) : (
            <Box />
          )}
          {action && (
            <Flex
              alignItems="center"
              justifyContent="flex-end"
              flexWrap="wrap"
              gap={2}
              minWidth={0}
            >
              {action}
            </Flex>
          )}
        </Flex>
      )}
      {children}
    </Box>
  );
}

// ─── DashboardKpiCard ────────────────────────────────────────────────────────

interface DashboardKpiCardProps {
  label: string;
  value: string;
  /** Variação percentual (ex.: `'5,4%'`). Ausente/`null` omite o indicador de tendência. */
  trend?: string | null;
  /** Direção da variação. Default `true` (alta). Ignorado quando `direction` é informado. */
  up?: boolean;
  /**
   * Direção da variação em 3 estados (Tarefa 55, contrato de tela v2 §6.2 —
   * aditivo, NUNCA quebra `up`). Quando presente, governa cor/ícone do
   * `trend`: `'up'` → `FiTrendingUp`/`feedBack.successMain`; `'down'` →
   * `FiTrendingDown`/`feedBack.errorMain`; `'flat'` → sem ícone, cor neutra
   * `cardTextSecondary`. Quando AUSENTE, o comportamento atual (`up`
   * boolean) é preservado byte a byte — só 3 consumidores hoje (D-01 do
   * PRD), nenhum precisa migrar.
   */
  direction?: 'up' | 'down' | 'flat';
  /** Texto de apoio abaixo do valor. */
  sub?: string;
  /** Peso da largura dentro da fileira. */
  flex?: number;
  /** Largura mínima (px) antes de quebrar a linha. Default `t.size.dashKpiMin` do cerne. */
  minWidth?: number;
  /**
   * Slot aditivo abaixo do trend (Tarefa 55/56) — ex.: `SparklineArea` do
   * KPI. Ausente por padrão, sem efeito nos consumidores atuais.
   */
  children?: ReactNode;
}

// KPI como card preenchido — rótulo + valor grande + tendência/apoio opcionais.
export function DashboardKpiCard({
  label,
  value,
  trend,
  up = true,
  direction,
  sub,
  flex,
  minWidth = DASH_KPI_MIN_WIDTH,
  children,
}: DashboardKpiCardProps) {
  const isUp = direction ? direction === 'up' : up;
  const trendColor =
    direction === 'flat'
      ? 'cardTextSecondary'
      : isUp
        ? 'feedBack.successMain'
        : 'feedBack.errorMain';
  const TrendIcon = direction === 'flat' ? null : isUp ? FiTrendingUp : FiTrendingDown;

  return (
    <DashboardCard flex={flex} minWidth={minWidth}>
      <Text fontSize="xs" color="cardTextSecondary" marginBottom={1}>
        {label}
      </Text>
      <Text
        fontSize="2xl"
        fontWeight="bold"
        color="cardTextPrimary"
        lineHeight="short"
        marginBottom={trend || sub ? 2 : 0}
      >
        {value}
      </Text>
      {sub && (
        <Text fontSize="xs" color="cardTextSecondary" marginBottom={trend ? 2 : 0}>
          {sub}
        </Text>
      )}
      {trend && (
        <HStack gap={1} color={trendColor}>
          {TrendIcon && <Icon as={TrendIcon} boxSize={4} />}
          <Text fontSize="xs" fontWeight="medium">
            {trend}
          </Text>
        </HStack>
      )}
      {children}
    </DashboardCard>
  );
}
