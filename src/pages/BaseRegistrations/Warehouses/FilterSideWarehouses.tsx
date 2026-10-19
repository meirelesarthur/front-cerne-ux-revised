// src/pages/BaseRegistrations/Warehouses/FilterSideWarehouses.tsx
// -----------------------------------------------------------------------------
// Drawer de FILTRO da listagem de Armazéns — Contrato B canônico de filtro
// (mirror de BaseRegistrations/DiagnosisPregnancy/FilterSideDiagnosisPregnancy.tsx).
//
// Contrato real (Warehouse-contrato-frontend.md §5.1/§6.1): search (Input) +
// type (Select — Insumos/Produção/Formulação, 3 opções fixas locais, mesmos
// slugs que a API aceita) + is_active (Select — Todos/Ativo/Inativo). Os 3
// vão como query params reais de `WarehouseFilterForm` — nunca filtro
// client-side.
//
// O componente @/components/Form/Select trabalha com `Option` (label/value),
// não com a string crua que o backend espera — por isso o form RHF usa
// `Option | null` internamente e o `onSubmit` converte para o shape cru de
// `WarehouseFilterForm` antes de chamar `handleFilterChange`.
// -----------------------------------------------------------------------------

import { useEffect } from 'react';

import { Text } from '@chakra-ui/react';
import { Controller, useForm } from 'react-hook-form';

import { Button } from '@/components/Button';
import { FilterSide } from '@/components/FilterSide';
import { Form } from '@/components/Form';
import { Input } from '@/components/Form/Input';
import { Select } from '@/components/Form/Select';

import type { FilterModalProps } from '@/@types/filter-modal';
import type { Option } from '@/@types/option';
import type { WarehouseFilterForm } from '@/@types/v2/Warehouses';

// Forma INTERNA do form (só deste componente) — o Select trabalha com
// `Option`, o submit converte para `WarehouseFilterForm` (strings cruas).
interface FilterFormValues {
  search?: string;
  type: Option<string> | null;
  is_active: Option<string> | null;
}

export function FilterSideWarehouses({
  isOpen,
  onClose,
  handleReset,
  handleFilterChange,
  filter,
  languageGB,
}: FilterModalProps<WarehouseFilterForm>) {
  const filterText = languageGB.warehouses.warehouse.filter;

  const typeOptions: Option<string>[] = [
    { value: 'insumos', label: filterText.typeOptions.insumos },
    { value: 'producao', label: filterText.typeOptions.producao },
    { value: 'formulacao', label: filterText.typeOptions.formulacao },
  ];

  const activeOptions: Option<string>[] = [
    { value: 'true', label: filterText.activeOptions.active },
    { value: 'false', label: filterText.activeOptions.inactive },
  ];

  const pristineFormValues: FilterFormValues = {
    search: '',
    type: null,
    is_active: null,
  };

  function toInternalValues(rawFilter?: WarehouseFilterForm | null): FilterFormValues {
    return {
      search: rawFilter?.search ?? '',
      type: typeOptions.find((option) => option.value === rawFilter?.type) ?? null,
      is_active: activeOptions.find((option) => option.value === rawFilter?.is_active) ?? null,
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
    handleFilterChange({
      search: data.search?.trim() || undefined,
      type: (data.type?.value as WarehouseFilterForm['type']) || undefined,
      is_active: (data.is_active?.value as WarehouseFilterForm['is_active']) || undefined,
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
            {filterText.title}
          </Text>

          <Input
            label={filterText.search}
            placeholder={filterText.searchPlaceholder}
            {...register('search')}
          />

          <Controller
            name="type"
            control={control}
            render={({ field: { name, value, onChange } }) => (
              <Select
                label={filterText.type}
                placeholder={filterText.typeAll}
                name={name}
                value={value}
                onChange={onChange}
                options={typeOptions}
              />
            )}
          />

          <Controller
            name="is_active"
            control={control}
            render={({ field: { name, value, onChange } }) => (
              <Select
                label={filterText.isActive}
                placeholder={filterText.isActiveAll}
                name={name}
                value={value}
                onChange={onChange}
                options={activeOptions}
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
