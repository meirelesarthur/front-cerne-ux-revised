// src/pages/Dashboards/FinancialDashboard/blocks/PosicaoPorCentroCusto.tsx
// Bloco "Contas a pagar por centro de custo" (`LM-001..005`) — lista/tabela
// local não-paginada (`Table` Chakra v3 direto, mesma técnica de
// `UltimasMovimentacoes.tsx` do Livro Caixa).

import { Table, Text } from '@chakra-ui/react';

import { DashboardCard } from '@/components/Dashboard';

import { useLanguage } from '@/hooks/useLanguage';

import formatCurrencyBRL from '@/utils/formatCurrencyBRL';

import type { FinancialByCostCenterRow } from '@/@types/v2/Dashboards/financialDashboard';

interface PosicaoPorCentroCustoProps {
  data: FinancialByCostCenterRow[];
}

export function PosicaoPorCentroCusto({ data }: PosicaoPorCentroCustoProps) {
  const { languageGB } = useLanguage();
  const text = languageGB.dashboards.financialDashboard.byCostCenter;
  const commonText = languageGB.dashboards.common;

  return (
    <DashboardCard flex={2} minWidth={320} title={text.title}>
      {data.length === 0 ? (
        <Text fontSize="sm" color="cardTextSecondary">
          {commonText.noData}
        </Text>
      ) : (
        <Table.Root size="sm">
          <Table.Header>
            <Table.Row>
              <Table.ColumnHeader>{text.columns.costCenter}</Table.ColumnHeader>
              <Table.ColumnHeader textAlign="right">{text.columns.incomes}</Table.ColumnHeader>
              <Table.ColumnHeader textAlign="right">{text.columns.expenses}</Table.ColumnHeader>
              <Table.ColumnHeader textAlign="right">{text.columns.balance}</Table.ColumnHeader>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {data.map((row) => (
              <Table.Row key={row.cost_center_uuid}>
                <Table.Cell>{row.cost_center}</Table.Cell>
                <Table.Cell textAlign="right" fontVariantNumeric="tabular-nums">
                  {formatCurrencyBRL(row.incomes)}
                </Table.Cell>
                <Table.Cell textAlign="right" fontVariantNumeric="tabular-nums">
                  {formatCurrencyBRL(row.expenses)}
                </Table.Cell>
                <Table.Cell
                  textAlign="right"
                  fontVariantNumeric="tabular-nums"
                  fontWeight="semibold"
                  color={row.balance < 0 ? 'feedBack.errorMain' : 'feedBack.successMain'}
                >
                  {formatCurrencyBRL(row.balance)}
                </Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table.Root>
      )}
    </DashboardCard>
  );
}
