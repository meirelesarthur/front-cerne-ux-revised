// src/pages/CadastrosBase/CentroCusto/FilterSideCentroCusto.tsx
// -----------------------------------------------------------------------------
// Drawer de FILTRO da listagem de Centros de Custo (mesma casca global
// <FilterSide> de Perfil/FilterSidePerfil.tsx, com 2 Selects a mais — padrão
// de _examples/pages/cadastros/recursos/FilterSideRecursos.tsx para o widget
// Select controlado por Controller).
//
// Contrato real (TASK-FE-002): search (Input) + type (Select — Produtivo/
// Rateado, 2 opções reais) + is_enabled (Select — Todos/Ativo/Inativo). O
// filtro "Classe" do mock de UX foi conscientemente omitido (client-side
// sobre 1 página só enganaria o usuário — sem endpoint real de agregado).
//
// O componente @/components/Form/Select trabalha com `Option` (label/value),
// não com a string crua que o backend espera — por isso o form RHF usa
// `Option | null` internamente e o `submit` converte para o shape cru de
// `CostCenterFilterForm` antes de chamar `handleFilterChange`.
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
import type { CostCenterFilterForm } from '@/@types/v2/CostCenters';

interface FilterSideCentroCustoProps extends FilterModalProps<CostCenterFilterForm> {
  /** Contagem de filtros ativos — repassada ao badge do header do drawer (aditivo/opcional). */
  filtersApplied?: number;
}

// Forma INTERNA do form (só deste componente) — os Selects trabalham com
// `Option`, o submit converte para `CostCenterFilterForm` (strings cruas).
interface FilterFormValues {
  search?: string;
  type: Option<string> | null;
  is_enabled: Option<string> | null;
}

export function FilterSideCentroCusto({
  isOpen,
  onClose,
  handleReset,
  handleFilterChange,
  filter,
  languageGB,
  filtersApplied,
}: FilterSideCentroCustoProps) {
  const text = languageGB.costCenters.costCenter.filter;

  const typeOptions: Option<string>[] = [
    { value: 'productive', label: text.typeOptions.productive },
    { value: 'apportioned', label: text.typeOptions.apportioned },
  ];

  const enabledOptions: Option<string>[] = [
    { value: 'true', label: text.enabledOptions.active },
    { value: 'false', label: text.enabledOptions.inactive },
  ];

  const pristineFormValues: FilterFormValues = {
    search: '',
    type: null,
    is_enabled: null,
  };

  function toInternalValues(rawFilter?: CostCenterFilterForm | null): FilterFormValues {
    return {
      search: rawFilter?.search ?? '',
      type: typeOptions.find((option) => option.value === rawFilter?.type) ?? null,
      is_enabled: enabledOptions.find((option) => option.value === rawFilter?.is_enabled) ?? null,
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
      type: (data.type?.value as CostCenterFilterForm['type']) || undefined,
      is_enabled: (data.is_enabled?.value as CostCenterFilterForm['is_enabled']) || undefined,
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

          <Input
            label={text.search}
            placeholder={text.searchPlaceholder}
            {...register('search')}
          />

          <Controller
            name="type"
            control={control}
            render={({ field: { name, value, onChange } }) => (
              <Select
                label={text.type}
                placeholder={text.typeAll}
                name={name}
                value={value}
                onChange={onChange}
                options={typeOptions}
              />
            )}
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
