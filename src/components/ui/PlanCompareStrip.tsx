// src/components/ui/PlanCompareStrip.tsx
// Faixa de comparação rápida entre planos para a MESMA configuração: um botão por plano com o
// valor, destaque para o mais barato e estado "não atende". Clicar escolhe o plano.
// Pensada para o painel escuro de resumo (cores claras sobre fundo escuro).

import { Flex, Text } from '@chakra-ui/react';

// `as="button"` não altera os tipos de props do Chakra; o `type` entra por spread.
const BUTTON_ATTRS = { type: 'button' } as Record<string, string>;

export interface PlanCompareItem {
  key: string;
  label: string;
  /** Valor já formatado; `null` quando o plano não atende. */
  value: string | null;
  accent: string;
  current: boolean;
  best: boolean;
}

export interface PlanCompareStripProps {
  items: PlanCompareItem[];
  onSelect: (key: string) => void;
  labels: { cheapest: string; unavailable: string };
}

export function PlanCompareStrip({ items, onSelect, labels }: PlanCompareStripProps) {
  return (
    <Flex gap="8px">
      {items.map((item) => (
        <Flex
          key={item.key}
          as="button"
          {...BUTTON_ATTRS}
          direction="column"
          align="flex-start"
          gap="2px"
          flex="1"
          minW={0}
          px="10px"
          py="8px"
          textAlign="left"
          borderRadius="lg"
          borderWidth="1px"
          borderTopWidth="4px"
          borderColor="rgba(255,255,255,0.12)"
          borderTopColor={item.accent}
          bg={item.current ? 'rgba(255,255,255,0.14)' : 'rgba(255,255,255,0.05)'}
          color="white"
          aria-current={item.current ? 'true' : undefined}
          {...({ disabled: item.value === null } as Record<string, boolean>)}
          opacity={item.value === null ? 0.5 : 1}
          cursor={item.value === null ? 'not-allowed' : 'pointer'}
          onClick={() => item.value !== null && onSelect(item.key)}
        >
          <Text fontSize="sm" color="#9fc2b0">
            {item.label}
          </Text>
          <Text fontSize="18px" fontWeight="bold" lineHeight="1.2">
            {item.value ?? '—'}
          </Text>
          {item.value === null ? (
            <Text fontSize="sm" color="#9fc2b0">
              {labels.unavailable}
            </Text>
          ) : (
            item.best && (
              <Text fontSize="sm" fontWeight="semibold" color="#4ade80">
                {labels.cheapest}
              </Text>
            )
          )}
        </Flex>
      ))}
    </Flex>
  );
}

export default PlanCompareStrip;
