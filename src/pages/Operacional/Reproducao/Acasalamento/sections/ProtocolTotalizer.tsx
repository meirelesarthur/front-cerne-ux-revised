// src/pages/Operacional/Reproducao/Acasalamento/sections/ProtocolTotalizer.tsx
// -----------------------------------------------------------------------------
// Totalizador de `bm-subform-protocol` (BreedingMating, F-016) — tabelas
// `Protocolo` e `Sêmen/Embrião` (`Produto · Un. Medida · Estoque ·
// Quantidade`). Apresentação pura, fora do payload. Regra em
// `acasalamento-protocol-products.ts` (UT-000705, `_forms.blade.php:1025-1205`).
// -----------------------------------------------------------------------------

import { useMemo } from 'react';

import { Box, Table, Text } from '@chakra-ui/react';
import { Control, useWatch } from 'react-hook-form';

import type { LanguageDate } from '@/@types/language';
import type {
  BreedingMatingForm,
  BreedingProtocolStockItem,
  BreedingSeedStockProduct,
} from '@/@types/v2/BreedingMating';

import {
  buildProtocolProductTotals,
  buildSeedProductTotals,
  type ProtocolTotalizerLine,
} from '../acasalamento-protocol-products';

export interface ProtocolTotalizerProps {
  control: Control<BreedingMatingForm>;
  languageGB: LanguageDate;
  protocolItems: BreedingProtocolStockItem[];
  seedProducts: BreedingSeedStockProduct[];
}

function TotalizerStockCell({
  line,
  noStockLabel,
}: {
  line: ProtocolTotalizerLine;
  noStockLabel: string;
}) {
  if (!line.hasStock) {
    return (
      <Table.Cell color="fg.warning" fontWeight="bold">
        {noStockLabel}
      </Table.Cell>
    );
  }
  return (
    <Table.Cell
      color={line.exceedsStock ? 'fg.error' : undefined}
      fontWeight={line.exceedsStock ? 'bold' : undefined}
    >
      {line.stock}
    </Table.Cell>
  );
}

export function ProtocolTotalizer({
  control,
  languageGB,
  protocolItems,
  seedProducts,
}: ProtocolTotalizerProps) {
  const text = languageGB.breedingMatings.breedingMating.form.sections.protocol.totalizer;

  const rows = useWatch({ control, name: 'protocol_animals' });

  const productRows = useMemo(
    () => buildProtocolProductTotals(rows ?? [], protocolItems),
    [rows, protocolItems]
  );

  const semenRows = useMemo(
    () => buildSeedProductTotals(rows ?? [], seedProducts),
    [rows, seedProducts]
  );

  return (
    <Box mt={6}>
      <Text fontSize="sm" fontWeight="semibold" mb={2}>
        {text.protocolTitle}
      </Text>
      <Table.Root size="sm" mb={6}>
        <Table.Header>
          <Table.Row>
            <Table.ColumnHeader>{text.product}</Table.ColumnHeader>
            <Table.ColumnHeader>{text.measurement}</Table.ColumnHeader>
            <Table.ColumnHeader>{text.stock}</Table.ColumnHeader>
            <Table.ColumnHeader>{text.quantity}</Table.ColumnHeader>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {productRows.map((row) => (
            <Table.Row key={row.key}>
              <Table.Cell>{row.label}</Table.Cell>
              <Table.Cell>{row.measurementLabel}</Table.Cell>
              <TotalizerStockCell line={row} noStockLabel={text.noStock} />
              <Table.Cell>{row.quantity}</Table.Cell>
            </Table.Row>
          ))}
        </Table.Body>
      </Table.Root>

      <Text fontSize="sm" fontWeight="semibold" mb={2}>
        {text.semenEmbryoTitle}
      </Text>
      <Table.Root size="sm">
        <Table.Header>
          <Table.Row>
            <Table.ColumnHeader>{text.product}</Table.ColumnHeader>
            <Table.ColumnHeader>{text.measurement}</Table.ColumnHeader>
            <Table.ColumnHeader>{text.stock}</Table.ColumnHeader>
            <Table.ColumnHeader>{text.quantity}</Table.ColumnHeader>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {semenRows.map((row) => (
            <Table.Row key={row.key}>
              <Table.Cell>{row.label}</Table.Cell>
              <Table.Cell>{row.measurementLabel}</Table.Cell>
              <TotalizerStockCell line={row} noStockLabel={text.noStock} />
              <Table.Cell>{row.quantity}</Table.Cell>
            </Table.Row>
          ))}
        </Table.Body>
      </Table.Root>
    </Box>
  );
}

export default ProtocolTotalizer;
