// src/components/ui/BreadcrumbTrail.tsx
// Trilha de navegação — porte fiel de `Breadcrumb.tsx` do design system `cerne`:
// itens separados por "/", ancestrais em tom secundário, último item (página atual)
// em tom primário e `aria-current="page"`. Item com `onClick` vira botão navegável;
// sem `onClick` é texto. Nome diferente de `components/Breadcrumb.tsx` (breadcrumb de
// página legado, baseado em `string[]`) para não quebrar os consumidores dele.

import { Fragment } from 'react';

import { Box, Flex, Text } from '@chakra-ui/react';

import { useLanguage } from '@/hooks/useLanguage';

// `as="button"` não altera os tipos de props do Chakra; o `type` entra por spread.
const BUTTON_ATTRS = { type: 'button' } as Record<string, string>;

export interface BreadcrumbTrailItem {
  label: string;
  onClick?: () => void;
}

export interface BreadcrumbTrailProps {
  items: BreadcrumbTrailItem[];
  /** Rótulo acessível da navegação. */
  label?: string;
}

export function BreadcrumbTrail({ items, label }: BreadcrumbTrailProps) {
  const { languageGB } = useLanguage();
  const trailLabel = label ?? languageGB.defaltStrings.navigationTrail;
  return (
    <Flex as="nav" aria-label={label} align="center" gap="12px" fontSize="base" minW={0}>
      {items.map((item, i) => {
        const isLast = i === items.length - 1;
        const interactive = !isLast && !!item.onClick;
        return (
          <Fragment key={`${item.label}-${i}`}>
            {i > 0 && (
              <Box as="span" color="topBarTextSecondary" flexShrink={0} aria-hidden="true">
                /
              </Box>
            )}
            {interactive ? (
              <Box
                as="button"
                {...BUTTON_ATTRS}
                onClick={item.onClick}
                color="topBarTextSecondary"
                whiteSpace="nowrap"
                transition="color 0.15s ease"
                _hover={{ color: 'green.600' }}
              >
                {item.label}
              </Box>
            ) : (
              <Text
                as="span"
                aria-current={isLast ? 'page' : undefined}
                color={isLast ? 'topBarTextColor' : 'topBarTextSecondary'}
                whiteSpace="nowrap"
                overflow="hidden"
                textOverflow="ellipsis"
              >
                {item.label}
              </Text>
            )}
          </Fragment>
        );
      })}
    </Flex>
  );
}

export default BreadcrumbTrail;
