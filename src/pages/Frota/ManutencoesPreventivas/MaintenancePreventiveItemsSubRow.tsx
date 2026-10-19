// src/pages/Frota/ManutencoesPreventivas/MaintenancePreventiveItemsSubRow.tsx
// -----------------------------------------------------------------------------
// Sub-linhas por equipamento (D3, Tarefa 43) — expandidas a partir do MESMO
// payload da listagem (`maintenancePreventive.items[]`), SEM request extra.
// Consumida via `Table.rowSubComponent` (`TableProvider`/`getRowCanExpand`,
// `get_pwa_grid_query_pattern` §TableProvider). Mirror
// `SupplyItemsSubRow.tsx`, enriquecida com Serviço/Horímetro-Km/Observação
// (D3 — sub-linha exibe TODOS os campos do item, não só Equipamento/Data
// Revisão do legado).
// -----------------------------------------------------------------------------

import { Box, Table } from '@chakra-ui/react';

import { useLanguage } from '@/hooks/useLanguage';

import type { MaintenancePreventiveItemData } from '@/@types/v2/MaintenancePreventives';

export interface MaintenancePreventiveItemsSubRowProps {
  items: MaintenancePreventiveItemData[];
}

export function MaintenancePreventiveItemsSubRow({ items }: MaintenancePreventiveItemsSubRowProps) {
  const { languageGB } = useLanguage();
  const text = languageGB.maintenancePreventives.maintenancePreventive.list.itemsTable;
  const noData = '—';

  return (
    <Box overflowX="auto">
      <Table.Root size="sm">
        <Table.Header>
          <Table.Row>
            <Table.ColumnHeader>{text.equipment}</Table.ColumnHeader>
            <Table.ColumnHeader>{text.date}</Table.ColumnHeader>
            <Table.ColumnHeader>{text.message}</Table.ColumnHeader>
            <Table.ColumnHeader>{text.hourMeterKm}</Table.ColumnHeader>
            <Table.ColumnHeader>{text.note}</Table.ColumnHeader>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {items.map((item) => (
            <Table.Row key={item.uuid}>
              <Table.Cell>{item.equipment.description}</Table.Cell>
              <Table.Cell>{item.date ?? noData}</Table.Cell>
              <Table.Cell>{item.message}</Table.Cell>
              <Table.Cell>{item.hour_meter_km ?? noData}</Table.Cell>
              <Table.Cell>{item.note ?? noData}</Table.Cell>
            </Table.Row>
          ))}
        </Table.Body>
      </Table.Root>
    </Box>
  );
}
