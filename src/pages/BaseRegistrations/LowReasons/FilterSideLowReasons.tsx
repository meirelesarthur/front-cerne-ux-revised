// src/pages/BaseRegistrations/LowReasons/FilterSideLowReasons.tsx
// -----------------------------------------------------------------------------
// Drawer de FILTRO da listagem de Motivos de Baixa (mesma casca global
// <FilterSide> de FilterSideDiagnosisPregnancy.tsx).
//
// Contrato real: search (Input, busca por `description`) + is_enabled (Select —
// Todos/Ativo/Inativo) + do_movement (Select — Todos/Sim/Não).
//
// RE-HIDRATAÇÃO: prop `filter` + `useEffect` com deps `[isOpen]` apenas — ao
// abrir (`isOpen === true`), reconstrói os campos do form a partir de `filter`
// (`search` direto; `is_enabled`/`do_movement` convertidos de volta para
// `Option<string> | null` via `find` nas opções estáticas).
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
import type { LowReasonFilterForm } from '@/@types/v2/BaseRegistrations/lowReasons';

// Forma INTERNA do form (só deste componente) — os Selects trabalham com
// `Option`, o submit converte para `LowReasonFilterForm` (strings cruas).
interface FilterFormValues {
  search?: string;
  is_enabled: Option<string> | null;
  do_movement: Option<string> | null;
}

export function FilterSideLowReasons({
  isOpen,
  onClose,
  handleReset,
  handleFilterChange,
  filter,
  languageGB,
}: FilterModalProps<LowReasonFilterForm>) {
  const text = languageGB.baseRegistrations.lowReason.filter;

  const enabledOptions: Option<string>[] = [
    { value: 'true', label: text.enabledOptions.active },
    { value: 'false', label: text.enabledOptions.inactive },
  ];

  const movementOptions: Option<string>[] = [
    { value: 'true', label: text.movementOptions.yes },
    { value: 'false', label: text.movementOptions.no },
  ];

  const pristineFormValues: FilterFormValues = {
    search: '',
    is_enabled: null,
    do_movement: null,
  };

  function toInternalValues(rawFilter?: LowReasonFilterForm | null): FilterFormValues {
    return {
      search: rawFilter?.search ?? '',
      is_enabled: enabledOptions.find((o) => o.value === rawFilter?.is_enabled) ?? null,
      do_movement: movementOptions.find((o) => o.value === rawFilter?.do_movement) ?? null,
    };
  }

  const { control, register, handleSubmit, reset } = useForm<FilterFormValues>({
    defaultValues: {
      ...pristineFormValues,
      ...toInternalValues(filter),
    },
  });

  function onSubmit(data: FilterFormValues) {
    handleFilterChange({
      search: data.search?.trim() || undefined,
      is_enabled: (data.is_enabled?.value as LowReasonFilterForm['is_enabled']) || undefined,
      do_movement: (data.do_movement?.value as LowReasonFilterForm['do_movement']) || undefined,
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
            {text.title}
          </Text>

          <Input
            label={text.search}
            placeholder={text.searchPlaceholder}
            {...register('search')}
          />

          <Controller
            name="is_enabled"
            control={control}
            render={({ field: { name, value, onChange } }) => (
              <Select
                label={text.isEnabled}
                placeholder={text.isEnabledAll}
                name={name}
                value={value}
                onChange={onChange}
                options={enabledOptions}
              />
            )}
          />

          <Controller
            name="do_movement"
            control={control}
            render={({ field: { name, value, onChange } }) => (
              <Select
                label={text.doMovement}
                placeholder={text.doMovementAll}
                name={name}
                value={value}
                onChange={onChange}
                options={movementOptions}
              />
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
