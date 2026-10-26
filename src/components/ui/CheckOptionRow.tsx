// src/components/ui/CheckOptionRow.tsx
// Linha de opção com caixa de marcar: nome + descrição à esquerda, valor à direita.
// Estado `locked` = já incluído (marcado e travado, valor em verde). Controlado.

import { Box, Flex, Text } from '@chakra-ui/react';

export interface CheckOptionRowProps {
  id: string;
  label: string;
  description?: string;
  /** Texto à direita (ex.: "+ R$ 79" ou "incluído"). */
  trailing: string;
  checked: boolean;
  /** Já incluído no plano: marcado e não editável. */
  locked?: boolean;
  onChange: (checked: boolean) => void;
}

export function CheckOptionRow({ id, label, description, trailing, checked, locked = false, onChange }: CheckOptionRowProps) {
  return (
    <Flex
      as="label"
      // `as` não altera os tipos de props do Chakra; `htmlFor` entra por spread.
      {...({ htmlFor: id } as Record<string, string>)}
      align="flex-start"
      gap="12px"
      px={4}
      py="11px"
      borderRadius="xl"
      borderWidth="1px"
      borderColor="semanticNeutral.200"
      bg={locked ? 'semanticNeutral.100' : 'transparent'}
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
        style={{ marginTop: 3, width: 16, height: 16, accentColor: 'var(--chakra-colors-green-600)' }}
      />
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
      <Text
        fontSize="base"
        fontWeight="semibold"
        whiteSpace="nowrap"
        // incluído = verde de sucesso; valor avulso = magenta do catálogo (cor de "adicional")
        color={locked ? 'feedBack.successMain' : 'addonText'}
      >
        {trailing}
      </Text>
    </Flex>
  );
}

export default CheckOptionRow;
