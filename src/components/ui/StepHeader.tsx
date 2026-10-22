// src/components/ui/StepHeader.tsx
// Cabeçalho de etapa de wizard — porte fiel de `StepHeader.tsx` do design system
// `cerne`: título 2xl/bold centralizado + subtítulo centralizado. Fonte única:
// os wizards (Fazendas, Pessoas…) importam este componente, nunca uma cópia local.

import { Box, Heading, Text } from '@chakra-ui/react';

export interface StepHeaderProps {
  title: string;
  subtitle?: string;
}

export function StepHeader({ title, subtitle }: StepHeaderProps) {
  return (
    <Box textAlign="center" mb="32px">
      <Heading
        as="h2"
        fontSize="24px"
        fontWeight="bold"
        color="fg.default"
        letterSpacing="-0.4px"
        lineHeight="1.2"
        mb={subtitle ? '8px' : 0}
      >
        {title}
      </Heading>
      {subtitle && (
        <Text fontSize="md" color="fg.muted" lineHeight="1.5">
          {subtitle}
        </Text>
      )}
    </Box>
  );
}

export default StepHeader;
