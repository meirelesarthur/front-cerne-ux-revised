// src/components/Dashboard/DashboardGrid.tsx
// Casca dos dashboards analíticos (execução 046, TASK-DASH-FE-02) — adaptação
// Chakra v3 de `GB.Cerne.UX/src/components/ui/DashboardGrid.tsx@8663490`
// (referência UX, ver `00-CONTRATO-FRONT-046-fundacao-e-chokepoints.md`).
//
// Fidelidade ao cerne = ADAPTAÇÃO à stack, nunca importar o componente do
// Storybook cru: o UX usa `t.*`/`useTheme()` próprios (CSS-in-JS manual); esta
// versão usa Chakra v3 (`Box`/`Flex`) + tokens semânticos FLAT do fork
// (`contentOuterBG`, `cardBG`, `cardBorder`, `cardShadow` — ver
// `src/styles/theme/semantic/{light,dark}.ts`). Sem `GBMode` (3º tema): este
// fork só tem light/dark, resolvidos automaticamente pelos tokens semânticos.
//
// Composição canônica (idêntica ao UX):
//
//   DashboardGrid                       ← canvas + gap entre as fileiras
//     ├── DashboardHeader               ← título + filtros, sobre o canvas
//     ├── DashboardRow                  ← fileira de KPIs
//     │     └── DashboardKpiCard ×N
//     ├── DashboardRow                  ← fileira de blocos com pesos
//     │     ├── DashboardCard flex={3}
//     │     └── DashboardCard flex={2}
//     └── DashboardCard                 ← bloco de largura total
//
// Responsividade por ESPAÇO, não por janela: a fileira não troca de layout num
// breakpoint. Cada card declara uma largura mínima (`dashCardMin`/`dashKpiMin`)
// e cresce para ocupar a sobra; quando os mínimos não cabem, o card passa para
// a linha seguinte. Fonte única (Lei 2): não recriar esta casca inline nas
// telas — as 4 features (UA/LC/AT/ABC) consomem só este kit.

