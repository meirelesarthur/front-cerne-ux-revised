// src/pages/BaseRegistrations/Apportionments/FilterSideApportionment.tsx
// Drawer de FILTRO da listagem de Rateio - Categoria Financeira
// (Apportionment, TASK-AP-FE-07). Único filtro do contrato (`##
// 3`/`ApportionmentFilterRequest`): `search` (texto livre por Categoria
// Financeira). Mantém a regra de severidade "Filtro SEMPRE com `<Form
// formFilter>`" mesmo com 1 campo só (Contrato B completo, mirror
// `FilterSideDiagnosisPregnancy.tsx`).

import { useEffect } from 'react';

import { Text } from '@chakra-ui/react';
import { useForm } from 'react-hook-form';

import { Button } from '@/components/Button';
import { FilterSide } from '@/components/FilterSide';
import { Form } from '@/components/Form';
import { Input } from '@/components/Form/Input';

import type { FilterModalProps } from '@/@types/filter-modal';
import type { ApportionmentFilterForm } from '@/@types/v2/BaseRegistrations/apportionment';

interface FilterFormValues {
  search?: string;
}

export function FilterSideApportionment({
  isOpen,
  onClose,
  handleReset,
  handleFilterChange,
  filter,
  languageGB,
}: FilterModalProps<ApportionmentFilterForm>) {
  const pristineFormValues: FilterFormValues = {
    search: '',
  };

  function toInternalValues(rawFilter?: ApportionmentFilterForm | null): FilterFormValues {
    return {
      search: rawFilter?.search ?? '',
    };
  }

  const { register, handleSubmit, reset } = useForm<FilterFormValues>({
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
            {languageGB.baseRegistrations.apportionment.filter.title}
          </Text>

          <Input
            label={languageGB.baseRegistrations.apportionment.filter.search}
            placeholder={languageGB.baseRegistrations.apportionment.filter.searchPlaceholder}
            {...register('search')}
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
