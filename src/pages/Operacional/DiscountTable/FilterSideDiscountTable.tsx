// src/pages/Operacional/DiscountTable/FilterSideDiscountTable.tsx
// -----------------------------------------------------------------------------
// Drawer de FILTRO da listagem de Descontos/Classificação (DiscountTable —
// Operacional/Agricultura, F-032, TASK-DT-FE-02). Contrato B canônico de
// filtro (mirror `FilterSideFeedingPhase.tsx`/`FilterSideDiet.tsx`) — `<Form
// formFilter>` (`Form.BodyFilter`/`Form.FooterFilter`), seis props exatas,
// re-hidratação em `[isOpen]`.
//
// Campo único (contrato de tela §4.4, AM-06): `search` (ILIKE code/name,
// `DiscountTableFilterData::$search`).
// -----------------------------------------------------------------------------

import { useEffect } from 'react';

import { Text } from '@chakra-ui/react';
import { useForm } from 'react-hook-form';

import { Button } from '@/components/Button';
import { FilterSide } from '@/components/FilterSide';
import { Form } from '@/components/Form';
import { Input } from '@/components/Form/Input';

import type { FilterModalProps } from '@/@types/filter-modal';
import type { DiscountTableFilterForm } from '@/@types/v2/DiscountTables';

export function FilterSideDiscountTable({
  isOpen,
  onClose,
  handleReset,
  handleFilterChange,
  filter,
  languageGB,
}: FilterModalProps<DiscountTableFilterForm>) {
  const filterText = languageGB.discountTables.discountTable.filter;

  const pristineFormValues: DiscountTableFilterForm = { search: '' };

  function toInternalValues(rawFilter?: DiscountTableFilterForm | null): DiscountTableFilterForm {
    return { search: rawFilter?.search ?? '' };
  }

  const { register, handleSubmit, reset } = useForm<DiscountTableFilterForm>({
    mode: 'onChange',
    reValidateMode: 'onChange',
    defaultValues: {
      ...pristineFormValues,
      ...toInternalValues(filter),
    },
  });

  function onSubmit(data: DiscountTableFilterForm) {
    handleFilterChange({ search: data.search?.trim() || undefined });
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
