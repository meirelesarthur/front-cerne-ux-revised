// src/pages/Operacional/Processamentos/ProcessingDetailSanitaryBlock.tsx
// -----------------------------------------------------------------------------
// `InfoField`s do header (Código/Data) + tabela read-only de
// `item.sanitary.items` — round-6 (97-Esteiras/039, round6-fix-plan.md §3.2,
// TASK-FE-039-R6-03). Mirror `ProcessingDetailAnimalsTable.tsx`.
// -----------------------------------------------------------------------------

import { Box, SimpleGrid, Table, Text } from '@chakra-ui/react';

import formatDate from '@/utils/formatDate';

import { columnsForm } from '@/constants/coluns-form';

import type { LanguageDate } from '@/@types/language';
import type { ProcessingDetail } from '@/@types/v2/Processamentos/processing';

interface ProcessingDetailSanitaryBlockProps {
  detail: ProcessingDetail | null;
  languageGB: LanguageDate;
}

const noData = '—';

function InfoField({ label, value }: { label: string; value: string }) {
  return (
    <Box>
      <Text
        fontSize="xs"
        fontWeight="semibold"
        color="fg.muted"
        textTransform="uppercase"
        letterSpacing="wide"
        mb={1}
      >
        {label}
      </Text>
      <Text fontSize="sm" color="fg.default">
        {value}
      </Text>
    </Box>
  );
}

export function ProcessingDetailSanitaryBlock({
  detail,
  languageGB,
}: ProcessingDetailSanitaryBlockProps) {
  const text = languageGB.processamentos.processing.detail;
  const sanitary = detail?.sanitary;

  if (!sanitary) {
    return null;
  }

  return (
    <>
      <SimpleGrid columns={columnsForm.default} gap={6} mb={4}>
        <InfoField label={text.sanitaryTable.date} value={formatDate(sanitary.date)} />
      </SimpleGrid>

      {sanitary.items.length === 0 ? (
        <Text fontSize="sm" color="fg.muted">
          {text.empty.sanitaryItems}
        </Text>
      ) : (
        <Box overflowX="auto">
          <Table.Root size="sm">
            <Table.Header>
              <Table.Row>
                <Table.ColumnHeader>{text.sanitaryTable.product}</Table.ColumnHeader>
                <Table.ColumnHeader>{text.sanitaryTable.warehouse}</Table.ColumnHeader>
                <Table.ColumnHeader>{text.sanitaryTable.measurement}</Table.ColumnHeader>
                <Table.ColumnHeader>{text.sanitaryTable.quantity}</Table.ColumnHeader>
                <Table.ColumnHeader>{text.sanitaryTable.totalQuantity}</Table.ColumnHeader>
                <Table.ColumnHeader>{text.sanitaryTable.observation}</Table.ColumnHeader>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {sanitary.items.map((item) => (
                <Table.Row key={item.uuid}>
                  <Table.Cell>{item.product.description ?? noData}</Table.Cell>
                  <Table.Cell>{item.warehouse.description ?? noData}</Table.Cell>
                  <Table.Cell>{item.measurement?.description ?? noData}</Table.Cell>
                  <Table.Cell>{item.quantity}</Table.Cell>
                  <Table.Cell>{item.total_quantity}</Table.Cell>
                  <Table.Cell>{item.observation ?? noData}</Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table.Root>
        </Box>
      )}
    </>
  );
}
