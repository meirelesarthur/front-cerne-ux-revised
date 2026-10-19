// src/components/charts/SankeyFunnel.tsx
// -----------------------------------------------------------------------------
// Adaptação Chakra v3 + tokens do fork de
// `GB.Cerne.UX/src/components/ui/SankeyFunnel.tsx@8663490` (Tarefa 57,
// contrato de tela v2 §5.3, "Riscos + solução" item 1). SVG puro (bandas +
// curvas conectoras via `<path>`), sem dependência de `@chakra-ui/charts`/
// Recharts — EXCEÇÃO documentada (nenhum primitivo do kit padrão do fork
// cobre "funil com bandas conectadas por curva"; NÃO é precedente para
// outro gráfico futuro, que continua obrigado ao kit `@chakra-ui/charts`).
//
// Adaptações em relação ao `cerne` (fonte não copiada, só o desenho):
// - `t.*` (design/tokens.ts) e `useTheme()`/`isGbMode` do `cerne` NÃO
//   existem no fork — substituídos pelos tokens semânticos do fork
//   (`chart.series.0`, `cardTextSecondary`, `chart.surface`, `chart.grid`),
//   convertidos para CSS var via `tokenToCssVar` (mesma técnica JÁ em uso em
//   `src/pages/Dashboards/UserAnalysis/blocks/ModulosAcessados.tsx` para
//   consumir token semântico em atributo cru fora do Chart.Root do Chakra)
//   — nunca hex fixo. "Modo GB"/paleta especial do `cerne` NÃO existe no
//   fork — omitido por completo (usa sempre a opacidade "modo padrão" do
//   componente original).
// - Textos i18n (label de conversão no tooltip) entram por prop
//   (`hoverConversionLabel`), nunca hardcoded aqui — este componente não lê
//   `useLanguage` (é genérico, a página consumidora decide o texto).
//
// Execução 019 (correção de 3 bugs achados no teste manual do dono) — a nota
// abaixo sobre `useChartScale` foi removida porque a simplificação da Tarefa
// 57 ERA a causa raiz dos 3 bugs (viewBox fixo + tooltip/sublabel sem
// headroom). Correções:
// - BUG 1: `useChartWidth` (`src/hooks/useChartWidth.ts`, porta enxuta do
//   `useChartScale` do `cerne`) mede a largura real do wrapper via
//   `ResizeObserver`; o `viewBox` agora casa 1 unidade = 1px com essa
//   largura, então `width="100%"` deixa de escalar pela altura (o que
//   deixava margens vazias nas laterais em cards largos).
// - BUG 2 (correção pós-teste manual — pedido explícito do dono): o
//   tooltip de hover SEMPRE aparece abaixo da banda (`botY[i] +
//   TOOLTIP_GAP`), igual em todos os estágios — sem flip pra cima e sem
//   clamp vertical (a fórmula herdada do `cerne`, `topY[i] - 44`, e o
//   clamp que a substituiu na 1ª rodada desta execução, ambos jogavam o
//   tooltip pra dentro/perto da banda nas faixas altas). Deixou de ser um
//   `<g>` preso ao `viewBox` do SVG — agora é overlay HTML
//   (`position="absolute"` sobre o wrapper `position="relative"`), o que
//   permite exceder a altura nominal do gráfico sem cortar nada. Como o
//   `viewBox` casa 1:1 com a largura/altura reais (BUG 1), a conversão de
//   coordenada do SVG pra px do overlay é direta, sem fator de escala. O
//   rótulo do eixo da própria banda hovered é ocultado enquanto o tooltip
//   está aberto (a info já está duplicada no tooltip) — garante que o
//   tooltip nunca sobreponha texto, sem precisar de um offset gigante que
//   afastaria demais o tooltip das bandas curtas.
// - BUG 3: `TOP_MARGIN` reserva headroom vertical para o sublabel de
//   conversão acima da banda mais alta (antes `topY` chegava a 0 na banda de
//   100%, cortando o sublabel).
// -----------------------------------------------------------------------------

import { useState } from 'react';

import { Box, Text } from '@chakra-ui/react';

import { useChartWidth } from '@/hooks/useChartWidth';

export interface SankeyFunnelStage {
  label: string;
  value: number;
  sublabel?: string;
}

