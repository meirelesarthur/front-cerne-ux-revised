// src/pages/Operacional/Diet/FilterSideDiet.tsx
// -----------------------------------------------------------------------------
// Drawer de FILTRO da listagem de Dieta (Diet — Operacional/Pecuária,
// TASK-FE-DIET-02). Contrato B canônico de filtro (mirror
// `FilterSideFabrica.tsx`/`FilterSideCentroCusto.tsx`) — `<Form formFilter>`
// (`Form.BodyFilter`/`Form.FooterFilter`), seis props exatas, re-hidratação
// em `[isOpen]`.
//
// Campos (FM-DIETS-01..03, `arquitetura-frontend-dieta.md`): `search`
// (texto — **AD-08**, envia `search`, NUNCA `name`), `objective` (select
// `DietObjective` + "Todas"), `date`.
// -----------------------------------------------------------------------------

import { useEffect } from 'react';

import { Text } from '@chakra-ui/react';
import { Controller, useForm } from 'react-hook-form';

import { Button } from '@/components/Button';
import { DateInput } from '@/components/DateInput';
import { FilterSide } from '@/components/FilterSide';
import { Form } from '@/components/Form';
import { Input } from '@/components/Form/Input';
import { Select } from '@/components/Form/Select';

import { dietObjectiveOptions } from '@/constants/diet/options/diet-objective-options';

import type { FilterModalProps } from '@/@types/filter-modal';
import type { Option } from '@/@types/option';
import type { DietFilterForm, DietObjective } from '@/@types/v2/Diets';

// Forma INTERNA do form (só deste componente) — o Select de objetivo
// trabalha com `Option`, o submit converte para `DietFilterForm` (strings
// cruas), mirror `FilterSideFabrica.tsx`.
interface FilterFormValues {
  search: string;
  objective: Option<DietObjective> | null;
  date: string;
}

export function FilterSideDiet({
  isOpen,
  onClose,
  handleReset,
  handleFilterChange,
  filter,
  languageGB,
}: FilterModalProps<DietFilterForm>) {
  const filterText = languageGB.diets.diet.filter;

  const objectiveOptions = dietObjectiveOptions.options(languageGB);

  const pristineFormValues: FilterFormValues = {
    search: '',
    objective: null,
    date: '',
  };

  function toInternalValues(rawFilter?: DietFilterForm | null): FilterFormValues {
    return {
      search: rawFilter?.search ?? '',
      objective: objectiveOptions.find((option) => option.value === rawFilter?.objective) ?? null,
      date: rawFilter?.date ?? '',
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
    // AD-08 — envia `search`, NUNCA `name` (correção de contrato: o legado
    // mandava `name` e por isso nunca filtrava, CL-025).
    handleFilterChange({
      search: data.search.trim() || undefined,
      objective: data.objective?.value || undefined,
      date: data.date || undefined,
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

  // Ao (re)abrir o drawer, ressincroniza o form com o filtro aplicado —
  // exceção documentada da Lei 2 (Contrato B, não é `fillForm` de dado de
  // servidor).
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
            name="objective"
            control={control}
            render={({ field: { name, value, onChange } }) => (
              <Select
                label={filterText.objective}
                placeholder={filterText.objectiveAll}
                name={name}
                value={value}
                onChange={onChange}
                options={objectiveOptions}
              />
            )}
          />

          <Controller
            name="date"
            control={control}
            render={({ field }) => (
              <DateInput
                value={field.value ?? null}
                onChange={(value) => field.onChange(value ?? '')}
                label={filterText.date}
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
