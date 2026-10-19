// src/pages/BaseRegistrations/DiagnosisPregnancy/FilterSideDiagnosisPregnancy.tsx
// Drawer de FILTRO da listagem de Diagnóstico de Gestação (search/is_enabled).

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
import type { DiagnosisPregnanciesFilterForm } from '@/@types/v2/BaseRegistrations/diagnosisPregnancy';

// Forma INTERNA do form (só deste componente) — o Select trabalha com
// `Option`, o submit converte para `DiagnosisPregnanciesFilterForm` (string crua).
interface FilterFormValues {
  search?: string;
  is_enabled: Option<string> | null;
}

export function FilterSideDiagnosisPregnancy({
  isOpen,
  onClose,
  handleReset,
  handleFilterChange,
  filter,
  languageGB,
}: FilterModalProps<DiagnosisPregnanciesFilterForm>) {
  const enabledOptions: Option<string>[] = [
    {
      value: 'true',
      label: languageGB.baseRegistrations.diagnosisPregnancy.filter.enabledOptions.active,
    },
    {
      value: 'false',
      label: languageGB.baseRegistrations.diagnosisPregnancy.filter.enabledOptions.inactive,
    },
  ];

  const pristineFormValues: FilterFormValues = {
    search: '',
    is_enabled: null,
  };

  function toInternalValues(rawFilter?: DiagnosisPregnanciesFilterForm | null): FilterFormValues {
    return {
      search: rawFilter?.search ?? '',
      is_enabled: enabledOptions.find((option) => option.value === rawFilter?.is_enabled) ?? null,
    };
  }

  const { control, register, handleSubmit, reset } = useForm<FilterFormValues>({
    mode: 'onChange',
    reValidateMode: 'onChange',
    defaultValues: {
      ...pristineFormValues,
      ...toInternalValues(filter),
    },
  });

  function onSubmit(data: FilterFormValues) {
    handleFilterChange({
      search: data.search?.trim() || undefined,
      is_enabled:
        (data.is_enabled?.value as DiagnosisPregnanciesFilterForm['is_enabled']) || undefined,
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
            {languageGB.baseRegistrations.diagnosisPregnancy.filter.title}
          </Text>

          <Input
            label={languageGB.baseRegistrations.diagnosisPregnancy.filter.search}
            placeholder={languageGB.baseRegistrations.diagnosisPregnancy.filter.searchPlaceholder}
            {...register('search')}
          />

          <Controller
            name="is_enabled"
            control={control}
            render={({ field: { name, value, onChange } }) => (
              <Select
                label={languageGB.baseRegistrations.diagnosisPregnancy.filter.isEnabled}
                placeholder={languageGB.baseRegistrations.diagnosisPregnancy.filter.isEnabledAll}
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
            color="semanticNeutral.900"
            height="4"
            marginTop="4"
            onClick={handleResetFilters}
            type="button"
          />
          <Button
            title={languageGB.defaltStrings.cancel}
            variant="outline"
            onClick={handleResetFiltersOnClose}
            type="button"
          />
          <Button title={languageGB.defaltStrings.applyFilters} type="submit" />
        </Form.FooterFilter>
      </Form>
    </FilterSide>
  );
}
