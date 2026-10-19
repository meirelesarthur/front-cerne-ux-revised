// src/pages/Operacional/FeedlotMapDashboard/dialogs/FeedlotWeighingRow.tsx
// -----------------------------------------------------------------------------
// Linha da tabela de Pesagem Manual — TASK-FE-042-213, `FM062-071`. Célula
// `current_weight` editável, colunas calculadas `gain`/`days`/`gmd`
// recalculadas ao vivo (`CV18-21`). Navegação Tab circular (`SH24`) — o
// campo editável da ÚLTIMA linha intercepta `Tab` (sem Shift) e volta o
// foco para a 1ª linha, via `registerInputRef`/`onTabFromLast` do pai.
// -----------------------------------------------------------------------------

import { Table, Text } from '@chakra-ui/react';
import { Control, useWatch } from 'react-hook-form';

import { NumberInput } from '@/components/Form/NumberInput';

import type { MultipleWeighingsFormValues } from '@/validations/schemas/FeedlotMap/multipleWeighings-schema';

import type { LanguageDate } from '@/@types/language';

function formatDisplayDate(dateStr: string | null): string {
  if (!dateStr) return '—';
  const [year, month, day] = dateStr.split('-');
  return `${day}/${month}/${year}`;
}

function formatNumber(value: number | null, decimals: number): string {
  if (value === null) return '—';
  return value.toLocaleString('pt-BR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

function calcRowMetrics(
  currentWeight: number | null,
  lastWeight: number | null,
  lastWeighingDate: string | null,
  weighingDate: string | null
): { gain: number | null; days: number | null; gmd: number | null } {
  if (currentWeight == null || lastWeight == null) return { gain: null, days: null, gmd: null };
  const gain = currentWeight - lastWeight;
  let days: number | null = null;
  if (lastWeighingDate && weighingDate) {
    const diff = Math.round(
      (new Date(weighingDate).getTime() - new Date(lastWeighingDate).getTime()) /
        (1000 * 60 * 60 * 24)
    );
    days = diff > 0 ? diff : null;
  }
  const gmd = days !== null && days > 0 ? gain / days : null;
  return { gain, days, gmd };
}

export interface FeedlotWeighingRowProps {
  control: Control<MultipleWeighingsFormValues>;
  index: number;
  isLast: boolean;
  weighingDate: string | null;
  onWeightChange: (index: number, value: number | null) => void;
  registerInputRef: (index: number, el: HTMLInputElement | null) => void;
  onTabFromLast: (event: React.KeyboardEvent<HTMLInputElement>) => void;
  languageGB: LanguageDate;
}

export function FeedlotWeighingRow({
  control,
  index,
  isLast,
  weighingDate,
  onWeightChange,
  registerInputRef,
  onTabFromLast,
}: FeedlotWeighingRowProps) {
  const row = useWatch({ control, name: `rows.${index}` });

  const { gain, days, gmd } = calcRowMetrics(
    row?.current_weight ?? null,
    row?.last_weight ?? null,
    row?.last_weighing_date ?? null,
    weighingDate
  );

  return (
    <Table.Row>
      <Table.Cell>{row?.identification}</Table.Cell>
      <Table.Cell>{row?.batch_description}</Table.Cell>
      <Table.Cell>{formatDisplayDate(row?.last_weighing_date ?? null)}</Table.Cell>
      <Table.Cell>{formatNumber(row?.last_weight ?? null, 2)}</Table.Cell>
      <Table.Cell minW="140px">
        <NumberInput
          ref={(el) => registerInputRef(index, el)}
          name={`rows.${index}.current_weight`}
          value={row?.current_weight ?? null}
          onValueChange={(value) => onWeightChange(index, value)}
          allowDot
          decimalPlaces={2}
          min={0}
          onKeyDown={(event) => {
            if (isLast && event.key === 'Tab' && !event.shiftKey) {
              onTabFromLast(event);
            }
          }}
        />
      </Table.Cell>
      <Table.Cell>
        <Text fontSize="sm">{formatNumber(gain, 2)}</Text>
      </Table.Cell>
      <Table.Cell>
        <Text fontSize="sm">{days ?? '—'}</Text>
      </Table.Cell>
      <Table.Cell>
        <Text fontSize="sm">{formatNumber(gmd, 3)}</Text>
      </Table.Cell>
    </Table.Row>
  );
}
