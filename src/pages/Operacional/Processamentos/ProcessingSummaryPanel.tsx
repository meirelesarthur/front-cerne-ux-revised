// src/pages/Operacional/Processamentos/ProcessingSummaryPanel.tsx
// -----------------------------------------------------------------------------
// Painel de resumo AO VIVO (resolve gap #7 + parte do #5, decisão UX-A) —
// TASK-FE-039-PROC-07. Mirror `_forms.blade.php:606-647` (`sumCategories()`)
// e `_card_animal.blade.php:292-362` (`showBatchData()`), 100% client-side
// (derivado de `useWatch({control, name:'animals'})` no pai) — nada é
// buscado fora do form, nada é enviado ao servidor.
//
// DEC-139 (dono) — visível SEMPRE durante a edição no wizard 1-animal-por-
// vez (não escondido por passo), mirror da posição do legado (`_data_table`
// fica no topo do form, não no rodapé).
//
// FIDELIDADE (item de alto risco p/ E2E): o "Valor Unitário" da tabela por
// categoria é o valor do PRIMEIRO animal do grupo — mirror EXATO do
// comportamento do legado (`sumCategories()` lê o `.value_unitary` do
// PRIMEIRO `.categories` daquele grupo no DOM, NÃO uma média). Reproduzido
// fielmente, não "corrigido" (a auditoria não pediu correção deste ponto).
// -----------------------------------------------------------------------------

import { useMemo } from 'react';

import { Box, SimpleGrid, Table, Text } from '@chakra-ui/react';

import type { LanguageDate } from '@/@types/language';
import type { FinishProcessingForm } from '@/@types/v2/Processamentos/processing';

export interface ProcessingSummaryPanelProps {
  animals: FinishProcessingForm['animals'];
  languageGB: LanguageDate;
}

interface CategorySummaryRow {
  key: string;
  label: string;
  quantity: number;
  unitValue: number;
  total: number;
}

interface BatchSummaryRow {
  key: string;
  label: string;
  quantity: number;
  totalUa: number;
  averageWeight: number;
  averagePriceKg: number;
  averagePriceArroba: number;
}

function rowUnitValue(animal: FinishProcessingForm['animals'][number]): number {
  const weight = Number(animal.weight) || 0;
  const value = Number(animal.value) || 0;
  const priceKiloAlive = weight > 0 ? value / weight : 0;
  return priceKiloAlive * weight;
}

// Mirror `sumCategories()` — valor unitário = do PRIMEIRO animal do grupo, não média.
function groupByCategory(animals: FinishProcessingForm['animals']): CategorySummaryRow[] {
  const map = new Map<string, CategorySummaryRow>();
  animals.forEach((animal) => {
    if (!animal.category_uuid) return;
    const key = animal.category_uuid.value;
    const existing = map.get(key);
    if (!existing) {
      const unitValue = rowUnitValue(animal);
      map.set(key, {
        key,
        label: animal.category_uuid!.label,
        quantity: 1,
        unitValue,
        total: unitValue,
      });
    } else {
      existing.quantity += 1;
      existing.total = existing.quantity * existing.unitValue;
    }
  });
  return Array.from(map.values());
}

// Mirror `showBatchData()` — UA total (soma), peso/preços MÉDIOS do grupo.
function groupByBatch(animals: FinishProcessingForm['animals']): BatchSummaryRow[] {
  const accumulator = new Map<
    string,
    {
      key: string;
      label: string;
      quantity: number;
      totalUa: number;
      totalWeight: number;
      totalPriceKg: number;
      totalPriceArroba: number;
    }
  >();

  animals.forEach((animal) => {
    if (!animal.batch_uuid) return;
    const key = animal.batch_uuid.value;
    const weight = Number(animal.weight) || 0;
    const value = Number(animal.value) || 0;
    const priceKiloAlive = weight > 0 ? value / weight : 0;
    const priceArrobaAlive = priceKiloAlive * 30;
    const ua = weight / 450;

    const existing = accumulator.get(key);
    if (!existing) {
      accumulator.set(key, {
        key,
        label: animal.batch_uuid!.label,
        quantity: 1,
        totalUa: ua,
        totalWeight: weight,
        totalPriceKg: priceKiloAlive,
        totalPriceArroba: priceArrobaAlive,
      });
    } else {
      existing.quantity += 1;
      existing.totalUa += ua;
      existing.totalWeight += weight;
      existing.totalPriceKg += priceKiloAlive;
      existing.totalPriceArroba += priceArrobaAlive;
    }
  });

  return Array.from(accumulator.values()).map((entry) => ({
    key: entry.key,
    label: entry.label,
    quantity: entry.quantity,
    totalUa: entry.totalUa,
    averageWeight: entry.totalWeight / entry.quantity,
    averagePriceKg: entry.totalPriceKg / entry.quantity,
    averagePriceArroba: entry.totalPriceArroba / entry.quantity,
  }));
}

