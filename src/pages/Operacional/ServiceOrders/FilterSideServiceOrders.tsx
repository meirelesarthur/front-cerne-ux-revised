// src/pages/Operacional/ServiceOrders/FilterSideServiceOrders.tsx
// -----------------------------------------------------------------------------
// Drawer de FILTRO da listagem de Ordens de Serviço (ServiceOrder) —
// TASK-FE-2002. Contrato B completo (`FilterModalProps<T>`, 6 props exatas),
// re-hidratação em `[isOpen]` — mirror
// `Appropriations/FilterSideAppropriations.tsx`/`FilterSideInventario.tsx`.
//
// 3 filtros do contrato de tela (§2.3 do plano): Código (`Input`, LIKE) +
// Dt. início/Dt. fim (`DateInput`, aplicados a `dt_emission`). SEM Status —
// o `ServiceOrderFilterData` do backend não expõe esse parâmetro (diferente
// de Appropriations); não inventar filtro que o backend não aceita.
// -----------------------------------------------------------------------------

import { useEffect } from 'react';

import { Input, Text } from '@chakra-ui/react';
import { Controller, useForm } from 'react-hook-form';

import { Button } from '@/components/Button';
import { DateInput } from '@/components/DateInput';
import { FilterSide } from '@/components/FilterSide';
import { Form } from '@/components/Form';
import { Field } from '@/components/Form/Field';

import type { FilterModalProps } from '@/@types/filter-modal';
import type { ServiceOrderFilterForm } from '@/@types/v2/ServiceOrders';

interface FilterFormValues {
  code: string | null;
  start_date: string | null;
  end_date: string | null;
}

const pristineFormValues: FilterFormValues = {
  code: null,
  start_date: null,
  end_date: null,
};

interface FilterSideServiceOrdersProps extends FilterModalProps<ServiceOrderFilterForm> {
  filtersApplied?: number;
}

export function FilterSideServiceOrders({
  isOpen,
  onClose,
  handleReset,
  handleFilterChange,
  filter,
  languageGB,
  filtersApplied,
}: FilterSideServiceOrdersProps) {
  const text = languageGB.serviceOrders.serviceOrder.list.filter;

  const { control, handleSubmit, reset } = useForm<FilterFormValues>({
    defaultValues: pristineFormValues,
  });

  // Re-hidratação ao (re)abrir o drawer — deps SOMENTE [isOpen] (Contrato B,
  // mirror `FilterSideAppropriations.tsx`).
  useEffect(() => {
    if (!isOpen) return;
    reset({
      code: filter?.code ?? null,
      start_date: filter?.start_date ?? null,
      end_date: filter?.end_date ?? null,
    });
  }, [isOpen]);

  function onSubmit(data: FilterFormValues) {
    const applied: ServiceOrderFilterForm = {
      code: data.code || undefined,
      start_date: data.start_date || undefined,
      end_date: data.end_date || undefined,
    };
    handleFilterChange(applied);
    onClose();
  }

  function handleResetFilters() {
    handleReset();
    reset(pristineFormValues);
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
            {text.title}
          </Text>

          <Controller
            name="code"
            control={control}
            render={({ field }) => (
              <Field label={text.code}>
                <Input
                  value={field.value ?? ''}
                  onChange={(event) => field.onChange(event.target.value)}
                  placeholder={text.codePlaceholder}
                />
              </Field>
            )}
          />

          <Controller
            name="start_date"
            control={control}
            render={({ field: { value, onChange } }) => (
              <Field label={text.startDate}>
                <DateInput value={value ?? null} onChange={onChange} />
              </Field>
            )}
          />

          <Controller
            name="end_date"
            control={control}
            render={({ field: { value, onChange } }) => (
              <Field label={text.endDate}>
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
            height="4"
            onClick={handleResetFilters}
            type="button"
          />
          <Button
            title={languageGB.defaltStrings.cancel}
            variant="secondary"
            onClick={onClose}
            type="button"
          />
          <Button title={languageGB.defaltStrings.applyFilters} type="submit" />
        </Form.FooterFilter>
      </Form>
    </FilterSide>
  );
}