interface SankeyFunnelProps {
  stages: SankeyFunnelStage[];
  chartHeight?: number;
  /** Sufixo i18n mostrado ao lado do "%" na 2ª linha do tooltip de hover (a partir do 2º estágio). */
  hoverConversionLabel?: string;
}

/**
 * Token semântico (`chart.series.0`, `cardTextSecondary`, ...) → var CSS
 * Chakra, mesma técnica de `ModulosAcessados.tsx`.
 * @param {string} token - Caminho do token semântico (ex.: `chart.series.0`).
 * @return {string} Expressão `var(--chakra-colors-...)` pronta para uso em atributo cru (`fill=`).
 */
function tokenToCssVar(token: string): string {
  return `var(--chakra-colors-${token.replace(/\./g, '-')})`;
}

const SERIES_COLOR = tokenToCssVar('chart.series.0');
const LABEL_COLOR = tokenToCssVar('cardTextSecondary');
const VALUE_TEXT_COLOR = tokenToCssVar('white');
const TOOLTIP_SURFACE = tokenToCssVar('chart.surface');
const TOOLTIP_BORDER = tokenToCssVar('chart.grid');

const FALLBACK_W = 800;

/** Espaço reservado acima/abaixo da área das bandas (BUG 3: headroom pro sublabel de conversão). */
const TOP_MARGIN = 24;
const BOTTOM_MARGIN = 32;

/** Largura do card de tooltip (overlay HTML) e margem mínima até a borda lateral do gráfico. */
const TT_W = 100;
const TT_MARGIN = 4;

/** BUG 2: distância fixa entre a borda inferior da banda e o tooltip — igual para todos os estágios. */
const TOOLTIP_GAP = 6;