function isAnimalRowComplete(animal: FinishProcessingForm['animals'][number]): boolean {
  return (
    !!animal.category_uuid &&
    !!animal.breed_uuid &&
    !!animal.batch_uuid &&
    animal.weight != null &&
    animal.weight > 0 &&
    animal.value != null &&
    animal.identifications.length > 0 &&
    animal.identifications.every(
      (identification) => !!identification.id_animal_uuid && !!identification.identification
    )
  );
}

function formatNumber(value: number): string {
  return value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatCurrencyBRL(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export function ProcessingSummaryPanel({ animals, languageGB }: ProcessingSummaryPanelProps) {
  const summaryText = languageGB.processamentos.processing.form.liveSummary;

  const categoryRows = useMemo(() => groupByCategory(animals), [animals]);
  const batchRows = useMemo(() => groupByBatch(animals), [animals]);
  const filledCount = useMemo(() => animals.filter(isAnimalRowComplete).length, [animals]);

  if (animals.length === 0) {
    return null;
  }

  return (
    <Box bg="bg.subtle" border="1px solid" borderColor="border.subtle" borderRadius="lg" p={4}>
      <Text fontSize="sm" fontWeight="semibold" color="fg.muted" mb={3}>
        {summaryText.progressTemplate
          .replace('{filled}', String(filledCount))
          .replace('{total}', String(animals.length))}
      </Text>

      <SimpleGrid columns={{ base: 1, lg: 2 }} gap={6}>
        <Box overflowX="auto">
          <Text fontSize="sm" fontWeight="semibold" mb={2}>
            {summaryText.categoryTableTitle}
          </Text>
          {categoryRows.length === 0 ? (
            <Text fontSize="sm" color="fg.muted">
              —
            </Text>
          ) : (
            <Table.Root size="sm" variant="outline">
              <Table.Header>
                <Table.Row>
                  <Table.ColumnHeader>{summaryText.categoryColumns.category}</Table.ColumnHeader>
                  <Table.ColumnHeader textAlign="end">
                    {summaryText.categoryColumns.quantity}
                  </Table.ColumnHeader>
                  <Table.ColumnHeader textAlign="end">
                    {summaryText.categoryColumns.unitValue}
                  </Table.ColumnHeader>
                  <Table.ColumnHeader textAlign="end">
                    {summaryText.categoryColumns.total}
                  </Table.ColumnHeader>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {categoryRows.map((row) => (
                  <Table.Row key={row.key}>
                    <Table.Cell>{row.label}</Table.Cell>
                    <Table.Cell textAlign="end">{row.quantity}</Table.Cell>
                    <Table.Cell textAlign="end">{formatCurrencyBRL(row.unitValue)}</Table.Cell>
                    <Table.Cell textAlign="end">{formatCurrencyBRL(row.total)}</Table.Cell>
                  </Table.Row>
                ))}
              </Table.Body>
            </Table.Root>
          )}
        </Box>

        <Box overflowX="auto">
          <Text fontSize="sm" fontWeight="semibold" mb={2}>
            {summaryText.batchTableTitle}
          </Text>
          {batchRows.length === 0 ? (
            <Text fontSize="sm" color="fg.muted">
              —
            </Text>
          ) : (
            <Table.Root size="sm" variant="outline">
              <Table.Header>
                <Table.Row>
                  <Table.ColumnHeader>{summaryText.batchColumns.batch}</Table.ColumnHeader>
                  <Table.ColumnHeader textAlign="end">
                    {summaryText.batchColumns.quantity}
                  </Table.ColumnHeader>
                  <Table.ColumnHeader textAlign="end">
                    {summaryText.batchColumns.totalUa}
                  </Table.ColumnHeader>
                  <Table.ColumnHeader textAlign="end">
                    {summaryText.batchColumns.averageWeight}
                  </Table.ColumnHeader>
                  <Table.ColumnHeader textAlign="end">
                    {summaryText.batchColumns.averagePriceKg}
                  </Table.ColumnHeader>
                  <Table.ColumnHeader textAlign="end">
                    {summaryText.batchColumns.averagePriceArroba}
                  </Table.ColumnHeader>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {batchRows.map((row) => (
                  <Table.Row key={row.key}>
                    <Table.Cell>{row.label}</Table.Cell>
                    <Table.Cell textAlign="end">{row.quantity}</Table.Cell>
                    <Table.Cell textAlign="end">{formatNumber(row.totalUa)}</Table.Cell>
                    <Table.Cell textAlign="end">{formatNumber(row.averageWeight)}</Table.Cell>
                    <Table.Cell textAlign="end">{formatCurrencyBRL(row.averagePriceKg)}</Table.Cell>
                    <Table.Cell textAlign="end">
                      {formatCurrencyBRL(row.averagePriceArroba)}
                    </Table.Cell>
                  </Table.Row>
                ))}
              </Table.Body>
            </Table.Root>
          )}
        </Box>
      </SimpleGrid>
    </Box>
  );
}
