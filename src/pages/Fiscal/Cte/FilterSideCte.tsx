// src/pages/Fiscal/Cte/FilterSideCte.tsx
// -----------------------------------------------------------------------------
// Drawer de filtro da listagem de CT-e (TASK-CTE-FE-02). Contrato B canônico
// (`FilterModalProps<CteFilterForm>`, seis props exatas), mirror estrutural
// `Fiscal/Dfe/FilterSideDfe.tsx`. Campos (FL01-FL03): `estado` (Select
// estático), `start_date`/`end_date` (`DateInput`).
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

import { cteEstadoOptions } from '@/constants/Fiscal/cte/options/cte-estado-options';

import type { FilterModalProps } from '@/@types/filter-modal';
import type { Option } from '@/@types/option';
import type { CteEstado, CteFilterForm } from '@/@types/v2/Fiscal/cte';

interface FilterFormValues {
  estado: Option<CteEstado> | null;
  start_date: string | null;
  end_date: string | null;
}

const pristineFormValues: FilterFormValues = {
  estado: null,
  start_date: null,
  end_date: null,
};

export function FilterSideCte({
  isOpen,
  onClose,
  handleReset,
  handleFilterChange,
  filter,
  languageGB,
}: FilterModalProps<CteFilterForm>) {
  const text = languageGB.ctes.cte.filter;
  const estadoOptionsList = cteEstadoOptions.options(languageGB);

  function toInternalValues(rawFilter?: CteFilterForm | null): FilterFormValues {
    return {
      estado: estadoOptionsList.find((option) => option.value === rawFilter?.estado) ?? null,
      start_date: rawFilter?.start_date ?? null,
      end_date: rawFilter?.end_date ?? null,
    };
  }

  const { control, handleSubmit, reset, watch } = useForm<FilterFormValues>({
    mode: 'onChange',
    reValidateMode: 'onChange',
    defaultValues: { ...pristineFormValues, ...toInternalValues(filter) },
  });

  const dateFrom = watch('start_date');
  const dateTo = watch('end_date');
  const isDateRangeInvalid = !!dateFrom && !!dateTo && dateTo < dateFrom;

  function onSubmit(data: FilterFormValues) {
    handleFilterChange({
      estado: data.estado?.value ?? undefined,
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

  // Re-hidratação — deps SOMENTE `[isOpen]` (nunca `[filter]`).
  useEffect(() => {
    reset({ ...pristineFormValues, ...toInternalValues(filter) });
  }, [isOpen]);

  return (
    <FilterSide isOpen={isOpen} onClose={onClose} languageGB={languageGB}>
      <Form noPadding formFilter onSubmit={handleSubmit(onSubmit)}>
        <Form.BodyFilter>
          <Text fontWeight="bold" color="brandColorText">
            {text.title}
          </Text>

          <Controller
            name="estado"
            control={control}
            render={({ field: { name, value, onChange } }) => (
              <Select
                label={text.estado}
                placeholder={text.estadoAll}
                name={name}
                value={value}
                onChange={onChange}
                options={estadoOptionsList}
              />
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

          {isDateRangeInvalid && (
            <Text fontSize="xs" color="fg.error">
              {text.dateRangeInvalid}
            </Text>
          )}
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

export default FilterSideCte;
