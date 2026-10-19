// src/pages/Operacional/Reproducao/LoteReproducao/FilterSideLoteReproducao.tsx
// -----------------------------------------------------------------------------
// Drawer de FILTRO da listagem de Lotes/Reprodução — Contrato B canônico
// (`FilterModalProps<T>`, seis props exatas), corpo em `<Form noPadding
// formFilter>`. Mirror mecânico de `FilterSideBullSeedSeason.tsx`
// (`BreedingBatchFilterRequest` só tem `start_date`/`end_date`, contrato de
// tela §4 — sem campo de busca textual, sem coluna de ordenação clicável).
//
// Re-hidratação via `toInternalValues(filter)` num ÚNICO `useEffect` com deps
// `[isOpen]` — nunca `[filter]` (checklist do padrão do projeto).
// -----------------------------------------------------------------------------

import { useEffect } from 'react';

import { Text } from '@chakra-ui/react';
import { Controller, useForm } from 'react-hook-form';

import { Button } from '@/components/Button';
import { DateInput } from '@/components/DateInput';
import { FilterSide } from '@/components/FilterSide';
import { Form } from '@/components/Form';

import type { FilterModalProps } from '@/@types/filter-modal';
import type { BreedingBatchFilterRequest } from '@/@types/v2/BreedingBatch';

interface FilterFormValues {
  start_date: string | null;
  end_date: string | null;
}

const pristineFormValues: FilterFormValues = {
  start_date: null,
  end_date: null,
};

export function FilterSideLoteReproducao({
  isOpen,
  onClose,
  handleReset,
  handleFilterChange,
  filter,
  languageGB,
}: FilterModalProps<BreedingBatchFilterRequest>) {
  const text = languageGB.breedingBatches.breedingBatch.list.filter;

  function toInternalValues(rawFilter?: BreedingBatchFilterRequest | null): FilterFormValues {
    return {
      start_date: rawFilter?.start_date ?? null,
      end_date: rawFilter?.end_date ?? null,
    };
  }

  const { control, handleSubmit, reset } = useForm<FilterFormValues>({
    mode: 'onChange',
    reValidateMode: 'onChange',
    defaultValues: {
      ...pristineFormValues,
      ...toInternalValues(filter),
    },
  });

  // Ao (re)abrir o drawer, ressincroniza o form com o filtro REALMENTE
  // aplicado — deps SOMENTE `[isOpen]` (nunca `filter`).
  useEffect(() => {
    if (!isOpen) return;
    reset({ ...pristineFormValues, ...toInternalValues(filter) });
  }, [isOpen]);

  function onSubmit(data: FilterFormValues) {
    handleFilterChange({
      start_date: data.start_date || undefined,
      end_date: data.end_date || undefined,
    });
    onClose();
  }

  function handleResetFilters() {
    handleReset();
    reset(pristineFormValues);
  }

  function handleResetFiltersOnClose() {
    reset({ ...pristineFormValues, ...toInternalValues(filter) });
    onClose();
  }

  return (
    <FilterSide isOpen={isOpen} onClose={onClose} languageGB={languageGB}>
      <Form noPadding formFilter onSubmit={handleSubmit(onSubmit)}>
        <Form.BodyFilter>
          <Text fontWeight="bold" color="brandColorText">
            {text.title}
          </Text>

          <Controller
            name="start_date"
            control={control}
            render={({ field: { value, onChange } }) => (
              <DateInput value={value ?? null} onChange={onChange} placeholder={text.startDate} />
            )}
          />

          <Controller
            name="end_date"
            control={control}
            render={({ field: { value, onChange } }) => (
              <DateInput value={value ?? null} onChange={onChange} placeholder={text.endDate} />
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

export default FilterSideLoteReproducao;
