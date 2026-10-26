// src/components/ButtonFilter.tsx
// Botão "Filtros" das listagens (DS `FilterButton`): borda 1.5px; com filtros ativos vira verde
// suave e mostra a contagem em pílula. Fonte única — as telas só passam `filtersApplied`.

import { forwardRef } from 'react';

import { Box, Button as ChakraButton, ButtonProps as ChakraButtonProps, useMediaQuery } from '@chakra-ui/react';

import { useLanguage } from '@/hooks/useLanguage';

import { Icon } from './ui/Icon';
import { Tooltip } from './TooLtip';

interface ButtonProps extends ChakraButtonProps {
  filtersApplied: number;
}

export const ButtonFilter = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ filtersApplied, ...rest }: ButtonProps, ref) => {
    const { languageGB } = useLanguage();
    const [isMobile] = useMediaQuery(['(max-width: 850px)']);

    const appliedCount = filtersApplied ?? 0;
    const active = appliedCount > 0;
    const label = languageGB.defaltStrings.filters;

    return (
      <Tooltip
        label={label}
        placement="top"
        display={isMobile ? '' : 'none'}
        backgroundColor="semanticNeutral.100"
        color="primitiveTexteColor"
      >
        <ChakraButton
          {...rest}
          ref={ref}
          variant="outline"
          h="34px"
          px="14px"
          gap="6px"
          fontSize="base"
          fontWeight="medium"
          borderRadius="8px"
          borderWidth="1.5px"
          borderStyle="solid"
          borderColor={active ? 'green.600' : 'semanticNeutral.300'}
          bg={active ? 'green.50' : 'cardBG'}
          color={active ? 'green.700' : 'fg.muted'}
          _hover={{ bg: active ? 'green.50' : 'semanticNeutral.100' }}
        >
          <Icon name="filter-advanced" size="xs" />
          {isMobile ? '' : label}
          {active && (
            <Box as="span" px="6px" borderRadius="full" bg="green.600" color="white" fontSize="2xs" fontWeight="bold" lineHeight="1.5">
              {appliedCount}
            </Box>
          )}
        </ChakraButton>
      </Tooltip>
    );
  },
);

ButtonFilter.displayName = 'ButtonFilter';