import { createContext, useContext, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';

import { Box, Flex, Heading, Skeleton, Text } from '@chakra-ui/react';
import { FiTrendingDown, FiTrendingUp } from 'react-icons/fi';

import { Icon } from '@/components/Icon';

import { CardInfoTooltip } from './CardInfoTooltip';

/** Largura mínima de um card antes de a fileira quebrar (idem UX `t.size.dashCardMin`). */
const DASH_CARD_MIN = 300;
/** Idem para o card de KPI — cabem ~4 por fileira em ~800px de conteúdo (idem UX `t.size.dashKpiMin`). */
const DASH_KPI_MIN = 180;
/** Teto de degraus escalonados — acima disso os cards entram juntos no último delay. */
const STAGGER_MAX_STEPS = 14;
/** Passo de delay entre cards consecutivos (ms). */
const STAGGER_STEP_MS = 45;

// ─── StaggerContext ─────────────────────────────────────────────────────────
// Contador de entrada dos `DashboardCard` — cada card pede o próximo índice
// UMA vez (no mount) e usa para escalonar o delay da animação de entrada.
// Vive no `DashboardGrid` para o escalonamento cobrir o dashboard inteiro.

interface StaggerContextValue {
  next: () => number;
}

const StaggerContext = createContext<StaggerContextValue | null>(null);

// ─── RowContext ─────────────────────────────────────────────────────────────
// Um `DashboardCard` dentro de uma `DashboardRow` divide a largura da fileira
// pelo peso (`flex`); fora dela é sempre largura total.

interface RowContextValue {
  inRow: boolean;
}

const RowContext = createContext<RowContextValue>({ inRow: false });

// Injeta o keyframe de entrada uma única vez (mesma técnica já usada pelo
// fork em `ComingSoon` — `<style>` local, sem depender de globalCss do tema).
const DASH_CARD_KEYFRAMES = `
@keyframes dashCardIn {
  from { opacity: 0; transform: translateY(4px); }
  to { opacity: 1; transform: translateY(0); }
}
`;

// ─── DashboardGrid ──────────────────────────────────────────────────────────

interface DashboardGridProps {
  children: ReactNode;
}

/**
 * Canvas do dashboard. Preenche a área de conteúdo e distribui as fileiras
 * com gap uniforme.
 *
 * O canvas NÃO tem fill próprio: assume o nível do chassi (`contentOuterBG`,
 * o mesmo dos vãos ao redor) — some na moldura, e as únicas superfícies que
 * sobram são os blocos (`DashboardCard`), que formam os separadores.
 * @return {JSX.Element} Canvas com as fileiras do dashboard.
 */
export function DashboardGrid({ children }: DashboardGridProps) {
  const counterRef = useRef(0);
  const stagger = useMemo<StaggerContextValue>(() => ({ next: () => counterRef.current++ }), []);

  return (
    <StaggerContext.Provider value={stagger}>
      <style>{DASH_CARD_KEYFRAMES}</style>
      <Flex
        direction="column"
        gap="4"
        padding="4"
        minHeight="full"
        boxSizing="border-box"
        background="contentOuterBG"
      >
        {children}
      </Flex>
    </StaggerContext.Provider>
  );
}

// ─── DashboardHeader ────────────────────────────────────────────────────────

interface DashboardHeaderProps {
  title: string;
  /** Linha de apoio acima do título. */
  subtitle?: string;
  /** Slot de ações à direita — `ButtonFilter`, `Tabs`, `Button`. */
  actions?: ReactNode;
}

/**
 * Cabeçalho do dashboard. Fica sobre o canvas, fora dos cards — o título
 * nunca disputa espaço com um bloco de dado.
 * @return {JSX.Element} Cabeçalho com título/subtítulo e slot de ações.
 */
export function DashboardHeader({ title, subtitle, actions }: DashboardHeaderProps) {
  return (
    <Flex
      wrap="wrap"
      align="center"
      justify="space-between"
      gap="3"
      paddingX="1"
      overflowWrap="normal"
    >
      <Flex direction="column" gap="1" minWidth={0} flex="1 1 auto">
        {subtitle && (
          <Text fontSize="sm" color="cardTextSecondary">
            {subtitle}
          </Text>
        )}
        <Heading size="lg" fontWeight="semibold" color="cardTextPrimary">
          {title}
        </Heading>
      </Flex>
      {actions && (
        <Flex align="center" wrap="wrap" gap="2" marginLeft="auto">
          {actions}
        </Flex>
      )}
    </Flex>
  );
}

// ─── DashboardRow ───────────────────────────────────────────────────────────

interface DashboardRowProps {
  children: ReactNode;
  /** Alinhamento vertical dos cards da fileira. Default `stretch` (mesma altura). */
  align?: 'stretch' | 'flex-start';
}

/**
 * Fileira de cards do dashboard. Distribui a largura pelos pesos de cada
 * `DashboardCard` (`flex`) e quebra para a linha seguinte quando os cards não
 * cabem na largura mínima — sem breakpoint de viewport.
 * @return {JSX.Element} Fileira com os cards filhos.
 */
export function DashboardRow({ children, align = 'stretch' }: DashboardRowProps) {
  return (
    <RowContext.Provider value={{ inRow: true }}>
      <Flex wrap="wrap" align={align} gap="4">
        {children}
      </Flex>
    </RowContext.Provider>
  );
}

// ─── DashboardCard ──────────────────────────────────────────────────────────

export interface DashboardCardProps {
  children: ReactNode;
  /** Rótulo do bloco, no topo do card. Aceita nó para rótulos com ícone/legenda. */
  title?: ReactNode;
  /** Slot à direita do rótulo — `ChartLegend`, seletor de série, `IconButton`. */
  action?: ReactNode;
  /** Peso da largura dentro de uma `DashboardRow`. Default `1`. */
  flex?: number;
  /** Largura mínima antes de o card passar para a linha seguinte. Default `DASH_CARD_MIN`. */
  minWidth?: number;
  /** Remove o padding interno — blocos que sangram até a borda. */
  bare?: boolean;
  /** Altura mínima do bloco. */
  minHeight?: number | string;
  /** Tom do bloco. `warning` pinta o fill de aviso — evita alerta montado à mão na tela. */
  tone?: 'default' | 'warning';
}

/**
 * Bloco preenchido do dashboard — a unidade visual do kit: fill próprio, raio
 * e sombra do tema, borda sutil (mesma convenção de `MetricCard`/`ChartCard`
 * já existentes no fork).
 * @return {JSX.Element} Card preenchido com título/ação/conteúdo opcionais.
 */
export function DashboardCard({
  children,
  title,
  action,
  flex,
  minWidth = DASH_CARD_MIN,
  bare = false,
  minHeight,
  tone = 'default',
}: DashboardCardProps) {
  const { inRow } = useContext(RowContext);
  const stagger = useContext(StaggerContext);
  // Índice de entrada capturado uma única vez no mount — re-renders (filtro,
  // hover) não reescalonam um card que já entrou na tela.
  const [staggerIndex] = useState(() => stagger?.next() ?? 0);

  const flexValue = inRow ? `${flex ?? 1} 1 ${minWidth}px` : undefined;

  return (
    <Box
      flex={flexValue}
      minWidth={inRow ? `${minWidth}px` : undefined}
      minHeight={minHeight}
      display="flex"
      flexDirection="column"
      background={tone === 'warning' ? 'feedBack.warn' : 'cardBG'}
      borderWidth="1px"
      borderColor="cardBorder"
      borderRadius="2xl"
      boxShadow="cardShadow"
      padding={bare ? 0 : 5}
      overflow="hidden"
      boxSizing="border-box"
      animation="dashCardIn 0.3s ease-out both"
      style={{ animationDelay: `${Math.min(staggerIndex, STAGGER_MAX_STEPS) * STAGGER_STEP_MS}ms` }}
    >
      {(title || action) && (
        <Flex
          align="center"
          justify="space-between"
          gap="3"
          marginBottom="4"
          paddingX={bare ? 5 : 0}
          paddingTop={bare ? 4 : 0}
          overflowWrap="normal"
        >
          {title ? (
            <Heading size="sm" fontWeight="medium" color="cardTextSecondary">
              {title}
            </Heading>
          ) : (
            <span />
          )}
          {action && (
            <Flex align="center" justify="flex-end" wrap="wrap" gap="1" minWidth={0}>
              {action}
            </Flex>
          )}
        </Flex>
      )}
      {children}
    </Box>
  );
}

// ─── DashboardSkeleton ──────────────────────────────────────────────────────

interface DashboardSkeletonProps {
  /** Quantidade de KPIs da primeira fileira. Default `4`. Use `0` para omitir. */
  kpis?: number;
  /** Altura dos blocos de conteúdo, na ordem em que aparecem. */
  blocks?: number[];
}

/**
 * Estado de loading do dashboard. Reproduz a própria grade de cards — mesma
 * quantidade de KPIs e mesmos blocos — para o conteúdo real entrar sem
 * layout shift (anti-flash, ver `useDelayedLoading`).
 * @return {JSX.Element} Grade de esqueletos espelhando o layout final.
 */
export function DashboardSkeleton({ kpis = 4, blocks = [260, 200] }: DashboardSkeletonProps) {
  return (
    <DashboardGrid>
      <Box paddingX="1">
        <Skeleton height="26px" width="200px" />
      </Box>
      {kpis > 0 && (
        <DashboardRow>
          {Array.from({ length: kpis }, (_, index) => (
            <DashboardCard key={index} minWidth={DASH_KPI_MIN}>
              <Skeleton height="62px" />
            </DashboardCard>
          ))}
        </DashboardRow>
      )}
      {blocks.map((height, index) => (
        <DashboardCard key={index}>
          <Skeleton height={`${height}px`} />
        </DashboardCard>
      ))}
    </DashboardGrid>
  );
}

// ─── DashboardKpiCard ───────────────────────────────────────────────────────

interface DashboardKpiCardProps {
  label: string;
  value: string;
  /** Variação percentual (ex.: `'5,4%'`). Ausente/`null` omite o indicador de tendência. */
  trend?: string | null;
  /** Direção da variação. Default `true` (alta). */
  up?: boolean;
  /** Texto de apoio abaixo do valor. */
  sub?: string;
  /** Peso da largura dentro da fileira. Default `1`. */
  flex?: number;
  /** Largura mínima antes de quebrar a linha. Default `DASH_KPI_MIN`. */
  minWidth?: number;
  /**
   * Cor do valor quando ele carrega semântica própria (ex.: verde para
   * "currais disponíveis", vermelho para "nenhum disponível"). Default: cor
   * de texto padrão do tema.
   */
  valueColor?: string;
  /** Texto curto de origem/regra do KPI (fix wave F-211, item C) — ícone `FiInfo` com tooltip ao lado do rótulo. Omite o ícone quando ausente. */
  infoTooltip?: string;
  /** Conteúdo extra na base do card — ex.: `SparklineArea` da série do KPI. */
  children?: ReactNode;
}

/**
 * Degraus do tamanho do valor: número curto ocupa o degrau grande; texto longo desce um degrau.
 * @param {string} value - Texto do valor principal do KPI, já formatado.
 * @return {string} Token de `fontSize` do Chakra (`md`/`xl`/`2xl`).
 */
function kpiValueFontSize(value: string): string {
  if (value.length > 18) return 'md';
  if (value.length > 13) return 'xl';
  return '2xl';
}

/**
 * KPI como card preenchido — reusa o padrão visual já estabelecido pelo
 * `MetricCard` do fork (ícone de tendência + `feedBack.successMain`/`errorMain`)
 * dentro da casca `DashboardCard`.
 * @return {JSX.Element} `DashboardCard` com rótulo, valor, tendência e sparkline opcional.
 */
export function DashboardKpiCard({
  label,
  value,
  trend,
  up = true,
  sub,
  flex,
  minWidth = DASH_KPI_MIN,
  valueColor,
  infoTooltip,
  children,
}: DashboardKpiCardProps) {
  return (
    <DashboardCard flex={flex} minWidth={minWidth}>
      <Flex align="center" gap="1" marginBottom="1">
        <Text fontSize="xs" color="cardTextSecondary">
          {label}
        </Text>
        {infoTooltip && <CardInfoTooltip content={infoTooltip} />}
      </Flex>
      <Text
        fontSize={kpiValueFontSize(value)}
        fontWeight="bold"
        color={valueColor ?? 'cardTextPrimary'}
        lineHeight="tight"
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
        <Flex align="center" gap="1">
          <Icon
            as={up ? FiTrendingUp : FiTrendingDown}
            boxSize={4}
            color={up ? 'feedBack.successMain' : 'feedBack.errorMain'}
          />
          <Text
            fontSize="sm"
            fontWeight="medium"
            color={up ? 'feedBack.successMain' : 'feedBack.errorMain'}
          >
            {trend}
          </Text>
        </Flex>
      )}
      {children && <Box marginTop="3">{children}</Box>}
    </DashboardCard>
  );
}
