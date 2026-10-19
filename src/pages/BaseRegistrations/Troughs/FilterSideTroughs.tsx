// src/pages/BaseRegistrations/Troughs/FilterSideTroughs.tsx
// -----------------------------------------------------------------------------
// Drawer de FILTRO da listagem de Cochos (Trough) — SÓ busca textual
// (`search`, mirror `index()` legado: código/descrição/área/módulo, campo
// único — contrato de tela §2). Mirror estrutural de
// `FilterSideDiagnosisPregnancy.tsx`, sem o Select adicional (Trough não tem
// filtro de status na listagem).
// -----------------------------------------------------------------------------

import { useEffect } from 'react';

import { Text } from '@chakra-ui/react';
import { useForm } from 'react-hook-form';

import { Button } from '@/components/Button';
import { FilterSide } from '@/components/FilterSide';
import { Form } from '@/components/Form';
import { Input } from '@/components/Form/Input';

import type { FilterModalProps } from '@/@types/filter-modal';
import type { TroughsFilterForm } from '@/@types/v2/BaseRegistrations/troughs';

interface FilterSideTroughsProps extends FilterModalProps<TroughsFilterForm> {
  /** Contagem de filtros ativos — repassada ao badge do header do drawer. */
  filtersApplied?: number;
}

interface FilterFormValues {
  search?: string;
}

export function FilterSideTroughs({
  isOpen,
  onClose,
  handleReset,
  handleFilterChange,
  filter,
  languageGB,
  filtersApplied,
}: FilterSideTroughsProps) {
  const text = languageGB.baseRegistrations.trough.filter;

  const pristineFormValues: FilterFormValues = { search: '' };

  function toInternalValues(rawFilter?: TroughsFilterForm | null): FilterFormValues {
    return { search: rawFilter?.search ?? '' };
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

          <Input label={text.search} placeholder={text.searchPlaceholder} {...register('search')} />
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