export function SankeyFunnel({
  stages,
  chartHeight = 160,
  hoverConversionLabel,
}: SankeyFunnelProps) {
  const [hovIdx, setHovIdx] = useState<number | null>(null);
  const { ref, width } = useChartWidth();

  const H = chartHeight;
  const W = width || FALLBACK_W;
  const n = stages.length;

  if (n === 0) return null;

  const maxVal = stages[0]?.value || 1;
  const blockW = 56;
  const totalGap = W - blockW * n;
  const segW = n > 1 ? totalGap / (n - 1) : 0;

  const bandAreaH = Math.max(H - TOP_MARGIN - BOTTOM_MARGIN, 0);
  const bandH = stages.map((stage) => bandAreaH * (stage.value / maxVal));
  const topY = bandH.map((bh) => TOP_MARGIN + (bandAreaH - bh) / 2);
  const botY = topY.map((ty, i) => ty + bandH[i]);
  const stageX = stages.map((_, i) => i * (blockW + segW));

  const connector = (i: number) => {
    const x1 = stageX[i] + blockW;
    const x2 = stageX[i + 1];
    const t1 = topY[i];
    const b1 = botY[i];
    const t2 = topY[i + 1];
    const b2 = botY[i + 1];
    const mx = (x1 + x2) / 2;
    return `M ${x1},${t1} C ${mx},${t1} ${mx},${t2} ${x2},${t2} L ${x2},${b2} C ${mx},${b2} ${mx},${b1} ${x1},${b1} Z`;
  };

  const fmtVal = (v: number) => (v >= 1000 ? `${(v / 1000).toFixed(1)}K` : `${v}`);
  const pct = (v: number) => Math.round((v / maxVal) * 100);

  return (
    <Box ref={ref} width="100%" position="relative">
      <svg
        width="100%"
        height={H}
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="xMidYMid meet"
        style={{ display: 'block' }}
        role="img"
        aria-label={stages.map((stage) => `${stage.label}: ${stage.value}`).join(', ')}
      >
        {stages.slice(0, -1).map((_, i) => (
          <path key={`conn${i}`} d={connector(i)} fill={SERIES_COLOR} opacity={0.09} />
        ))}

        {stages.map((stage, i) => {
          const x = stageX[i];
          const cx = x + blockW / 2;
          const midY = (topY[i] + botY[i]) / 2;
          const isHovered = hovIdx === i;
          const dimmed = hovIdx !== null && !isHovered;
          const labelAnchor = i === 0 ? 'start' : i === n - 1 ? 'end' : 'middle';
          const labelX = i === 0 ? 2 : i === n - 1 ? W - 2 : cx;

          return (
            <g
              key={stage.label}
              tabIndex={0}
              role="button"
              aria-label={`${stage.label}: ${stage.value}`}
              onMouseEnter={() => setHovIdx(i)}
              onMouseLeave={() => setHovIdx(null)}
              onFocus={() => setHovIdx(i)}
              onBlur={() => setHovIdx(null)}
              style={{ cursor: 'pointer' }}
            >
              <rect
                x={x}
                y={topY[i]}
                width={blockW}
                height={Math.max(bandH[i], 0)}
                rx={5}
                fill={SERIES_COLOR}
                opacity={dimmed ? 0.18 : isHovered ? 1 : 0.88}
                style={{ transition: 'opacity 0.18s ease' }}
              />

              <text
                x={cx}
                y={bandH[i] > 36 ? midY - 9 : midY + 4}
                textAnchor="middle"
                fill={VALUE_TEXT_COLOR}
                opacity={dimmed ? 0.2 : 1}
                style={{ fontSize: 12, fontWeight: 700, transition: 'opacity 0.18s ease' }}
              >
                {fmtVal(stage.value)}
              </text>

              {bandH[i] > 36 && (
                <>
                  <rect
                    x={cx - 17}
                    y={midY + 2}
                    width={34}
                    height={15}
                    rx={7}
                    fill="rgba(0,0,0,0.22)"
                    opacity={dimmed ? 0 : 1}
                    style={{ transition: 'opacity 0.18s ease' }}
                  />
                  <text
                    x={cx}
                    y={midY + 13}
                    textAnchor="middle"
                    fill={VALUE_TEXT_COLOR}
                    opacity={dimmed ? 0 : 1}
                    style={{ fontSize: 9, fontWeight: 600, transition: 'opacity 0.18s ease' }}
                  >
                    {pct(stage.value)}%
                  </text>
                </>
              )}

              {/* BUG 2: oculta o rótulo do eixo da banda hovered — o tooltip abaixo dela já mostra
                  o mesmo texto (`stage.label: valor`), então escondê-lo evita qualquer sobreposição
                  sem precisar afastar o tooltip da banda nos estágios curtos. */}
              <text
                x={labelX}
                y={H - 4}
                textAnchor={labelAnchor}
                fill={LABEL_COLOR}
                opacity={dimmed ? 0.3 : isHovered ? 0 : 1}
                style={{ fontSize: 9, transition: 'opacity 0.18s ease' }}
              >
                {stage.label}
              </text>

              {stage.sublabel && !dimmed && (
                <text
                  x={labelX}
                  y={topY[i] - 6}
                  textAnchor={labelAnchor}
                  fill={LABEL_COLOR}
                  style={{ fontSize: 9 }}
                >
                  {stage.sublabel}
                </text>
              )}
            </g>
          );
        })}
      </svg>

      {/* BUG 2: overlay HTML — sempre abaixo da banda (`botY[i] + TOOLTIP_GAP`), nunca um `<g>`
          preso ao `viewBox`, então não é cortado quando a banda mais alta deixa pouca sobra até
          o fim do SVG. Coordenadas do SVG convertem 1:1 pra px porque o `viewBox` casa a largura
          e a altura reais (BUG 1). */}
      {hovIdx !== null &&
        (() => {
          const i = hovIdx;
          const stage = stages[i];
          const cx = stageX[i] + blockW / 2;
          const ttX = Math.min(Math.max(cx - TT_W / 2, TT_MARGIN), W - TT_W - TT_MARGIN);
          const ttY = botY[i] + TOOLTIP_GAP;

          return (
            <Box
              position="absolute"
              left={`${ttX}px`}
              top={`${ttY}px`}
              width={`${TT_W}px`}
              bg={TOOLTIP_SURFACE}
              borderWidth="0.8px"
              borderColor={TOOLTIP_BORDER}
              borderRadius="md"
              boxShadow="sm"
              paddingX={2}
              paddingY={1.5}
              pointerEvents="none"
              style={{ transition: 'opacity 0.18s ease' }}
            >
              <Text fontSize="9px" fontWeight={600} color={LABEL_COLOR} lineHeight="1.4">
                {stage.label}: {fmtVal(stage.value)}
              </Text>
              {i > 0 && hoverConversionLabel && (
                <Text fontSize="9px" color={SERIES_COLOR} lineHeight="1.4">
                  {pct(stage.value)}% {hoverConversionLabel}
                </Text>
              )}
            </Box>
          );
        })()}
    </Box>
  );
}
