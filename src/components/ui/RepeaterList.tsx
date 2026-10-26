// src/components/ui/RepeaterList.tsx
// Lista dinâmica (adicionar/remover linhas) — DS `RepeaterList`. A moldura (vazio tracejado,
// remover à direita de cada linha, "Adicionar" em verde no fim) vive aqui; a tela só descreve os
// campos de uma linha em `renderRow`. Apresentacional: serve a `useFieldArray` (passe `count`,
// `onAdd` e `onRemove`).

import type { ReactNode } from 'react';

import { Box, Flex, IconButton, Text } from '@chakra-ui/react';

import { Icon } from './Icon';

export interface RepeaterListProps {
  /** Quantidade de linhas (`fields.length`). */
  count: number;
  /** Renderiza os campos da linha `index`. O botão remover é do componente. */
  renderRow: (index: number) => ReactNode;
  /** Chave estável da linha (ex.: `field.id` do `useFieldArray`). */
  rowKey?: (index: number) => string;
  onAdd: () => void;
  onRemove: (index: number) => void;
  addLabel: string;
  emptyText?: string;
  removeLabel?: string;
  disabled?: boolean;
  /** Alinhamento do botão remover: `center` (linha de 1 campo) ou `start` (linha com vários campos). */
  align?: 'center' | 'start';
}

export function RepeaterList({
  count,
  renderRow,
  rowKey,
  onAdd,
  onRemove,
  addLabel,
  emptyText,
  removeLabel = 'Remover linha',
  disabled = false,
  align = 'center',
}: RepeaterListProps) {
  return (
    <Flex direction="column" gap="12px">
      {count === 0 && emptyText && (
        <Box px="16px" py="12px" borderWidth="1px" borderStyle="dashed" borderColor="semanticNeutral.200" borderRadius="8px" textAlign="center">
          <Text fontSize="sm" color="fg.muted">
            {emptyText}
          </Text>
        </Box>
      )}

      {Array.from({ length: count }, (_, index) => (
        <Flex key={rowKey?.(index) ?? index} align={align === 'center' ? 'center' : 'flex-start'} gap="8px">
          <Box flex="1" minW={0}>
            {renderRow(index)}
          </Box>
          <IconButton
            aria-label={removeLabel}
            variant="ghost"
            color="feedBack.errorMain"
            flexShrink={0}
            mt={align === 'start' ? '22px' : 0}
            disabled={disabled}
            onClick={() => onRemove(index)}
            _hover={{ bg: 'feedBack.error' }}
          >
            <Icon name="delete" size={15} />
          </IconButton>
        </Flex>
      ))}

      <Box>
        <Flex
          as="button"
          {...({ type: 'button', disabled } as Record<string, string | boolean>)}
          align="center"
          gap="6px"
          px="10px"
          h="34px"
          borderRadius="8px"
          fontSize="base"
          fontWeight="medium"
          color="green.700"
          opacity={disabled ? 0.5 : 1}
          cursor={disabled ? 'not-allowed' : 'pointer'}
          _hover={{ bg: disabled ? undefined : 'green.50' }}
          onClick={onAdd}
        >
          <Icon name="add" size={14} />
          {addLabel}
        </Flex>
      </Box>
    </Flex>
  );
}

export default RepeaterList;
