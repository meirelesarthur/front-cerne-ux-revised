// src/pages/CadastrosBase/Especies/FilterSideEspecies.tsx
// -----------------------------------------------------------------------------
// Drawer de FILTRO da listagem de Espécies (mesma casca global <FilterSide> de
// FilterSideCentroCusto.tsx, sem o Select de `type` — exclusivo de Centro de
// Custo, Espécie não tem essa dimensão).
//
// Contrato real (TASK-ESP-01): search (Input, busca por `description`) +
// is_enabled (Select — Todos/Ativa/Inativa).
//
// O componente @/components/Form/Select trabalha com `Option` (label/value),
// não com a string crua que o backend espera — por isso o form RHF usa
// `Option | null` internamente e o `onSubmit` converte para o shape cru de
// `SpeciesFilterForm` antes de chamar `handleFilterChange`.
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
import type { SpeciesFilterForm } from '@/@types/v2/Species/species';

// Forma INTERNA do form (só deste componente) — o Select trabalha com
// `Option`, o onSubmit converte para `SpeciesFilterForm` (string crua).
interface FilterFormValues {
  search?: string;
  is_enabled: Option<string> | null;
}

export function FilterSideEspecies({
  isOpen,
  onClose,
  handleReset,
  handleFilterChange,
  filter,
  languageGB,
}: FilterModalProps<SpeciesFilterForm>) {
  const filterText = languageGB.species.specie.filter;

  const enabledOptions: Option<string>[] = [
    { value: 'true', label: filterText.enabledOptions.active },
    { value: 'false', label: filterText.enabledOptions.inactive },
  ];

  const pristineFormValues: FilterFormValues = {
    search: '',
    is_enabled: null,
  };

  function toInternalValues(rawFilter?: SpeciesFilterForm | null): FilterFormValues {
    return {
      search: rawFilter?.search ?? '',
      is_enabled: enabledOptions.find((option) => option.value === rawFilter?.is_enabled) ?? null,
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
      is_enabled: (data.is_enabled?.value as SpeciesFilterForm['is_enabled']) || undefined,
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
            {filterText.title}
          </Text>

          <Input
            label={filterText.search}
            placeholder={filterText.searchPlaceholder}
            {...register('search')}
          />

          <Controller
            name="is_enabled"
            control={control}
            render={({ field: { name, value, onChange } }) => (
              <Select
                label={filterText.isEnabled}
                placeholder={filterText.isEnabledAll}
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
