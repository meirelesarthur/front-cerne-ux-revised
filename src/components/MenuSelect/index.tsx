import { Button, HStack, Icon, Menu, Portal, Text } from '@chakra-ui/react';
import { LuChevronDown } from 'react-icons/lu';

export interface MenuSelectOption {
  key: string;
  label: string;
}

export interface MenuSelectProps {
  /** Valor atualmente selecionado (label) */
  value: string;
  /** Lista de opções disponíveis */
  options: MenuSelectOption[];
  /** Callback quando uma opção é selecionada */
  onChange: (option: MenuSelectOption) => void;
}

/**
 * MenuSelect - Componente de seleção reutilizável
 *
 * Usado em várias telas para seleção de períodos, meses, etc.
 * Exemplos: Dashboard (período), ThreatMap (mês), Pentests (mês)
 */
export function MenuSelect({ value, options, onChange }: MenuSelectProps) {
  return (
    <Menu.Root>
      {/* @ts-ignore - Chakra UI v3 type issue */}
      <Menu.Trigger asChild>
        <Button
          bg="brand.soft"
          color="text.dark"
          px="3"
          py="1.5"
          fontSize="14px"
          fontWeight="semibold"
          borderRadius="4px"
          h="32px"
          _hover={{ bg: 'brand.medium' }}
        >
          <HStack gap="2">
            <Text>{value}</Text>
            <Icon as={LuChevronDown} />
          </HStack>
        </Button>
      </Menu.Trigger>
      <Portal>
        {/* @ts-ignore - Chakra UI v3 type issue */}
        <Menu.Positioner>
          {/* @ts-ignore - Chakra UI v3 type issue */}
          <Menu.Content>
            {options.map((option) => (
              // @ts-ignore - Chakra UI v3 type issue
              <Menu.Item
                key={option.key}
                value={option.key}
                onClick={() => onChange(option)}
                cursor="pointer"
              >
                {option.label}
              </Menu.Item>
            ))}
          </Menu.Content>
        </Menu.Positioner>
      </Portal>
    </Menu.Root>
  );
}

/**
 * Opções de meses pré-definidas
 */
export const monthOptions: MenuSelectOption[] = [
  { key: 'January', label: 'January' },
  { key: 'February', label: 'February' },
  { key: 'March', label: 'March' },
  { key: 'April', label: 'April' },
  { key: 'May', label: 'May' },
  { key: 'June', label: 'June' },
  { key: 'July', label: 'July' },
  { key: 'August', label: 'August' },
  { key: 'September', label: 'September' },
  { key: 'October', label: 'October' },
  { key: 'November', label: 'November' },
  { key: 'December', label: 'December' },
];
