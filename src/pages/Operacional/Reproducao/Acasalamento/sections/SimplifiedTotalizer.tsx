// src/pages/Operacional/Reproducao/Acasalamento/sections/SimplifiedTotalizer.tsx
// -----------------------------------------------------------------------------
// Totalizador de `bm-subform-simplified` (BreedingMating, F-016,
// 97-Esteiras/001, TASK-BM-FE-05, contrato de tela §6.3.3, regra 7 da
// Tarefa) — tabela única `Resumo de Produtos — Inseminação Simplificada`,
// somando `Quantidade` por produto. **Apresentação pura**: os valores já
// estão nas linhas do próprio `useFieldArray` (Produto/Un. Medida/Estoque
// escolhidos em `SimplifiedRow.tsx`) — nenhuma chamada de rede extra aqui,
// nunca entra no payload (mirror `ProtocolTotalizer.tsx`).
// -----------------------------------------------------------------------------

import { useMemo } from 'react';

import { Box, Table, Text } from '@chakra-ui/react';
import { Control, useWatch } from 'react-hook-form';

import type { LanguageDate } from '@/@types/language';
import type { BreedingMatingForm } from '@/@types/v2/BreedingMating';

interface SummaryRow {
  uuid: string;
  label: string;
  measurementLabel: string;
  stock: number;
  quantity: number;
}

export interface SimplifiedTotalizerProps {
  control: Control<BreedingMatingForm>;
  languageGB: LanguageDate;
}

export function SimplifiedTotalizer({ control, languageGB }: SimplifiedTotalizerProps) {
  const text = languageGB.breedingMatings.breedingMating.form.sections.simplified.totalizer;

  const rows = useWatch({ control, name: 'simplified_animals' }) ?? [];

  const summaryRows: SummaryRow[] = useMemo(() => {
    const byProduct = new Map<string, SummaryRow>();
    rows.forEach((row) => {
      if (!row.product?.value) return;
      const existing = byProduct.get(row.product.value);
      const quantity = row.quantity ?? 0;
      if (existing) {
        existing.quantity += quantity;
        return;
      }
      byProduct.set(row.product.value, {
        uuid: row.product.value,
        label: row.product.label,
        measurementLabel: row.measurement?.label ?? '—',
        stock: row.stock ?? 0,
        quantity,
      });
    });
    return Array.from(byProduct.values());
  }, [rows]);

  return (
    <Box mt={6}>
      <Text fontSize="sm" fontWeight="semibold" mb={2}>
        {text.title}
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
          {summaryRows.map((row) => (
            <Table.Row key={row.uuid}>
              <Table.Cell>{row.label}</Table.Cell>
              <Table.Cell>{row.measurementLabel}</Table.Cell>
              <Table.Cell>{row.stock}</Table.Cell>
              <Table.Cell>{row.quantity}</Table.Cell>
            </Table.Row>
          ))}
        </Table.Body>
      </Table.Root>
    </Box>
  );
}

export default SimplifiedTotalizer;
