// src/pages/Planos/FilterSidePlanos.tsx
// -----------------------------------------------------------------------------
// Drawer de FILTRO da listagem de Planos (PlanRole, TASK-FE-2701) — mesma
// casca global <FilterSide> de `CadastrosBase/CentroCusto/
// FilterSideCentroCusto.tsx`. Contrato B canônico: seis props exatas de
// `FilterModalProps<T>`, re-hidratação em `[isOpen]`.
//
// 2 filtros reais (`TASK-FE-2700` §Contrato de API): `search` (Input texto,
// ILIKE no nome) + `is_free` (Select — Todos/Gratuito/Pago). O Select
// trabalha com `Option<string>` internamente ('true'/'false'); o submit
// converte para o `boolean` cru que `PlanRoleFilterForm.is_free` espera.
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
import type { PlanRoleFilterForm } from '@/@types/v2/Planos';

interface FilterSidePlanosProps extends FilterModalProps<PlanRoleFilterForm> {
  /** Contagem de filtros ativos — repassada ao badge do header do drawer. */
  filtersApplied?: number;
}

// Forma INTERNA do form (só deste componente) — o Select trabalha com
// `Option`, o submit converte para `PlanRoleFilterForm` (boolean cru).
interface FilterFormValues {
  search?: string;
  is_free: Option<string> | null;
}

export function FilterSidePlanos({
  isOpen,
  onClose,
  handleReset,
  handleFilterChange,
  filter,
  languageGB,
  filtersApplied,
}: FilterSidePlanosProps) {
  const text = languageGB.planos.planRole.list.filter;

  const isFreeOptions: Option<string>[] = [
    { value: 'true', label: text.isFreeOptions.free },
    { value: 'false', label: text.isFreeOptions.paid },
  ];

  const pristineFormValues: FilterFormValues = {
    search: '',
    is_free: null,
  };

  function toInternalValues(rawFilter?: PlanRoleFilterForm | null): FilterFormValues {
    return {
      search: rawFilter?.search ?? '',
      is_free:
        rawFilter?.is_free === undefined
          ? null
          : (isFreeOptions.find((option) => option.value === String(rawFilter.is_free)) ?? null),
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
      is_free: data.is_free?.value === undefined ? undefined : data.is_free.value === 'true',
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

          <Controller
            name="is_free"
            control={control}
            render={({ field: { name, value, onChange } }) => (
              <Select
                label={text.isFree}
                placeholder={text.isFreeAll}
                name={name}
                value={value}
                onChange={onChange}
                options={isFreeOptions}
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
