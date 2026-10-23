// src/components/ui/ReconciliationRow.tsx
// Linha de transação bancária na fila de conciliação: ícone de direção (entrada/saída),
// descrição, data, selo de estado e valor. `action` (ex.: "Confirmar") aparece sob o valor
// ao passar o mouse ou quando a linha está selecionada. Teclado: Enter/Espaço selecionam.

import type { ReactNode } from 'react';

import { Box, Flex, Text } from '@chakra-ui/react';

import { Icon } from './Icon';

export type ReconciliationDirection = 'in' | 'out';

export interface ReconciliationRowProps {
  direction: ReconciliationDirection;
  title: string;
  /** Data já formatada. */
  date: string;
  /** Valor já formatado, com sinal (ex.: "+ R$ 5.000,00"). */
  amount: string;
  /** Selo de estado (use o `Badge` do kit). */
  chip?: ReactNode;
  /** Selos extras (ex.: classificação). */
  extra?: ReactNode;
  selected?: boolean;
  onSelect: () => void;
  /** Ação rápida (aparece no hover/seleção). */
  action?: ReactNode;
  /** Seleção em lote: presente = mostra a caixa de marcar. */
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  checkLabel?: string;
}

export function ReconciliationRow({
  direction,
  title,
  date,
  amount,
  chip,
  extra,
  selected = false,
  onSelect,
  action,
  checked = false,
  onCheckedChange,
  checkLabel,
}: ReconciliationRowProps) {
  const isIn = direction === 'in';
  return (
    <Flex
      role="option"
      aria-selected={selected}
      tabIndex={0}
      data-selected={selected || undefined}
      onClick={onSelect}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect();
        }
      }}
      align="center"
      gap="10px"
      px="10px"
      py="10px"
      borderRadius="lg"
      borderWidth="1.5px"
      borderColor={selected ? 'green.100' : 'transparent'}
      bg={selected ? 'green.50' : 'transparent'}
      cursor="pointer"
      transition="background 0.12s ease"
      _hover={{ bg: selected ? 'green.50' : 'semanticNeutral.100' }}
      css={{ '&:hover .row-action, &[data-selected] .row-action': { opacity: 1 } }}
    >
      {onCheckedChange && (
        <input
          type="checkbox"
          checked={checked}
          aria-label={checkLabel ?? title}
          onClick={(e) => e.stopPropagation()}
          onChange={(e) => onCheckedChange(e.target.checked)}
          style={{ accentColor: 'var(--chakra-colors-green-600)', width: 16, height: 16, flexShrink: 0, cursor: 'pointer' }}
        />
      )}
      <Flex
        align="center"
        justify="center"
        flexShrink={0}
        boxSize="28px"
        borderRadius="lg"
        bg={isIn ? 'feedBack.success' : 'feedBack.error'}
        color={isIn ? 'feedBack.successMain' : 'feedBack.errorMain'}
      >
        <Icon name={isIn ? 'trend-up' : 'trend-down'} size={15} />
      </Flex>

      <Box flex="1" minW={0}>
        <Text fontWeight="medium" lineClamp="1" color="fg.default">
          {title}
        </Text>
        <Flex align="center" gap="8px" mt="2px" wrap="wrap">
          <Text fontSize="sm" color="fg.muted">
            {date}
          </Text>
          {chip}
          {extra}
        </Flex>
      </Box>

      <Box textAlign="right" flexShrink={0}>
        <Text fontWeight="semibold" whiteSpace="nowrap" color={isIn ? 'feedBack.successMain' : 'feedBack.errorMain'}>
          {amount}
        </Text>
        {action && (
          <Box className="row-action" opacity={0} transition="opacity 0.12s ease" mt="4px" onClick={(e) => e.stopPropagation()}>
            {action}
          </Box>
        )}
      </Box>
    </Flex>
  );
}

export default ReconciliationRow;
