// src/pages/Frota/Abastecimentos/SupplyItemsSubRow.tsx
// -----------------------------------------------------------------------------
// Sub-linhas por equipamento (LM-06, Tarefa 40) — expandidas a partir do
// MESMO payload da listagem (`supply.items[]`, contrato §6), SEM request
// extra. Consumida via `Table.rowSubComponent` (`TableProvider`/
// `getRowCanExpand`, `get_pwa_grid_query_pattern` §TableProvider).
// -----------------------------------------------------------------------------

import { Box, Table } from '@chakra-ui/react';

import { useLanguage } from '@/hooks/useLanguage';

import type { SupplyItemData } from '@/@types/v2/Supplies';

export interface SupplyItemsSubRowProps {
  items: SupplyItemData[];
}

export function SupplyItemsSubRow({ items }: SupplyItemsSubRowProps) {
  const { languageGB } = useLanguage();
  const text = languageGB.supplies.supply.list.itemsTable;
  const noData = '—';

  return (
    <Box overflowX="auto">
      <Table.Root size="sm">
        <Table.Header>
          <Table.Row>
            <Table.ColumnHeader>{text.equipment}</Table.ColumnHeader>
            <Table.ColumnHeader>{text.warehouse}</Table.ColumnHeader>
            <Table.ColumnHeader>{text.product}</Table.ColumnHeader>
            <Table.ColumnHeader>{text.measurement}</Table.ColumnHeader>
            <Table.ColumnHeader>{text.hourMeter}</Table.ColumnHeader>
            <Table.ColumnHeader>{text.mileage}</Table.ColumnHeader>
            <Table.ColumnHeader>{text.quantity}</Table.ColumnHeader>
            <Table.ColumnHeader>{text.amount}</Table.ColumnHeader>
            <Table.ColumnHeader>{text.totalAmount}</Table.ColumnHeader>
            <Table.ColumnHeader>{text.responsible}</Table.ColumnHeader>
            <Table.ColumnHeader>{text.note}</Table.ColumnHeader>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {items.map((item) => (
            <Table.Row key={item.uuid}>
              <Table.Cell>{item.equipment.description}</Table.Cell>
              <Table.Cell>{item.warehouse?.description ?? noData}</Table.Cell>
              <Table.Cell>{item.product?.description ?? noData}</Table.Cell>
              <Table.Cell>{item.measurement.name}</Table.Cell>
              <Table.Cell>{item.hour_meter ?? noData}</Table.Cell>
              <Table.Cell>{item.mileage ?? noData}</Table.Cell>
              <Table.Cell>{item.quantity}</Table.Cell>
              <Table.Cell>{item.amount}</Table.Cell>
              <Table.Cell>{item.total_amount}</Table.Cell>
              <Table.Cell>{item.responsible?.name ?? noData}</Table.Cell>
              <Table.Cell>{item.note ?? noData}</Table.Cell>
            </Table.Row>
          ))}
        </Table.Body>
      </Table.Root>
    </Box>
  );
}
