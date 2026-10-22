// src/components/ui/Badge.tsx
// Selo de status/classificação — porte fiel de `Badge.tsx` do design system `cerne`:
// pílula (raio total), 12px, peso medium, padding 4×10, par bg/texto por variante.
// Fonte única: telas importam este componente em vez de montar `<Badge colorPalette=…>`
// do Chakra com padding/estilo local. Cores por token semântico (claro e escuro).

import { Box } from '@chakra-ui/react';

export type BadgeVariant = 'success' | 'danger' | 'warning' | 'neutral' | 'info' | 'purple' | 'cyan';

export interface BadgeProps {
  label: string;
  variant: BadgeVariant;
}

const variantStyles: Record<BadgeVariant, { bg: string; color: string }> = {
  success: { bg: 'feedBack.success', color: 'feedBack.successMain' },
  danger: { bg: 'feedBack.error', color: 'feedBack.errorMain' },
  warning: { bg: 'feedBack.warn', color: 'feedBack.warnMain' },
  // DS: neutral[100] / neutral[600] (AA 5.68:1)
  neutral: { bg: 'semanticNeutral.100', color: 'semanticNeutral.600' },
  info: { bg: 'feedBack.info', color: 'feedBack.infoMain' },
  // DS accent.purple / accent.cyan (cyan-700 por contraste AA)
  purple: { bg: '#f5f3ff', color: '#7c3aed' },
  cyan: { bg: '#ecfeff', color: '#0e7490' },
};

export function Badge({ label, variant }: BadgeProps) {
  const style = variantStyles[variant];
  return (
    <Box
      as="span"
      display="inline-block"
      px="10px"
      py="4px"
      borderRadius="full"
      fontSize="sm"
      fontWeight="medium"
      lineHeight="1.35"
      whiteSpace="nowrap"
      bg={style.bg}
      color={style.color}
    >
      {label}
    </Box>
  );
}

export default Badge;
