// src/components/ui/ToggleCard.tsx
// Cartão de seleção (DS `ToggleSection variant="card"`): ícone + caixa de marcar no topo, título e
// descrição abaixo, dica de confirmação quando ativo. Pensado para grades de opções ligáveis
// (ex.: papéis de uma pessoa). Controlado; acessível como `checkbox`.

import type { KeyboardEvent, ReactNode } from 'react';

import { Box, Flex, Text } from '@chakra-ui/react';

import { Icon, type IconName } from './Icon';

export interface ToggleCardProps {
  title: string;
  description?: string;
  icon?: IconName;
  active: boolean;
  onToggle: (value: boolean) => void;
  disabled?: boolean;
  /** Texto de apoio mostrado quando inativo. */
  inactiveHint?: ReactNode;
  /** Texto de confirmação mostrado (com check) quando ativo. */
  activeHint?: ReactNode;
}

export function ToggleCard({ title, description, icon, active, onToggle, disabled = false, inactiveHint, activeHint }: ToggleCardProps) {
  const toggle = () => {
    if (!disabled) onToggle(!active);
  };
  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      toggle();
    }
  };
  const hint = active ? activeHint : inactiveHint;

  return (
    <Flex
      role="checkbox"
      aria-checked={active}
      aria-disabled={disabled || undefined}
      tabIndex={disabled ? -1 : 0}
      onClick={toggle}
      onKeyDown={onKeyDown}
      direction="column"
      gap="8px"
      p="12px"
      borderRadius="lg"
      borderWidth="1.5px"
      borderStyle="solid"
      borderColor={active ? 'green.600' : 'semanticNeutral.200'}
      bg={active ? 'green.50' : 'cardBG'}
      cursor={disabled ? 'not-allowed' : 'pointer'}
      opacity={disabled ? 0.6 : 1}
      transition="border-color 0.2s ease, background 0.2s ease"
      _focusVisible={{ outline: '2px solid', outlineColor: 'green.600', outlineOffset: '2px' }}
    >
      <Flex align="flex-start" justify="space-between" gap="8px">
        {icon && (
          <Flex
            aria-hidden="true"
            align="center"
            justify="center"
            boxSize="28px"
            borderRadius="8px"
            flexShrink={0}
            bg={active ? 'green.100' : 'semanticNeutral.100'}
            color={active ? 'green.700' : 'fg.muted'}
          >
            <Icon name={icon} size={16} />
          </Flex>
        )}
        <Flex
          aria-hidden="true"
          align="center"
          justify="center"
          boxSize="18px"
          flexShrink={0}
          ml="auto"
          borderRadius="4px"
          borderWidth="1.5px"
          borderStyle="solid"
          borderColor={active ? 'green.600' : 'semanticNeutral.300'}
          bg={active ? 'green.600' : 'inputBG'}
          color="white"
        >
          {active && <Icon name="check" size={11} />}
        </Flex>
      </Flex>

      <Box>
        <Text fontSize="sm" fontWeight="semibold" color={disabled ? 'fg.muted' : 'gray.900'}>
          {title}
        </Text>
        {description && (
          <Text fontSize="xs" color="fg.muted" mt="2px">
            {description}
          </Text>
        )}
      </Box>

      {hint && (
        <Flex align="center" gap="6px" fontSize="xs" fontWeight="medium" color={active ? 'green.700' : 'fg.muted'}>
          {active && <Icon name="check" size={12} />}
          {hint}
        </Flex>
      )}
    </Flex>
  );
}

export default ToggleCard;
