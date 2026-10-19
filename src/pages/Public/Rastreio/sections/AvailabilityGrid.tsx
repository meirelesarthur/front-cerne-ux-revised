// src/pages/Public/Rastreio/sections/AvailabilityGrid.tsx
// -----------------------------------------------------------------------------
// Seção `## 4.7` do contrato de tela (F-067, `97-Esteiras/058`,
// TASK-TR-PUB-FE-03): grade de 12 meses (JAN..DEZ, traduzidos via i18n),
// "ativo" quando o mês (1-12) está no array `availability` da API (mirror
// `in_array`, `CL-11`, `LM-01`). Ordem fixa jan→dez.
// -----------------------------------------------------------------------------

import { Badge, SimpleGrid, Text, VStack } from '@chakra-ui/react';

import type { RastreioPublicoLanguage } from '@/@types/language/module-rastreabilidade/rastreio-publico';

interface AvailabilityGridProps {
  availability: number[];
  text: RastreioPublicoLanguage['availability'];
}

export function AvailabilityGrid({ availability, text }: AvailabilityGridProps) {
  const months: Array<{ order: number; label: string }> = [
    { order: 1, label: text.months.january },
    { order: 2, label: text.months.february },
    { order: 3, label: text.months.march },
    { order: 4, label: text.months.april },
    { order: 5, label: text.months.may },
    { order: 6, label: text.months.june },
    { order: 7, label: text.months.july },
    { order: 8, label: text.months.august },
    { order: 9, label: text.months.september },
    { order: 10, label: text.months.october },
    { order: 11, label: text.months.november },
    { order: 12, label: text.months.december },
  ];

  return (
    <VStack align="stretch" gap={3}>
      <Text fontSize="lg" fontWeight="semibold">
        {text.title}
      </Text>

      <SimpleGrid columns={{ base: 4, sm: 6, md: 12 }} gap={2}>
        {months.map((month) => {
          const isActive = availability.includes(month.order);

          return (
            <Badge
              key={month.order}
              justifyContent="center"
              py={2}
              colorPalette={isActive ? 'green' : 'gray'}
              variant={isActive ? 'solid' : 'outline'}
            >
              {month.label}
            </Badge>
          );
        })}
      </SimpleGrid>
    </VStack>
  );
}

export default AvailabilityGrid;
