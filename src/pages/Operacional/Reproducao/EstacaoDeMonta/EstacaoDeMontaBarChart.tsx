// src/pages/Operacional/Reproducao/EstacaoDeMonta/EstacaoDeMontaBarChart.tsx
// -----------------------------------------------------------------------------
// Gráfico "Dias por mês" de Estação de Monta — presente nas 3 telas
// (criação, edição e detalhe, `GAP-ESTACAOMONTA-FE-03`), consumindo a MESMA
// função pura `computeMonthlyDaysBars` (`breedingSeasonChart.ts`, Tarefa 12)
// para nunca divergir entre as telas.
//
// Adaptação (não cópia) do `BarChart` do design system `cerne`
// (`GB.Cerne.UX/src/components/ui/BarChart.tsx`, referência visual de
// `GAP-ESTACAOMONTA-FE-01`): barras verticais com rótulo de mês/ano e valor,
// usando os tokens semânticos Chakra REALMENTE definidos neste fork
// (`cardBG`, `cardBorder`, `cardTextPrimary`, `cardTextSecondary`,
// `primary500`) em vez de importar o componente do Storybook — não há
// dependência de chart lib (recharts/apexcharts) comprovada em uso neste
// fork, então a implementação usa Box/Flex do Chakra (fiel ao espírito
// visual do DS, honesto sobre a stack real desta SPA).
//
// CORREÇÃO (bug real reportado em teste manual — barras invisíveis): a
// versão anterior usava nomes de token no padrão do Storybook `cerne`
// (`fg.muted`, `fg.default`, `border.subtle`, `bg.muted`, `primary.500`)
// que este fork NÃO define como uma escala de cor aninhada. Confirmado via
// `system.tokens.getByName(...)` (Chakra v3, `src/theme.ts`):
//   - `colors.primary.500`  → NOT FOUND (não existe token `primary` como
//     escala 50–900 neste fork; o real é o token FLAT `primary500`, já
//     usado em produção em `src/components/ComingSoon/index.tsx`).
//     `bg="primary.500"` portanto não gera NENHUM `background-color` —
//     é exatamente por isso que a barra ficava com a altura certa mas sem
//     nenhuma cor visível (espaço vazio).
//   - `colors.fg.default`   → também NOT FOUND (mascarado pela herança de
//     `color` do texto pai, por isso os números "pareciam" funcionar).
//   - `bg.muted`/`border.subtle`/`fg.muted` resolviam por acaso via preset
//     PADRÃO do Chakra (`defaultConfig`), não pelos tokens reais deste
//     fork — `border.subtle` inclusive caía no mesmo `gray.50` do
//     `bg.muted`, deixando a borda do card praticamente invisível também.
// Trocado para os tokens reais do fork (mesmos usados por
// `src/components/cards/ChartCard.tsx`).
// -----------------------------------------------------------------------------

import { Box, Flex, Text } from '@chakra-ui/react';
import { format } from 'date-fns';
import { enUS } from 'date-fns/locale/en-US';
import { es } from 'date-fns/locale/es';
import { ptBR } from 'date-fns/locale/pt-BR';

import { useLanguage } from '@/hooks/useLanguage';

import type { MonthlyDaysBar } from './breedingSeasonChart';

interface EstacaoDeMontaBarChartProps {
  bars: MonthlyDaysBar[];
  title: string;
  emptyLabel: string;
}

export function EstacaoDeMontaBarChart({ bars, title, emptyLabel }: EstacaoDeMontaBarChartProps) {
  const { languageGB } = useLanguage();
  const locale = languageGB.country === 'BR' ? ptBR : languageGB.country === 'ES' ? es : enUS;

  const maxValue = Math.max(1, ...bars.map((bar) => bar.days));

  return (
    <Box bg="cardBG" border="1px solid" borderColor="cardBorder" borderRadius="lg" p={4}>
      <Text
        fontSize="xs"
        fontWeight="semibold"
        color="cardTextSecondary"
        textTransform="uppercase"
        letterSpacing="wide"
        mb={4}
      >
        {title}
      </Text>

      {bars.length === 0 ? (
        <Flex align="center" justify="center" minH="140px">
          <Text fontSize="sm" color="cardTextSecondary">
            {emptyLabel}
          </Text>
        </Flex>
      ) : (
        <Flex align="flex-end" gap={3} minH="170px" overflowX="auto" pb={1}>
          {bars.map((bar) => {
            const barHeightPct = Math.max((bar.days / maxValue) * 100, 4);
            const monthLabel = format(new Date(bar.year, bar.month - 1, 1), 'MMM/yy', { locale });

            return (
              <Flex
                key={bar.monthKey}
                direction="column"
                align="center"
                flexShrink={0}
                minW="56px"
                gap={1}
                title={`${monthLabel}: ${bar.days}`}
              >
                <Text fontSize="xs" color="cardTextPrimary" fontWeight="medium">
                  {bar.days}
                </Text>
                <Box width="28px" height="120px" display="flex" alignItems="flex-end">
                  <Box
                    width="full"
                    height={`${barHeightPct}%`}
                    bg="primary500"
                    borderRadius="sm"
                    transition="height 0.2s"
                  />
                </Box>
                <Text fontSize="xs" color="cardTextSecondary" textTransform="capitalize">
                  {monthLabel}
                </Text>
              </Flex>
            );
          })}
        </Flex>
      )}
    </Box>
  );
}
