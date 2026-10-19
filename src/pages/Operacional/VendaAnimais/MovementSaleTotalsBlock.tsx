// src/pages/Operacional/VendaAnimais/MovementSaleTotalsBlock.tsx
// -----------------------------------------------------------------------------
// Bloco "Totais" da Venda de Animais — TASK-VD-FE-02, contrato de tela §7.5.
// Mirror EXATO `RomaneioTotalsBlock.tsx:80-101`: `watch('categories')` puro a
// cada render, SEM `useMemo`/`useWatch` (tela já re-renderiza por keystroke em
// `mode:'onChange'`, mesmo racional).
//
//   total_products = Σ(categories[].value_total)
//   total = round(total_products + freight + other_values - discount, 2)  (CV5)
// -----------------------------------------------------------------------------

import { Box, SimpleGrid, Text } from '@chakra-ui/react';
import { Controller } from 'react-hook-form';

import { InputReadOnly } from '@/components/Form/InputReadOnly';
import { MoneyInput } from '@/components/Form/MoneyInput';

import { useLanguage } from '@/hooks/useLanguage';

import { columnsForm } from '@/constants/coluns-form';

import type { MovementSaleForm } from '@/@types/v2/MovementSales';

import type { Control, UseFormWatch } from 'react-hook-form';

export interface MovementSaleTotalsBlockProps {
  control: Control<MovementSaleForm>;
  watch: UseFormWatch<MovementSaleForm>;
  isDisabled: boolean;
}

function round(value: number, decimals: number): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

function formatCurrencyBRL(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export function MovementSaleTotalsBlock({
  control,
  watch,
  isDisabled,
}: MovementSaleTotalsBlockProps) {
  const { languageGB } = useLanguage();
  const text = languageGB.movementSales.movementSale.form.totals;

  const watchedCategories = watch('categories') ?? [];
  const totalProducts = watchedCategories.reduce(
    (sum, category) => sum + (Number(category?.value_total) || 0),
    0
  );

  const freight = Number(watch('freight')) || 0;
  const otherValues = Number(watch('other_values')) || 0;
  const discount = Number(watch('discount')) || 0;

  const total = round(totalProducts + freight + otherValues - discount, 2);

  return (
    <Box mt={8} pt={4} borderTop="1px solid" borderColor="border.subtle">
      <Text fontSize="sm" fontWeight="semibold" mb={4}>
        {languageGB.movementSales.movementSale.form.sections.totals}
      </Text>

      <SimpleGrid columns={columnsForm.default} gap={6}>
        <InputReadOnly label={text.totalProducts} value={formatCurrencyBRL(totalProducts)} />

        <Controller
          name="freight"
          control={control}
          render={({ field }) => (
            <MoneyInput
              name={field.name}
              label={text.freight}
              value={field.value ?? 0}
              onValueChange={(value) => field.onChange(value)}
              disabled={isDisabled}
            />
          )}
        />

        <Controller
          name="other_values"
          control={control}
          render={({ field }) => (
            <MoneyInput
              name={field.name}
              label={text.otherValues}
              value={field.value ?? 0}
              onValueChange={(value) => field.onChange(value)}
              disabled={isDisabled}
            />
          )}
        />

        <Controller
          name="discount"
          control={control}
          render={({ field }) => (
            <MoneyInput
              name={field.name}
              label={text.discount}
              value={field.value ?? 0}
              onValueChange={(value) => field.onChange(value)}
              disabled={isDisabled}
            />
          )}
        />

        <InputReadOnly label={text.total} value={formatCurrencyBRL(total)} />
      </SimpleGrid>
    </Box>
  );
}
