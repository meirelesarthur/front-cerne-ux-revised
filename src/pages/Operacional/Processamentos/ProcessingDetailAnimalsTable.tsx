// src/pages/Operacional/Processamentos/ProcessingDetailAnimalsTable.tsx
// -----------------------------------------------------------------------------
// Tabela read-only de `item.animals` — round-6 (97-Esteiras/039,
// round6-fix-plan.md §3.2, TASK-FE-039-R6-03). Mirror
// `BirthAnimalDetalhe.tsx:339-360` / `RomaneioDetalhe.tsx:426-452` (Table.Root
// com `overflowX="auto"`, precedente aceito para tabelas largas). Recebe
// `detail`/`languageGB` do pai — SEM query própria.
// -----------------------------------------------------------------------------

import { Box, Table, Text } from '@chakra-ui/react';

import formatCurrencyBRL from '@/utils/formatCurrencyBRL';
import formatDate from '@/utils/formatDate';
import transformNumberToStringKg from '@/utils/transformNumberToStringKg';

import type { LanguageDate } from '@/@types/language';
import type { ProcessingDetail } from '@/@types/v2/Processamentos/processing';

interface ProcessingDetailAnimalsTableProps {
  detail: ProcessingDetail | null;
  languageGB: LanguageDate;
  isLoading: boolean;
}

const noData = '—';

function formatUA(value: number | null): string {
  return value !== null ? value.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : noData;
}

export function ProcessingDetailAnimalsTable({
  detail,
  languageGB,
  isLoading,
}: ProcessingDetailAnimalsTableProps) {
  const text = languageGB.processamentos.processing.detail;
  const animals = detail?.animals ?? [];

  if (!isLoading && animals.length === 0) {
    return (
      <Text fontSize="sm" color="fg.muted">
        {text.empty.animals}
      </Text>
    );
  }

  return (
    <Box overflowX="auto">
      <Table.Root size="sm">
        <Table.Header>
          <Table.Row>
            <Table.ColumnHeader>{text.animalsTable.identification}</Table.ColumnHeader>
            <Table.ColumnHeader>{text.animalsTable.category}</Table.ColumnHeader>
            <Table.ColumnHeader>{text.animalsTable.breed}</Table.ColumnHeader>
            <Table.ColumnHeader>{text.animalsTable.specie}</Table.ColumnHeader>
            <Table.ColumnHeader>{text.animalsTable.batch}</Table.ColumnHeader>
            <Table.ColumnHeader>{text.animalsTable.categoryMatrice}</Table.ColumnHeader>
            <Table.ColumnHeader>{text.animalsTable.reproductiveStatus}</Table.ColumnHeader>
            <Table.ColumnHeader>{text.animalsTable.birthDate}</Table.ColumnHeader>
            <Table.ColumnHeader>{text.animalsTable.weight}</Table.ColumnHeader>
            <Table.ColumnHeader>{text.animalsTable.lastWeight}</Table.ColumnHeader>
            <Table.ColumnHeader>{text.animalsTable.lastWeightDate}</Table.ColumnHeader>
            <Table.ColumnHeader>{text.animalsTable.priceKilo}</Table.ColumnHeader>
            <Table.ColumnHeader>{text.animalsTable.priceArroba}</Table.ColumnHeader>
            <Table.ColumnHeader>{text.animalsTable.ua}</Table.ColumnHeader>
            <Table.ColumnHeader>{text.animalsTable.unitValue}</Table.ColumnHeader>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {animals.map((animal, index) => (
            <Table.Row key={animal.uuid ?? index}>
              <Table.Cell>{animal.identification}</Table.Cell>
              <Table.Cell>{animal.category?.label ?? noData}</Table.Cell>
              <Table.Cell>{animal.breed?.label ?? noData}</Table.Cell>
              <Table.Cell>{animal.specie?.label ?? noData}</Table.Cell>
              <Table.Cell>{animal.batch?.label ?? noData}</Table.Cell>
              <Table.Cell>{animal.category_matrice?.label ?? noData}</Table.Cell>
              <Table.Cell>{animal.reproductive_status_label ?? noData}</Table.Cell>
              <Table.Cell>{animal.birth_date ? formatDate(animal.birth_date) : noData}</Table.Cell>
              <Table.Cell>
                {animal.weight !== null ? transformNumberToStringKg(animal.weight) : noData}
              </Table.Cell>
              <Table.Cell>
                {animal.last_weight !== null
                  ? transformNumberToStringKg(animal.last_weight)
                  : noData}
              </Table.Cell>
              <Table.Cell>
                {animal.last_weight_date ? formatDate(animal.last_weight_date) : noData}
              </Table.Cell>
              <Table.Cell>
                {animal.price_kilo_alive !== null
                  ? formatCurrencyBRL(animal.price_kilo_alive)
                  : noData}
              </Table.Cell>
              <Table.Cell>
                {animal.price_arroba_alive !== null
                  ? formatCurrencyBRL(animal.price_arroba_alive)
                  : noData}
              </Table.Cell>
              <Table.Cell>{formatUA(animal.unity_animal_ua)}</Table.Cell>
              <Table.Cell>
                {animal.value_unitary !== null ? formatCurrencyBRL(animal.value_unitary) : noData}
              </Table.Cell>
            </Table.Row>
          ))}
        </Table.Body>
      </Table.Root>
    </Box>
  );
}
