// src/pages/Operacional/Rainfalls/FilterSideRainfall.tsx
// -----------------------------------------------------------------------------
// Drawer de FILTRO da listagem de Pluviometria — Contrato B canônico
// (`FilterModalProps<RainfallFilterForm>`, seis props exatas), mirror
// `DeathAnimals/FilterSideDeathAnimals.tsx`/`FeedlotYards/FilterSideFeedlotYards.tsx`.
//
// 2 campos reais (contrato §4.1, mirror `FILTER-001/002` do legado):
// `start_date`/`end_date` (`DateInput`, ISO `Y-m-d`), aplicados como
// `start_date`(>=)/`end_date`(<=) na query. Re-hidratação por `[isOpen]` (não
// `[filter]`). `<Form formFilter>` sempre.
// -----------------------------------------------------------------------------

import { useEffect } from 'react';

import { Text } from '@chakra-ui/react';
import { Controller, useForm } from 'react-hook-form';

import { Button } from '@/components/Button';
import { DateInput } from '@/components/DateInput';
import { FilterSide } from '@/components/FilterSide';
import { Form } from '@/components/Form';
import { Field } from '@/components/Form/Field';

import type { FilterModalProps } from '@/@types/filter-modal';
import type { RainfallFilterForm } from '@/@types/v2/Rainfalls';

interface FilterFormValues {
  start_date: string | null;
  end_date: string | null;
}

const pristineFormValues: FilterFormValues = {
  start_date: null,
  end_date: null,
};

interface FilterSideRainfallProps extends FilterModalProps<RainfallFilterForm> {
  /** Contagem de filtros ativos — repassada ao badge do header do drawer (aditivo/opcional). */
  filtersApplied?: number;
}

export function FilterSideRainfall({
  isOpen,
  onClose,
  handleReset,
  handleFilterChange,
  filter,
  languageGB,
  filtersApplied,
}: FilterSideRainfallProps) {
  const filterText = languageGB.rainfalls.rainfall.filter;

  function toInternalValues(rawFilter?: RainfallFilterForm | null): FilterFormValues {
    return {
      start_date: rawFilter?.start_date ?? null,
      end_date: rawFilter?.end_date ?? null,
    };
  }

  const { control, handleSubmit, reset } = useForm<FilterFormValues>({
    defaultValues: {
      ...pristineFormValues,
      ...toInternalValues(filter),
    },
  });

  // Re-hidratação obrigatória — dep SOMENTE [isOpen] (Contrato B canônico).
  useEffect(() => {
    if (!isOpen) return;
    reset({
      ...pristineFormValues,
      ...toInternalValues(filter),
    });
  }, [isOpen]);

  function onSubmit(data: FilterFormValues) {
    handleFilterChange({
      start_date: data.start_date || undefined,
      end_date: data.end_date || undefined,
    } as RainfallFilterForm);
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

  return (
    <FilterSide
      isOpen={isOpen}
      onClose={onClose}
      languageGB={languageGB}
      filtersApplied={filtersApplied}
    >
      <Form noPadding formFilter onSubmit={handleSubmit(onSubmit)}>
        <Form.BodyFilter>
          <Text fontWeight="bold" color="brandColorText">
            {filterText.title}
          </Text>

          <Controller
            name="start_date"
            control={control}
            render={({ field: { value, onChange } }) => (
              <Field label={filterText.startDate}>
                <DateInput value={value ?? null} onChange={onChange} />
              </Field>
            )}
          />

          <Controller
            name="end_date"
            control={control}
            render={({ field: { value, onChange } }) => (
              <Field label={filterText.endDate}>
                <DateInput value={value ?? null} onChange={onChange} />
              </Field>
            )}
          />
        </Form.BodyFilter>
        <Form.FooterFilter>
          <Button
            title={languageGB.defaltStrings.clearAllFilters}
            variant="outline"
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
