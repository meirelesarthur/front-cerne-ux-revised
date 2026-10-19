// src/pages/Public/Rastreio/sections/NutritionTable.tsx
// -----------------------------------------------------------------------------
// Seção `## 4.6` do contrato de tela (F-067, `97-Esteiras/058`,
// TASK-TR-PUB-FE-03): tabela nutricional, 16 campos / 8 pares valor+%
// (`FD-07..14`). A API devolve `float` cru — formatação
// `Intl.NumberFormat('pt-BR', {minimumFractionDigits:2,
// maximumFractionDigits:2})` fica no front, FIXA independente do idioma
// ativo (`CV-01`/`## 5` do contrato de tela — o legado não varia o formato
// numérico por idioma, só os rótulos). Mirror do MESMO formatter já usado em
// `FeedlotYards/DetalheFeedlotYard.tsx` (padrão local ao arquivo, não um util
// compartilhado novo).
// -----------------------------------------------------------------------------

import { Table, Text, VStack } from '@chakra-ui/react';

import type { RastreioPublicoLanguage } from '@/@types/language/module-rastreabilidade/rastreio-publico';
import type { PublicTraceabilityData } from '@/@types/v2/Rastreabilidade/rastreio-publico';

const decimalFormatter = new Intl.NumberFormat('pt-BR', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

interface NutritionTableProps {
  data: PublicTraceabilityData;
  text: RastreioPublicoLanguage['nutritionalTable'];
}

export function NutritionTable({ data, text }: NutritionTableProps) {
  const rows: Array<{ label: string; value: number; perc: number }> = [
    { label: text.energeticValue, value: data.energetic_value, perc: data.energetic_value_perc },
    { label: text.carbohydrates, value: data.carbohydrates, perc: data.carbohydrates_perc },
    { label: text.proteins, value: data.proteins, perc: data.proteins_perc },
    { label: text.fatTotal, value: data.fat_total, perc: data.fat_total_perc },
    { label: text.fatSaturated, value: data.fat_saturated, perc: data.fat_saturated_perc },
    { label: text.fatTrans, value: data.fat_trans, perc: data.fat_trans_perc },
    { label: text.dietaryFiber, value: data.dietary_fiber, perc: data.dietary_fiber_perc },
    { label: text.sodium, value: data.sodium, perc: data.sodium_perc },
  ];

  return (
    <VStack align="stretch" gap={3}>
      <Text fontSize="lg" fontWeight="semibold">
        {text.title}
      </Text>

      <Table.Root size="sm" variant="outline" striped>
        <Table.Header>
          <Table.Row>
            <Table.ColumnHeader />
            <Table.ColumnHeader textAlign="end">{text.valueColumnLabel}</Table.ColumnHeader>
            <Table.ColumnHeader textAlign="end">{text.percentageColumnLabel}</Table.ColumnHeader>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {rows.map((row) => (
            <Table.Row key={row.label}>
              <Table.Cell>{row.label}</Table.Cell>
              <Table.Cell textAlign="end">{decimalFormatter.format(row.value)}</Table.Cell>
              <Table.Cell textAlign="end">
                {decimalFormatter.format(row.perc)} {text.percentageColumnLabel}
              </Table.Cell>
            </Table.Row>
          ))}
        </Table.Body>
      </Table.Root>
    </VStack>
  );
}

export default NutritionTable;
