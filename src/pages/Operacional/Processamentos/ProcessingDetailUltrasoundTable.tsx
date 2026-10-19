// src/pages/Operacional/Processamentos/ProcessingDetailUltrasoundTable.tsx
// -----------------------------------------------------------------------------
// Tabela read-only de `item.ultrasounds` — round-6 (97-Esteiras/039,
// round6-fix-plan.md §3.2, TASK-FE-039-R6-03). Mirror
// `ProcessingDetailAnimalsTable.tsx` / `BirthAnimalDetalhe.tsx:339-360`.
// -----------------------------------------------------------------------------

import { Box, Table, Text } from '@chakra-ui/react';

import formatDate from '@/utils/formatDate';

import type { LanguageDate } from '@/@types/language';
import type { ProcessingDetail } from '@/@types/v2/Processamentos/processing';

interface ProcessingDetailUltrasoundTableProps {
  detail: ProcessingDetail | null;
  languageGB: LanguageDate;
  isLoading: boolean;
}

const noData = '—';

function formatMeasure(value: number | null): string {
  return value !== null ? value.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : noData;
}

export function ProcessingDetailUltrasoundTable({
  detail,
  languageGB,
  isLoading,
}: ProcessingDetailUltrasoundTableProps) {
  const text = languageGB.processamentos.processing.detail;
  const ultrasounds = detail?.ultrasounds ?? [];

  if (!isLoading && ultrasounds.length === 0) {
    return (
      <Text fontSize="sm" color="fg.muted">
        {text.empty.ultrasound}
      </Text>
    );
  }

  return (
    <Box overflowX="auto">
      <Table.Root size="sm">
        <Table.Header>
          <Table.Row>
            <Table.ColumnHeader>{text.ultrasoundTable.identification}</Table.ColumnHeader>
            <Table.ColumnHeader>{text.ultrasoundTable.date}</Table.ColumnHeader>
            <Table.ColumnHeader>{text.ultrasoundTable.aol}</Table.ColumnHeader>
            <Table.ColumnHeader>{text.ultrasoundTable.egs}</Table.ColumnHeader>
            <Table.ColumnHeader>{text.ultrasoundTable.marm}</Table.ColumnHeader>
            <Table.ColumnHeader>{text.ultrasoundTable.classification}</Table.ColumnHeader>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {ultrasounds.map((row) => (
            <Table.Row key={row.uuid}>
              <Table.Cell>{row.animal?.label ?? noData}</Table.Cell>
              <Table.Cell>{formatDate(row.date)}</Table.Cell>
              <Table.Cell>{formatMeasure(row.aol)}</Table.Cell>
              <Table.Cell>{formatMeasure(row.egs)}</Table.Cell>
              <Table.Cell>{formatMeasure(row.marm)}</Table.Cell>
              <Table.Cell>{row.classification ?? noData}</Table.Cell>
            </Table.Row>
          ))}
        </Table.Body>
      </Table.Root>
    </Box>
  );
}
