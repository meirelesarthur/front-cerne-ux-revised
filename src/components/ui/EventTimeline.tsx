// src/components/ui/EventTimeline.tsx
// Linha do tempo de EVENTOS (histórico, trâmite, auditoria): um ponto colorido
// por evento ligado por um traço vertical, com cabeçalho (ex.: a situação),
// data à direita, uma linha de metadados e um texto opcional (justificativa).
// Mesmo cartão das tabelas do kit (`SimpleTable`). Base: `Timeline` do Chakra v3.

import type { ReactNode } from 'react';

import { Box, Flex, Text, Timeline } from '@chakra-ui/react';

export interface EventTimelineItem {
  key: string;
  /** Token do tema para o ponto (ex.: `supplyStatus3`); padrão neutro. */
  color?: string;
  /** Linha principal do evento (ex.: `StatusTag` da situação). */
  header: ReactNode;
  /** Data/hora já formatada, alinhada à direita. */
  date?: ReactNode;
  /** Linha secundária (ex.: responsável · tempo gasto). */
  meta?: ReactNode;
  /** Texto livre do evento (ex.: justificativa); some quando vazio. */
  description?: ReactNode;
}

export interface EventTimelineProps {
  items: EventTimelineItem[];
  ariaLabel: string;
}

export function EventTimeline({ items, ariaLabel }: EventTimelineProps) {
  return (
    <Box
      borderWidth="1px"
      borderColor="semanticNeutral.200"
      borderRadius="xl"
      bg="cardBG"
      boxShadow="cardShadow"
      px={5}
      pt={5}
      pb={1}
    >
      <Timeline.Root size="md" variant="plain" aria-label={ariaLabel} as="ol">
        {items.map((item) => (
          <Timeline.Item key={item.key} as="li">
            <Timeline.Connector>
              <Timeline.Separator borderColor="semanticNeutral.200" />
              <Timeline.Indicator
                bg={item.color ?? 'semanticNeutral.400'}
                borderWidth="3px"
                borderColor="cardBG"
                boxShadow="0 0 0 1px var(--chakra-colors-semantic-neutral-200)"
              />
            </Timeline.Connector>
            <Timeline.Content pb={5} gap={1} minW={0}>
              <Flex justify="space-between" align="center" gap={3} wrap="wrap">
                <Box minW={0}>{item.header}</Box>
                {item.date && (
                  <Text fontSize="sm" color="fg.muted" whiteSpace="nowrap" css={{ fontVariantNumeric: 'tabular-nums' }}>
                    {item.date}
                  </Text>
                )}
              </Flex>
              {item.meta && (
                <Text fontSize="sm" color="fg.muted">
                  {item.meta}
                </Text>
              )}
              {item.description && (
                <Box
                  mt={1}
                  px={3}
                  py={2}
                  borderRadius="lg"
                  bg="semanticNeutral.100"
                  fontSize="sm"
                  color="strongText"
                  whiteSpace="pre-wrap"
                >
                  {item.description}
                </Box>
              )}
            </Timeline.Content>
          </Timeline.Item>
        ))}
      </Timeline.Root>
    </Box>
  );
}

export default EventTimeline;
