// src/pages/BaseRegistrations/FamilyEquipments/FilterSideFamilyEquipments.tsx
// -----------------------------------------------------------------------------
// Drawer de FILTRO da listagem de Família de Bens (mesma casca global
// <FilterSide> de FilterSideCentroCusto.tsx/FilterSideEspecies.tsx, com o
// Select de `type_depreciation` a mais — sem `type` de Centro de Custo).
//
// Contrato real (TASK-FE-FE-01): search (Input, busca por `description`) +
// is_enabled (Select — Todos/Ativo/Inativo) + type_depreciation (Select —
// Todos/Sem valor residual/Com valor residual).
//
// Contrato B (`FilterModalProps`) — re-hidratação via `filter` (prop) +
// `toInternalValues`, com `useEffect([isOpen])` ressincronizando o form ao
// reabrir o drawer (mesmo padrão de FilterSideDiagnosisPregnancy.tsx).
// -----------------------------------------------------------------------------

import { useEffect } from 'react';

import { Text } from '@chakra-ui/react';
import { Controller, useForm } from 'react-hook-form';

import { Button } from '@/components/Button';
import { FilterSide } from '@/components/FilterSide';
import { Form } from '@/components/Form';
import { Input } from '@/components/Form/Input';
import { Select } from '@/components/Form/Select';

import type { FilterModalProps } from '@/@types/filter-modal';
import type { Option } from '@/@types/option';
import type { FamilyEquipmentFilterForm } from '@/@types/v2/BaseRegistrations/familyEquipment';

// Forma INTERNA do form (só deste componente) — os Selects trabalham com
// `Option`, o submit converte para `FamilyEquipmentFilterForm` (strings cruas).
interface FilterFormValues {
  search?: string;
  is_enabled: Option<string> | null;
  type_depreciation: Option<string> | null;
}

export function FilterSideFamilyEquipments({
  isOpen,
  onClose,
  handleReset,
  handleFilterChange,
  filter,
  languageGB,
}: FilterModalProps<FamilyEquipmentFilterForm>) {
  const text = languageGB.baseRegistrations.familyEquipment.filter;

  const enabledOptions: Option<string>[] = [
    { value: 'true', label: text.enabledOptions.active },
    { value: 'false', label: text.enabledOptions.inactive },
  ];

  const typeDepreciationOptions: Option<string>[] = [
    { value: '0', label: text.typeDepreciationOptions.semResidual },
    { value: '1', label: text.typeDepreciationOptions.comResidual },
  ];

  const pristineFormValues: FilterFormValues = {
    search: '',
    is_enabled: null,
    type_depreciation: null,
  };

  function toInternalValues(rawFilter?: FamilyEquipmentFilterForm | null): FilterFormValues {
    return {
      search: rawFilter?.search ?? '',
      is_enabled: enabledOptions.find((option) => option.value === rawFilter?.is_enabled) ?? null,
      type_depreciation:
        typeDepreciationOptions.find(
          (option) => option.value === rawFilter?.type_depreciation
        ) ?? null,
    };
  }

  const { control, register, handleSubmit, reset } = useForm<FilterFormValues>({
    defaultValues: {
      ...pristineFormValues,
      ...toInternalValues(filter),
    },
  });

  function onSubmit(data: FilterFormValues) {
    handleFilterChange({
      search: data.search?.trim() || undefined,
      is_enabled: (data.is_enabled?.value as FamilyEquipmentFilterForm['is_enabled']) || undefined,
      type_depreciation:
        (data.type_depreciation?.value as FamilyEquipmentFilterForm['type_depreciation']) ||
        undefined,
    });
    onClose();
  }

  function handleResetFilters() {
    handleReset();
    reset(pristineFormValues);
  }

  function handleResetFiltersOnClose() {
    reset({
      ...pristineFormValues,
      ...toInternalValues(filter),
    });
    onClose();
  }

  // Ao (re)abrir o drawer, ressincroniza o form com o filtro aplicado.
  useEffect(() => {
    reset({
      ...pristineFormValues,
      ...toInternalValues(filter),
    });
  }, [isOpen]);

  return (
    <FilterSide isOpen={isOpen} onClose={onClose} languageGB={languageGB}>
      <Form noPadding formFilter onSubmit={handleSubmit(onSubmit)}>
        <Form.BodyFilter>
          <Text fontWeight="bold" color="brandColorText">
            {text.title}
          </Text>

          <Input
            label={text.search}
            placeholder={text.searchPlaceholder}
            {...register('search')}
          />

          <Controller
            name="type_depreciation"
            control={control}
            render={({ field: { name, value, onChange } }) => (
              <Select
                label={text.typeDepreciation}
                placeholder={text.typeDepreciationAll}
                name={name}
                value={value}
                onChange={onChange}
                options={typeDepreciationOptions}
              />
            )}
          />

          <Controller
            name="is_enabled"
            control={control}
            render={({ field: { name, value, onChange } }) => (
              <Select
                label={text.isEnabled}
                placeholder={text.isEnabledAll}
                name={name}
                value={value}
                onChange={onChange}
                options={enabledOptions}
              />
            )}
          />
        </Form.BodyFilter>
        <Form.FooterFilter>
          <Button
            title={languageGB.defaltStrings.clearAllFilters}
            variant="ghost"
            p="0"
            height="4"
            onClick={handleResetFilters}
            type="button"
          />
          <Button
            title={languageGB.defaltStrings.cancel}
            variant="secondary"
            onClick={handleResetFiltersOnClose}
            type="button"
          />
          <Button title={languageGB.defaltStrings.applyFilters} type="submit" />
        </Form.FooterFilter>
      </Form>
    </FilterSide>
  );
}
