// src/pages/CadastrosBase/Fazendas/steps/StepDocumentacao.tsx
// -----------------------------------------------------------------------------
// Etapa 2/6 do wizard de Fazenda — Documentação (TASK-FE-402): `exploration_type`
// (Select, enum `FarmExplorationType` 6 valores, §5 do contrato), `car`,
// `nirf`, `ccir`, `cafir`, `caepf`, `state_registration`.
// -----------------------------------------------------------------------------

import { Box, SimpleGrid } from '@chakra-ui/react';
import { Controller } from 'react-hook-form';

import { Input } from '@/components/Form/Input';
import { MaskedInput } from '@/components/Form/MaskedInput';
import { Select } from '@/components/Form/Select';

import { useLanguage } from '@/hooks/useLanguage';

import { columnsForm } from '@/constants/coluns-form';

import type { Option } from '@/@types/option';
import type { FarmExplorationTypeValue } from '@/@types/v2/Farms/farm-admin';

import { StepHeading, type StepProps } from './parts';

export function StepDocumentacao({ control, register, errors, disabled, loading }: StepProps) {
  const { languageGB } = useLanguage();
  const text = languageGB.farms.farm.form;

  const explorationTypeOptions: Option<FarmExplorationTypeValue>[] = [
    { value: 1, label: text.explorationTypeOptions.individual },
    { value: 2, label: text.explorationTypeOptions.condominium },
    { value: 3, label: text.explorationTypeOptions.leased },
    { value: 4, label: text.explorationTypeOptions.partnership },
    { value: 5, label: text.explorationTypeOptions.loan },
    { value: 6, label: text.explorationTypeOptions.others },
  ];

  return (
    <Box>
      <StepHeading title={text.steps.documentacao} subtitle={text.stepsSubtitle.documentacao} />

      <SimpleGrid columns={columnsForm.twoColumns} gap={4} mb={6}>
        <Controller
          name="exploration_type"
          control={control}
          render={({ field: { name, value, onChange }, fieldState: { error } }) => (
            <Select
              label={text.fields.explorationType}
              name={name}
              value={explorationTypeOptions.find((option) => option.value === value) ?? null}
              onChange={(opt: Option<FarmExplorationTypeValue> | null) =>
                onChange(opt?.value ?? null)
              }
              options={explorationTypeOptions}
              error={error?.message}
              isDisabled={disabled}
              loading={loading}
            />
          )}
        />
        <MaskedInput
          kind="digits"
          label={text.fields.stateRegistration}
          maxLength={40}
          {...register('state_registration')}
          error={errors.state_registration?.message}
          loading={loading}
          disabled={disabled}
        />
      </SimpleGrid>

      <SimpleGrid columns={columnsForm.default} gap={4}>
        <Input
          label={text.fields.car}
          maxLength={50}
          {...register('car')}
          error={errors.car?.message}
          loading={loading}
          disabled={disabled}
        />
        <Input
          label={text.fields.nirf}
          {...register('nirf')}
          error={errors.nirf?.message}
          loading={loading}
          disabled={disabled}
        />
        <Input
          label={text.fields.ccir}
          {...register('ccir')}
          error={errors.ccir?.message}
          loading={loading}
          disabled={disabled}
        />
        <Input
          label={text.fields.cafir}
          maxLength={8}
          {...register('cafir')}
          error={errors.cafir?.message}
          loading={loading}
          disabled={disabled}
        />
        <Input
          label={text.fields.caepf}
          maxLength={14}
          {...register('caepf')}
          error={errors.caepf?.message}
          loading={loading}
          disabled={disabled}
        />
      </SimpleGrid>
    </Box>
  );
}
