// src/pages/CadastrosBase/Fazendas/steps/StepFinanceiro.tsx
// -----------------------------------------------------------------------------
// Etapa 5/6 do wizard de Fazenda — Financeiro (TASK-FE-403): `coin` (Select,
// hoje só "Real" — PERGUNTA-01/09 do contrato, `char(1)`, valor real em uso
// `'R'`), `total_area`/`value_ha`/`rate` (`NumberInput`, ponto decimal — RN-06:
// o front envia número puro, não mais o formato BR `moeda()` do legado),
// `is_enabled`/`use_cash_book` (Select Sim/Não — componente explícito pedido
// pelo dev em §20.2, não `Switch`).
// -----------------------------------------------------------------------------

import { Box, SimpleGrid } from '@chakra-ui/react';
import { Controller } from 'react-hook-form';

import { NumberInput } from '@/components/Form/NumberInput';
import { Select } from '@/components/Form/Select';

import { useLanguage } from '@/hooks/useLanguage';

import { columnsForm } from '@/constants/coluns-form';

import type { Option } from '@/@types/option';

import { StepHeading, type StepProps } from './parts';

export function StepFinanceiro({ control, disabled, loading }: StepProps) {
  const { languageGB } = useLanguage();
  const text = languageGB.farms.farm.form;

  // PERGUNTA-01/09 (contrato) — `coin` é `char(1)`, único valor real em uso
  // no legado é `'R'` (Real). Select com 1 única opção (fidelidade ao
  // legado — não inventar moedas que o backend/legado nunca ofereceram).
  const coinOptions: Option<string>[] = [{ value: 'R', label: text.coinOptions.real }];

  const yesNoOptions: Option<'true' | 'false'>[] = [
    { value: 'true', label: text.yesNoOptions.yes },
    { value: 'false', label: text.yesNoOptions.no },
  ];

  return (
    <Box>
      <StepHeading title={text.stepsTitle.financeiro} subtitle={text.stepsSubtitle.financeiro} />

      <SimpleGrid columns={columnsForm.default} gap={4} mb={6}>
        <Controller
          name="total_area"
          control={control}
          render={({ field, fieldState }) => (
            <NumberInput
              name={field.name}
              label={text.fields.totalArea}
              value={field.value}
              onValueChange={(value) => field.onChange(value)}
              min={0}
              allowDot
              decimalPlaces={4}
              isRequired
              error={fieldState.error?.message}
              disabled={disabled || loading}
            />
          )}
        />
        <Controller
          name="value_ha"
          control={control}
          render={({ field, fieldState }) => (
            <NumberInput
              name={field.name}
              label={text.fields.valueHa}
              value={field.value}
              onValueChange={(value) => field.onChange(value)}
              min={0}
              allowDot
              decimalPlaces={2}
              isRequired
              error={fieldState.error?.message}
              disabled={disabled || loading}
            />
          )}
        />
        <Controller
          name="rate"
          control={control}
          render={({ field, fieldState }) => (
            <NumberInput
              name={field.name}
              label={text.fields.rate}
              value={field.value}
              onValueChange={(value) => field.onChange(value)}
              min={0}
              max={100}
              allowDot
              decimalPlaces={2}
              error={fieldState.error?.message}
              disabled={disabled || loading}
            />
          )}
        />
        <Controller
          name="coin"
          control={control}
          render={({ field: { name, value, onChange }, fieldState: { error } }) => (
            <Select
              label={text.fields.coin}
              name={name}
              value={coinOptions.find((option) => option.value === value) ?? coinOptions[0]}
              onChange={(opt: Option<string> | null) => onChange(opt?.value ?? 'R')}
              options={coinOptions}
              error={error?.message}
              isRequired
              noClearable
              isDisabled={disabled}
              loading={loading}
            />
          )}
        />
      </SimpleGrid>

      <SimpleGrid columns={columnsForm.twoColumns} gap={4}>
        <Controller
          name="is_enabled"
          control={control}
          render={({ field: { name, value, onChange } }) => (
            <Select
              label={text.fields.isEnabled}
              name={name}
              value={yesNoOptions.find((option) => option.value === String(value)) ?? null}
              onChange={(opt: Option<'true' | 'false'> | null) => onChange(opt?.value === 'true')}
              options={yesNoOptions}
              isRequired
              noClearable
              isDisabled={disabled}
              loading={loading}
            />
          )}
        />
        <Controller
          name="use_cash_book"
          control={control}
          render={({ field: { name, value, onChange } }) => (
            <Select
              label={text.fields.useCashBook}
              name={name}
              value={yesNoOptions.find((option) => option.value === String(value)) ?? null}
              onChange={(opt: Option<'true' | 'false'> | null) => onChange(opt?.value === 'true')}
              options={yesNoOptions}
              isRequired
              noClearable
              isDisabled={disabled}
              loading={loading}
            />
          )}
        />
      </SimpleGrid>
    </Box>
  );
}
