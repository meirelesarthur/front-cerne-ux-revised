// src/components/ui/StepTrack.tsx
// Linha de ETAPAS de um processo (ex.: Pedido → Cotação → Aprovação → …): um
// marcador por etapa ligado por um traço, com o nome embaixo. Estados:
//   done     concluída (verde, check)
//   current  em andamento (verde forte, anel)
//   todo     a fazer (neutro)
//   skipped  pulada pela configuração (tracejada e esmaecida)
//   stopped  o processo parou aqui (recusa ou cancelamento; vermelho)
// Só leitura. A etapa atual leva `aria-current="step"`.
// Opcional (27/11): `group` em cada etapa desenha, acima da linha, uma faixa com
// o nome do grupo sobre as etapas seguidas do mesmo grupo (ex.: Solicitação |
// Ordem de compra). Sem `group`, nada muda.

import { Box, Flex, Text } from '@chakra-ui/react';

import { Icon } from './Icon';

export type StepTrackState = 'done' | 'current' | 'todo' | 'skipped' | 'stopped';

export interface StepTrackItem {
  key: string;
  label: string;
  state: StepTrackState;
  /** Texto de apoio (ex.: "Pulada pelo perfil Simples"); vira o `title`. */
  hint?: string;
  /** Grupo da etapa (ex.: "Solicitação", "Ordem de compra"); etapas seguidas do mesmo grupo ganham uma faixa com o nome em cima. */
  group?: string;
}

export interface StepTrackProps {
  items: StepTrackItem[];
  ariaLabel: string;
}

/** Faixas de grupo: etapas seguidas com o mesmo `group` viram um trecho com o nome. */
function groupSegments(items: StepTrackItem[]): { label: string; count: number }[] {
  const segments: { label: string; count: number }[] = [];
  items.forEach((item) => {
    const last = segments.at(-1);
    if (last && last.label === (item.group ?? '')) last.count += 1;
    else segments.push({ label: item.group ?? '', count: 1 });
  });
  return segments;
}

const MARK: Record<StepTrackState, { bg: string; border: string; color: string }> = {
  done: { bg: 'green.600', border: 'green.600', color: 'white' },
  current: { bg: 'cardBG', border: 'green.600', color: 'green.700' },
  todo: { bg: 'cardBG', border: 'semanticNeutral.300', color: 'fg.muted' },
  skipped: { bg: 'cardBG', border: 'semanticNeutral.300', color: 'fg.muted' },
  stopped: { bg: 'red.600', border: 'red.600', color: 'white' },
};

export function StepTrack({ items, ariaLabel }: StepTrackProps) {
  const segments = items.some((item) => item.group) ? groupSegments(items) : [];
  return (
    <Box w="full">
      {segments.length > 0 && (
        <Flex w="full" mb="10px" aria-hidden>
          {segments.map((segment, index) => (
            <Box key={`${segment.label}-${index}`} flex={segment.count} minW={0} px="6px">
              {segment.label && (
                <Text
                  fontSize="xs"
                  fontWeight="semibold"
                  color="fg.muted"
                  textTransform="uppercase"
                  letterSpacing="0.05em"
                  textAlign="center"
                  lineClamp="1"
                  pb="4px"
                  borderBottomWidth="2px"
                  borderBottomColor={index === 0 ? 'green.600' : 'semanticNeutral.300'}
                >
                  {segment.label}
                </Text>
              )}
            </Box>
          ))}
        </Flex>
      )}
    <Flex as="ol" aria-label={ariaLabel} align="flex-start" w="full" listStyleType="none" m={0} p={0}>
      {items.map((item, index) => {
        const mark = MARK[item.state];
        const isLast = index === items.length - 1;
        const next = items.at(index + 1);
        const lineDone = item.state === 'done' && next && next.state !== 'todo';
        return (
          <Flex
            as="li"
            key={item.key}
            direction="column"
            align="center"
            flex="1"
            minW={0}
            position="relative"
            title={item.hint}
            aria-current={item.state === 'current' ? 'step' : undefined}
            opacity={item.state === 'skipped' ? 0.55 : 1}
          >
            {!isLast && (
              <Box
                position="absolute"
                top="11px"
                left="calc(50% + 14px)"
                right="calc(-50% + 14px)"
                borderTopWidth="2px"
                borderTopStyle={next?.state === 'skipped' ? 'dashed' : 'solid'}
                borderTopColor={lineDone ? 'green.600' : 'semanticNeutral.200'}
              />
            )}
            <Flex
              align="center"
              justify="center"
              boxSize="24px"
              borderRadius="full"
              borderWidth="2px"
              borderStyle={item.state === 'skipped' ? 'dashed' : 'solid'}
              borderColor={mark.border}
              bg={mark.bg}
              color={mark.color}
              boxShadow={item.state === 'current' ? '0 0 0 4px var(--chakra-colors-secondary)' : undefined}
              fontSize="xs"
              fontWeight="semibold"
              flexShrink={0}
            >
              {item.state === 'done' && <Icon name="check" size={12} />}
              {item.state === 'stopped' && <Icon name="close" size={11} />}
              {(item.state === 'current' || item.state === 'todo' || item.state === 'skipped') && index + 1}
            </Flex>
            <Text
              mt="6px"
              fontSize="sm"
              textAlign="center"
              lineClamp="2"
              px="2px"
              lineHeight="1.25"
              fontWeight={item.state === 'current' || item.state === 'stopped' ? 'semibold' : 'medium'}
              color={
                item.state === 'current'
                  ? 'green.700'
                  : item.state === 'stopped'
                    ? 'red.600'
                    : item.state === 'done'
                      ? 'strongText'
                      : 'fg.muted'
              }
              textDecoration={item.state === 'skipped' ? 'line-through' : undefined}
            >
              {item.label}
            </Text>
          </Flex>
        );
      })}
    </Flex>
    </Box>
  );
}

export default StepTrack;
