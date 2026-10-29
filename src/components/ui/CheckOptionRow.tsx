// src/components/ui/CheckOptionRow.tsx
// Linha de opção com caixa de marcar: ícone, nome + descrição e valor em selo à direita.
// Estado `locked` = já incluído (marcado e travado, valor em verde). Controlado.

import { Box, Flex, Text } from '@chakra-ui/react';

import { Icon, type IconName } from './Icon';

export interface CheckOptionRowProps {
  id: string;
  label: string;
  description?: string;
  /** Ícone do sistema, em um quadrado suave antes do nome. */
  icon?: IconName;
  /** Texto à direita (ex.: "+ R$ 79" ou "incluído"). */
  trailing: string;
  checked: boolean;
  /** Já incluído no plano: marcado e não editável. */
  locked?: boolean;
  onChange: (checked: boolean) => void;
}

export function CheckOptionRow({ id, label, description, icon, trailing, checked, locked = false, onChange }: CheckOptionRowProps) {
  return (
    <Flex
      as="label"
      // `as` não altera os tipos de props do Chakra; `htmlFor` entra por spread.
      {...({ htmlFor: id } as Record<string, string>)}
      align="center"
      gap="12px"
      px={4}
      py="12px"
      borderRadius="xl"
      borderWidth="1px"
      borderColor={checked && !locked ? 'green.600' : 'semanticNeutral.200'}
      bg={locked ? 'semanticNeutral.100' : checked ? 'selectedBG' : 'transparent'}
      cursor={locked ? 'default' : 'pointer'}
      transition="background 0.15s ease"
      _hover={{ bg: 'semanticNeutral.100' }}
      _focusWithin={{ outline: '2px solid', outlineColor: 'green.600', outlineOffset: '-2px' }}
    >
      <input
        id={id}
        type="checkbox"
        checked={checked}
        disabled={locked}
        onChange={(e) => onChange(e.target.checked)}
        style={{ width: 16, height: 16, flexShrink: 0, accentColor: 'var(--chakra-colors-green-600)' }}
      />
      {icon && (
        <Flex align="center" justify="center" flexShrink={0} boxSize="40px" borderRadius="lg" bg="cardBG" borderWidth="1px" borderColor="semanticNeutral.200" color={locked ? 'fg.muted' : 'green.600'}>
          <Icon name={icon} size="lg" />
        </Flex>
      )}
      <Box flex="1" minW={0}>
        <Text fontWeight="medium" color={locked ? 'fg.muted' : 'fg.default'}>
          {label}
        </Text>
        {description && (
          <Text fontSize="base" color="fg.muted" lineHeight="1.4" mt="2px">
            {description}
          </Text>
        )}
      </Box>
      <Box
        as="span"
        flexShrink={0}
        px="10px"
        py="3px"
        borderRadius="full"
        fontSize="base"
        fontWeight="semibold"
        whiteSpace="nowrap"
        // incluído = verde; valor avulso = magenta do catálogo (cor de "adicional")
        bg={locked ? 'selectedBG' : 'addonSoftBG'}
        color={locked ? 'selectedText' : 'addonText'}
      >
        {trailing}
      </Box>
    </Flex>
  );
}

export default CheckOptionRow;
