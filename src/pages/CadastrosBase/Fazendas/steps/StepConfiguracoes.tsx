// src/pages/CadastrosBase/Fazendas/steps/StepConfiguracoes.tsx
// -----------------------------------------------------------------------------
// Etapa 6/6 do wizard de Fazenda — Configurações (TASK-FE-403):
// `cost_processing_date` (`NumberInput` inteiro, 1-28, `PERGUNTA-04`),
// `control_supplies_stock` (Select Sim/Não), Centros de Custo
// (`CheckboxListField`, multiselect — mesmo componente já usado em Permissões
// do Perfil/Operações de Atividade, fonte `GET /cost-centers/options` via
// `useFarmCostCenterOptions`, decisão desta Tarefa: 1 fonte só para os 2
// modos) e `note` (Textarea).
//
// ✅ GAP-FE-125 FECHADO (`TASK-BE-422`, companheira desta execução) —
// `FarmDetailResource` agora expõe `centers[]` (já vinculados) no `show`; o
// campo é reabilitado em modo EDIÇÃO (prefill real via
// `CreateOrUpdateFarm.tsx::fillForm`, a partir de `data.centers`).
// -----------------------------------------------------------------------------

import { Box, SimpleGrid } from '@chakra-ui/react';
import { Controller } from 'react-hook-form';

import { CheckboxListField } from '@/components/Form/CheckboxListField';
import { NumberInput } from '@/components/Form/NumberInput';
import { Select } from '@/components/Form/Select';
import { Textarea } from '@/components/Form/Textarea';

import { useLanguage } from '@/hooks/useLanguage';

import { columnsForm } from '@/constants/coluns-form';

import type { Option } from '@/@types/option';
import type { CostCenterRef } from '@/@types/v2/CostCenters';

import { StepHeading, type StepProps } from './parts';

interface StepConfiguracoesProps extends StepProps {
  centerItems: CostCenterRef[];
  centerSearch: string;
  onCenterSearchChange: (value: string) => void;
  isLoadingCenters: boolean;
  isErrorCenters: boolean;
  onRetryCenters: () => void;
}

export function StepConfiguracoes({
  control,
  register,
  errors,
  disabled,
  loading,
  centerItems,
  centerSearch,
  onCenterSearchChange,
  isLoadingCenters,
  isErrorCenters,
  onRetryCenters,
}: StepConfiguracoesProps) {
  const { languageGB } = useLanguage();
  const text = languageGB.farms.farm.form;

  const yesNoOptions: Option<'true' | 'false'>[] = [
    { value: 'true', label: text.yesNoOptions.yes },
    { value: 'false', label: text.yesNoOptions.no },
  ];

  const checkboxItems = centerItems.map((center) => ({
    value: center.uuid,
    label: `${center.code} — ${center.description}`,
  }));

  return (
    <Box>
      <StepHeading title={text.steps.configuracoes} subtitle={text.stepsSubtitle.configuracoes} />

      <SimpleGrid columns={columnsForm.twoColumns} gap={4} mb={6}>
        <Controller
          name="cost_processing_date"
          control={control}
          render={({ field, fieldState }) => (
            <NumberInput
              name={field.name}
              label={text.fields.costProcessingDate}
              value={field.value}
              onValueChange={(value) => field.onChange(value)}
              min={1}
              max={28}
              decimalPlaces={0}
              isRequired
              error={fieldState.error?.message}
              disabled={disabled || loading}
            />
          )}
        />
        <Controller
          name="control_supplies_stock"
          control={control}
          render={({ field: { name, value, onChange } }) => (
            <Select
              label={text.fields.controlSuppliesStock}
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

      <Box mb={6}>
        <Controller
          name="centers"
          control={control}
          render={({ field: { value, onChange } }) => (
            <CheckboxListField
              label={text.fields.centers}
              items={checkboxItems}
              selectedValues={value ?? []}
              onChange={onChange}
              searchValue={centerSearch}
              onSearchChange={onCenterSearchChange}
              searchPlaceholder={text.placeholders.centersSearch}
              selectAllLabel={text.centersField.selectAllLabel}
              deselectAllLabel={text.centersField.deselectAllLabel}
              selectedCountLabel={text.centersField.selectedCountLabel}
              emptyLabel={text.centersField.emptyLabel}
              isLoading={isLoadingCenters}
              isError={isErrorCenters}
              errorLabel={text.centersField.errorLabel}
              onRetry={onRetryCenters}
              retryLabel={text.centersField.retryLabel}
              isDisabled={disabled}
            />
          )}
        />
      </Box>

      <SimpleGrid columns={columnsForm.oneColumns} gap={4}>
        <Textarea
          label={text.fields.note}
          {...register('note')}
          error={errors.note?.message}
          disabled={disabled}
        />
      </SimpleGrid>
    </Box>
  );
}
