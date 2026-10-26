// src/pages/BaseRegistrations/Parameters/FilterSideParameters.tsx
// -----------------------------------------------------------------------------
// Drawer de FILTRO da listagem de Parâmetros — execução 031, TASK-FE-031-41.
// Mesma casca global <FilterSide> de `CentroCusto/FilterSideCentroCusto.tsx`,
// simplificada para o único filtro real do contrato (`name`, contrato §5) —
// sem Selects (Parâmetros não tem `type`/`is_enabled` filtráveis).
// -----------------------------------------------------------------------------

import { useEffect } from 'react';

import { Text } from '@chakra-ui/react';
import { useForm } from 'react-hook-form';

import { Button } from '@/components/Button';
import { FilterSide } from '@/components/FilterSide';
import { Form } from '@/components/Form';
import { Input } from '@/components/Form/Input';

import type { FilterModalProps } from '@/@types/filter-modal';
import type { ParameterFilterForm } from '@/@types/v2/BaseRegistrations/Parameters';

interface FilterSideParametersProps extends FilterModalProps<ParameterFilterForm> {
  /** Contagem de filtros ativos — repassada ao badge do header do drawer (aditivo/opcional). */
  filtersApplied?: number;
}

interface FilterFormValues {
  name?: string;
}

export function FilterSideParameters({
  isOpen,
  onClose,
  handleReset,
  handleFilterChange,
  filter,
  languageGB,
  filtersApplied,
}: FilterSideParametersProps) {
  const text = languageGB.parameters.parameter.filter;

  const pristineFormValues: FilterFormValues = { name: '' };

  function toInternalValues(rawFilter?: ParameterFilterForm | null): FilterFormValues {
    return { name: rawFilter?.name ?? '' };
  }

  const { register, handleSubmit, reset } = useForm<FilterFormValues>({
    defaultValues: {
      ...pristineFormValues,
      ...toInternalValues(filter),
    },
  });

  function onSubmit(data: FilterFormValues) {
    handleFilterChange({
      name: data.name?.trim() || undefined,
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

          <Input label={text.search} placeholder={text.searchPlaceholder} {...register('name')} />
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
