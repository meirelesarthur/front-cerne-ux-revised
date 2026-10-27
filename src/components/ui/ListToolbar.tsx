// src/components/ui/ListToolbar.tsx
// Barra das listagens (DS `ListToolbar`): busca inline + botão "Filtros" na mesma linha.
// Fonte única do layout — as telas passam só o valor da busca e o que abre o filtro.

import type { ReactNode } from 'react';

import { Box, Flex } from '@chakra-ui/react';

import { useLanguage } from '@/hooks/useLanguage';

import { ButtonFilter } from '../ButtonFilter';
import { Icon } from './Icon';

export interface ListToolbarProps {
  search: string;
  onSearch: (value: string) => void;
  searchPlaceholder?: string;
  /** Abre o drawer de filtros; ausente = sem botão. */
  onOpenFilter?: () => void;
  /** Quantidade de filtros ativos (pílula no botão). */
  filtersApplied?: number;
  /** Conteúdo extra à direita (ex.: alternância de visão). */
  actions?: ReactNode;
}

export function ListToolbar({ search, onSearch, searchPlaceholder, onOpenFilter, filtersApplied = 0, actions }: ListToolbarProps) {
  const { languageGB } = useLanguage();
  const placeholder = searchPlaceholder ?? languageGB.defaltStrings.searchList;
  return (
    <Flex align="center" gap="10px" wrap="wrap" mt={5} mb={3}>
      <Flex
        align="center"
        gap="8px"
        h="34px"
        minW="240px"
        px="10px"
        borderRadius="8px"
        borderWidth="1.5px"
        borderStyle="solid"
        borderColor="semanticNeutral.300"
        bg="cardBG"
        transition="border-color 0.15s ease"
        css={{ '&:focus-within': { borderColor: 'var(--chakra-colors-green-600)' } }}
      >
        <Box color="fg.muted" display="flex" flexShrink={0}>
          <Icon name="search" size="xs" />
        </Box>
        <input
          type="search"
          aria-label={placeholder}
          placeholder={placeholder}
          value={search}
          onChange={(e) => onSearch(e.target.value)}
          style={{ flex: 1, minWidth: 0, border: 'none', outline: 'none', background: 'transparent', fontSize: 'var(--chakra-font-sizes-md)', color: 'inherit' }}
        />
        {search && (
          <Box
            as="button"
            {...({ type: 'button' } as Record<string, string>)}
            aria-label={languageGB.defaltStrings.clearSearch}
            onClick={() => onSearch('')}
            color="fg.muted"
            display="flex"
            _hover={{ color: 'fg.default' }}
          >
            <Icon name="close" size={11} />
          </Box>
        )}
      </Flex>
      <Box flex="1" />
      {onOpenFilter && <ButtonFilter filtersApplied={filtersApplied} onClick={onOpenFilter} />}
      {actions}
    </Flex>
  );
}

export default ListToolbar;
