// src/components/ui/ViewSelect.tsx
// Seletor de VISÃO de uma lista: um botão só, na linha da busca (mesma altura),
// com o ícone, o nome e o contador da visão aberta; ao clicar, abre um menu com
// todas as visões (ícone + nome + contador, check na atual). Troca a visão com
// um clique sem ocupar uma linha de abas. Controlado (valor + onChange).

import { Box, Flex, Menu, Portal, Text } from '@chakra-ui/react';

import type { IconName } from '@/design/icons';

import { LIST_CONTROL_HEIGHT } from './listControl';
import { Icon } from './Icon';

export interface ViewSelectOption<K extends string = string> {
  key: K;
  label: string;
  icon?: IconName;
  /** Sem contagem (carregando ou falhou), o contador não aparece. */
  count?: number;
}

export interface ViewSelectProps<K extends string = string> {
  options: ViewSelectOption<K>[];
  value: K;
  onChange: (key: K) => void;
  ariaLabel?: string;
}

function CountPill({ count, strong }: { count?: number; strong?: boolean }) {
  if (count === undefined) return null;
  return (
    <Box
      as="span"
      minW="22px"
      px="7px"
      borderRadius="full"
      fontSize="sm"
      fontWeight="semibold"
      textAlign="center"
      bg={strong ? 'green.600' : 'semanticNeutral.100'}
      color={strong ? 'white' : 'semanticNeutral.600'}
      css={{ fontVariantNumeric: 'tabular-nums' }}
    >
      {count}
    </Box>
  );
}

export function ViewSelect<K extends string = string>({ options, value, onChange, ariaLabel }: ViewSelectProps<K>) {
  const current = options.find((option) => option.key === value) ?? options.at(0);
  if (!current) return null;

  return (
    // @ts-ignore ChakraUI v3 headless menu: tipos ainda não compatíveis
    <Menu.Root positioning={{ placement: 'bottom-start' }} onSelect={(details: { value: string }) => onChange(details.value as K)}>
      {/* @ts-ignore ChakraUI v3 headless menu: tipos ainda não compatíveis */}
      <Menu.Trigger asChild>
        <Flex
          as="button"
          {...({ type: 'button' } as Record<string, string>)}
          aria-label={ariaLabel ? `${ariaLabel}: ${current.label}` : current.label}
          align="center"
          gap="8px"
          h={LIST_CONTROL_HEIGHT}
          px="12px"
          flexShrink={0}
          borderRadius="8px"
          borderWidth="1.5px"
          borderColor="green.600"
          bg="secondary"
          color="green.700"
          fontSize="base"
          fontWeight="semibold"
          whiteSpace="nowrap"
          transition="background 0.15s ease"
          _hover={{ bg: 'secondary' }}
          _expanded={{ boxShadow: 'focusGlow' }}
        >
          {current.icon && (
            <Box display="flex" color="green.600">
              <Icon name={current.icon} size="xs" />
            </Box>
          )}
          {current.label}
          <CountPill count={current.count} strong />
          <Box display="flex" color="green.600">
            <Icon name="chevron-down" size="xs" />
          </Box>
        </Flex>
      </Menu.Trigger>
      <Portal>
        {/* @ts-ignore ChakraUI v3 headless menu: tipos ainda não compatíveis */}
        <Menu.Positioner>
          {/* @ts-ignore ChakraUI v3 headless menu: tipos ainda não compatíveis */}
          <Menu.Content
            bg="cardBG"
            borderRadius="lg"
            boxShadow="lg"
            p={1}
            minW="260px"
            border="1px solid"
            borderColor="sidebarBorder"
          >
            {options.map((option) => {
              const active = option.key === current.key;
              return (
                // @ts-ignore ChakraUI v3 headless menu: tipos ainda não compatíveis
                <Menu.Item
                  key={option.key}
                  value={option.key}
                  px="12px"
                  py="9px"
                  gap="10px"
                  borderRadius="md"
                  cursor="pointer"
                  bg={active ? 'secondary' : undefined}
                  _hover={{ bg: active ? 'secondary' : 'sidebarItemHoverBG' }}
                >
                  <Box display="flex" color={active ? 'green.600' : 'fg.muted'} flexShrink={0}>
                    {option.icon && <Icon name={option.icon} size="sm" />}
                  </Box>
                  <Text flex="1" fontSize="base" fontWeight={active ? 'semibold' : 'medium'} color={active ? 'green.700' : 'fg.default'}>
                    {option.label}
                  </Text>
                  <CountPill count={option.count} strong={active} />
                  <Box display="flex" w="16px" color="green.600" flexShrink={0}>
                    {active && <Icon name="check" size="xs" />}
                  </Box>
                </Menu.Item>
              );
            })}
          </Menu.Content>
        </Menu.Positioner>
      </Portal>
    </Menu.Root>
  );
}

export default ViewSelect;
