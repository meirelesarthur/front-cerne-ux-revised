// src/pages/Frota/Manutencoes/MaintenanceItemsSubRow.tsx
// -----------------------------------------------------------------------------
// Sub-linhas por item (mirror LM-1/LM-2 do legado, Tarefa 43) — expandidas a
// partir do MESMO payload da listagem (`maintenance.items[]`), SEM request
// extra. Consumida via `Table.rowSubComponent` (`TableProvider`/
// `getRowCanExpand`, `get_pwa_grid_query_pattern` §TableProvider).
//
// Executor (Funcionário OU Fornecedor) exibido numa única coluna — mirror
// `AM-05`; custo de mão de obra (`employee_amount`/`employee_total_amount`)
// exibido TAL COMO vem do Resource, nenhum recálculo (FID-G3F §3).
// -----------------------------------------------------------------------------

import { Box, Table } from '@chakra-ui/react';

import { useLanguage } from '@/hooks/useLanguage';

import type { MaintenanceItemListData } from '@/@types/v2/Maintenances';

export interface MaintenanceItemsSubRowProps {
  items: MaintenanceItemListData[];
}

export function MaintenanceItemsSubRow({ items }: MaintenanceItemsSubRowProps) {
  const { languageGB } = useLanguage();
  const text = languageGB.maintenances.maintenance.list.itemsTable;
  const noData = '—';

  return (
    <Box overflowX="auto">
      <Table.Root size="sm">
        <Table.Header>
          <Table.Row>
            <Table.ColumnHeader>{text.equipment}</Table.ColumnHeader>
            <Table.ColumnHeader>{text.warehouse}</Table.ColumnHeader>
            <Table.ColumnHeader>{text.product}</Table.ColumnHeader>
            <Table.ColumnHeader>{text.quantity}</Table.ColumnHeader>
            <Table.ColumnHeader>{text.executor}</Table.ColumnHeader>
            <Table.ColumnHeader>{text.laborCost}</Table.ColumnHeader>
            <Table.ColumnHeader>{text.note}</Table.ColumnHeader>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {items.map((item, index) => (
            <Table.Row key={`${item.equipment.uuid}-${index}`}>
              <Table.Cell>{item.equipment.description}</Table.Cell>
              <Table.Cell>{item.warehouse?.description ?? noData}</Table.Cell>
              <Table.Cell>{item.product?.description ?? noData}</Table.Cell>
              <Table.Cell>{item.quantity ?? noData}</Table.Cell>
              <Table.Cell>
                {item.executor_type === 'employee'
                  ? (item.employee?.name ?? noData)
                  : item.executor_type === 'provider'
                    ? (item.provider?.name ?? noData)
                    : noData}
              </Table.Cell>
              <Table.Cell>{item.employee_total_amount ?? noData}</Table.Cell>
              <Table.Cell>{item.note ?? noData}</Table.Cell>
            </Table.Row>
          ))}
        </Table.Body>
      </Table.Root>
    </Box>
  );
}
