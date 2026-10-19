// src/pages/Administrativo/AtividadesRecentes/FilterSideAtividadesRecentes.tsx
// -----------------------------------------------------------------------------
// Drawer de FILTRO de Atividades Recentes (UT-000690 / F-349) — Contrato B
// (`FilterModalProps<T>`, seis props exatas), mirror de `FilterSideFaltas`.
// Campos: `types` (Select múltiplo, options de `/types`), `start_date` e
// `end_date` (`DateInput`). Re-hidratação por `toInternalValues(filter)` num
// ÚNICO `useEffect` com deps `[isOpen]`. "Limpar" NÃO fecha; "Cancelar" restaura
// e fecha. A validação (end >= start) vem do schema derivado da tradução.
// -----------------------------------------------------------------------------

import { useEffect } from 'react';

import { Text } from '@chakra-ui/react';
import { Controller, useForm } from 'react-hook-form';

import { Button } from '@/components/Button';
import { DateInput } from '@/components/DateInput';
import { FilterSide } from '@/components/FilterSide';
import { Form } from '@/components/Form';
import { Field } from '@/components/Form/Field';
import { Select } from '@/components/Form/Select';

import { recentActivitiesFilterSchemaResolver } from '@/validations/schemas/RecentActivities/recent-activities-filter-schema';

import type { FilterModalProps } from '@/@types/filter-modal';
import type { RecentActivityFilterForm } from '@/@types/v2/RecentActivities';

import { useRecentActivityTypeOptions } from './useRecentActivities';

interface FilterFormValues {
  types: string[];
  start_date: string | null;
  end_date: string | null;
}

const pristineFormValues: FilterFormValues = {
  types: [],
  start_date: null,
  end_date: null,
};

function toInternalValues(rawFilter?: RecentActivityFilterForm | null): FilterFormValues {
  return {
    types: rawFilter?.types ?? [],
    start_date: rawFilter?.start_date ?? null,
    end_date: rawFilter?.end_date ?? null,
  };
}

export function FilterSideAtividadesRecentes({
  isOpen,
  onClose,
  handleReset,
  handleFilterChange,
  filter,
  languageGB,
}: FilterModalProps<RecentActivityFilterForm>) {
  const text = languageGB.recentActivities.recentActivity.list.filter;
  const typeOptionsQuery = useRecentActivityTypeOptions(languageGB);

  const {
    control,
    handleSubmit,
    reset,
    trigger,
    getValues,
    formState: { errors },
  } = useForm<FilterFormValues>({
    mode: 'onChange',
    reValidateMode: 'onChange',
    resolver: recentActivitiesFilterSchemaResolver(languageGB) as any,
    defaultValues: {
      ...pristineFormValues,
      ...toInternalValues(filter),
    },
  });

  // Ao (re)abrir o drawer, ressincroniza o form com o filtro REALMENTE aplicado.
  useEffect(() => {
    reset({
      ...pristineFormValues,
      ...toInternalValues(filter),
    });
  }, [isOpen]);

  function onSubmit(data: FilterFormValues) {
    handleFilterChange({
      types: data.types.length > 0 ? data.types : undefined,
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
    reset({
      ...pristineFormValues,
      ...toInternalValues(filter),
    });
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
            name="types"
            control={control}
            render={({ field }) => (
              <Select
                name={field.name}
                label={text.types}
                multiple
                disablePortal
                options={typeOptionsQuery.options}
                loading={typeOptionsQuery.isLoading}
                value={typeOptionsQuery.options.filter((option) =>
                  field.value.includes(option.value)
                )}
                onChange={(selected: Array<{ value: string }> | null) =>
                  field.onChange((selected ?? []).map((option) => option.value))
                }
              />
            )}
          />

          <Controller
            name="start_date"
            control={control}
            render={({ field: { value, onChange } }) => (
              <Field label={text.startDate}>
                <DateInput
                  value={value ?? null}
                  onChange={(next: string | null) => {
                    onChange(next);
                    if (getValues('end_date')) void trigger('end_date');
                  }}
                />
              </Field>
            )}
          />

          <Controller
            name="end_date"
            control={control}
            render={({ field: { value, onChange } }) => (
              <Field label={text.endDate} errorText={errors.end_date?.message}>
                <DateInput value={value ?? null} onChange={onChange} />
              </Field>
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
