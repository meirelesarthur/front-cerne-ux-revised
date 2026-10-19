// src/pages/Dashboards/CashbookDashboard/blocks/UltimasMovimentacoes.tsx
// Bloco "Últimas movimentações" (ACT-02/LU-07) — lista local não-paginada
// (`Table` Chakra v3 direto, ROTEIRO §3 nota sobre `DataTable`), decisão UX
// de mostrar inline em vez do modal mensal do legado (mesmo endpoint `GET
// cash-book-dashboard/movements` alimenta ambos). Seletor de mês PRÓPRIO do
// bloco — `GET .../movements` exige `month` (1..12), diferente do filtro
// da tela (ano/proprietário/operação); mirror `PrevisaoSemana` para nomes
// de mês localizados via `Intl.DateTimeFormat` (nunca lista fixa hardcoded).

import { Box, Table, Text } from '@chakra-ui/react';

import { DashboardCard } from '@/components/Dashboard';
import { Select } from '@/components/Form/Select';

import { useLanguage } from '@/hooks/useLanguage';

import formatCurrencyBRL from '@/utils/formatCurrencyBRL';

import type { Option } from '@/@types/option';
import type { CashbookMovementRow } from '@/@types/v2/Dashboards/cashbookDashboard';

interface UltimasMovimentacoesProps {
  data: CashbookMovementRow[];
  month: number;
  onMonthChange: (month: number) => void;
  isLoading: boolean;
}

const LOCALE_BY_LANGUAGE: Record<string, string> = {
  BR: 'pt-BR',
  US: 'en-US',
  ES: 'es-ES',
};

export function UltimasMovimentacoes({
  data,
  month,
  onMonthChange,
  isLoading,
}: UltimasMovimentacoesProps) {
  const { languageGB, languageInUse } = useLanguage();
  const text = languageGB.dashboards.cashbookDashboard.movements;
  const commonText = languageGB.dashboards.common;

  const locale = LOCALE_BY_LANGUAGE[languageInUse ?? 'BR'] ?? 'pt-BR';
  const monthFormatter = new Intl.DateTimeFormat(locale, { month: 'long' });
  const monthOptions: Option<number>[] = Array.from({ length: 12 }, (_, index) => ({
    label: monthFormatter.format(new Date(2000, index, 1)),
    value: index + 1,
  }));
  const selectedMonthOption = monthOptions.find((option) => option.value === month) ?? null;

  return (
    <DashboardCard
      flex={3}
      title={text.title}
      action={
        // CORREÇÃO PÓS-HOMOLOGAÇÃO (048): o slot `action` do `DashboardCard`
        // usa `minWidth={0}` (permite a fileira quebrar) — sem largura
        // mínima própria o `Select` encolhia junto e cortava o nome do mês
        // ("ju..."). `minWidth` fixo garante espaço para o mês mais longo
        // (pt-BR "Setembro"/"Novembro"/"Dezembro").
        <Box minWidth="160px">
          <Select
            name="cashbook-movements-month"
            label={text.month}
            value={selectedMonthOption}
            onChange={(option: Option<number> | null) => onMonthChange(option?.value ?? month)}
            options={monthOptions}
            noClearable
          />
        </Box>
      }
    >
      {isLoading ? (
        <Text fontSize="sm" color="cardTextSecondary">
          {commonText.noData}
        </Text>
      ) : data.length === 0 ? (
        <Text fontSize="sm" color="cardTextSecondary">
          {commonText.empty.title}
        </Text>
      ) : (
        <Table.Root size="sm">
          <Table.Header>
            <Table.Row>
              <Table.ColumnHeader>{text.columns.date}</Table.ColumnHeader>
              <Table.ColumnHeader>{text.columns.document}</Table.ColumnHeader>
              <Table.ColumnHeader>{text.columns.person}</Table.ColumnHeader>
              <Table.ColumnHeader>{text.columns.type}</Table.ColumnHeader>
              <Table.ColumnHeader textAlign="right">{text.columns.value}</Table.ColumnHeader>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {data.map((movement, index) => (
              // eslint-disable-next-line react/no-array-index-key -- linha sem uuid próprio (array agregado do backend)
              <Table.Row key={`${movement.date}-${index}`}>
                <Table.Cell whiteSpace="nowrap">{movement.date}</Table.Cell>
                <Table.Cell>{movement.document ?? text.noDocument}</Table.Cell>
                <Table.Cell>{movement.person ?? text.noPerson}</Table.Cell>
                <Table.Cell>{movement.type_label}</Table.Cell>
                <Table.Cell
                  textAlign="right"
                  fontVariantNumeric="tabular-nums"
                  fontWeight="semibold"
                  color={movement.type === 'E' ? 'feedBack.successMain' : 'feedBack.errorMain'}
                >
                  {movement.type === 'S' ? '-' : '+'}
                  {formatCurrencyBRL(movement.value)}
                </Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table.Root>
      )}
    </DashboardCard>
  );
}
