// src/pages/BaseRegistrations/Groupers/FilterSideGroupers.tsx
// -----------------------------------------------------------------------------
// Drawer de FILTRO da listagem de Agrupadores (mesma casca global <FilterSide>
// de FilterSideGruposProduto.tsx/FilterSideTiposTitulo.tsx).
//
// Contrato real (Grouper-contrato.md §6): search (Input, aciona o MODO BUSCA
// achatada) + type (Select — Custo/Receita/Depreciação/Financeiro) + condition
// (Select — Categoria/Cálculo) + is_enabled (Select — Ativo/Inativo).
// SEM filtro de nível/profundidade (não faz sentido no modo árvore — Tarefa
// TASK-FE-030, seção "Componentes").
//
// `type`/`condition` são os enums NUMÉRICOS reais do backend (GrouperType
// 1-4, GrouperCondition 1-2 — ver @/@types/v2/Groupers) — `Option<number>`,
// não string (diferente de TiposTitulo, que serializa como string).
//
// Contrato B (FilterModalProps<GrouperFilterForm>) — mirror
// FilterSideDiagnosisPregnancy.tsx: pristineFormValues/toInternalValues, par
// handleResetFilters (limpar+reset pristine) / handleResetFiltersOnClose
// (cancelar+reset filter atual), useEffect(reset(...), [isOpen]).
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
import type { GrouperCondition, GrouperFilterForm, GrouperType } from '@/@types/v2/Groupers';

// Forma INTERNA do form (só deste componente) — os Selects trabalham com
// `Option`, o submit converte para `GrouperFilterForm` (enums numéricos crus).
interface FilterFormValues {
  search?: string;
  is_enabled: Option<string> | null;
  type: Option<GrouperType> | null;
  condition: Option<GrouperCondition> | null;
}

export function FilterSideGroupers({
  isOpen,
  onClose,
  handleReset,
  handleFilterChange,
  filter,
  languageGB,
}: FilterModalProps<GrouperFilterForm>) {
  const filterText = languageGB.groupers.grouper.filter;

  const enabledOptions: Option<string>[] = [
    { value: 'true', label: filterText.enabledOptions.active },
    { value: 'false', label: filterText.enabledOptions.inactive },
  ];

  const typeOptions: Option<GrouperType>[] = [
    { value: 1, label: filterText.typeOptions.cost },
    { value: 2, label: filterText.typeOptions.revenue },
    { value: 3, label: filterText.typeOptions.depreciation },
    { value: 4, label: filterText.typeOptions.financial },
  ];

  const conditionOptions: Option<GrouperCondition>[] = [
    { value: 1, label: filterText.conditionOptions.category },
    { value: 2, label: filterText.conditionOptions.calculation },
  ];

  const pristineFormValues: FilterFormValues = {
    search: '',
    is_enabled: null,
    type: null,
    condition: null,
  };

  function toInternalValues(rawFilter?: GrouperFilterForm | null): FilterFormValues {
    return {
      search: rawFilter?.search ?? '',
      is_enabled: enabledOptions.find((option) => option.value === rawFilter?.is_enabled) ?? null,
      type: typeOptions.find((option) => option.value === rawFilter?.type) ?? null,
      condition: conditionOptions.find((option) => option.value === rawFilter?.condition) ?? null,
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
      is_enabled: (data.is_enabled?.value as GrouperFilterForm['is_enabled']) || undefined,
      type: data.type?.value || undefined,
      condition: data.condition?.value || undefined,
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
            name="condition"
            control={control}
            render={({ field: { name, value, onChange } }) => (
              <Select
                label={filterText.condition}
                placeholder={filterText.conditionAll}
                name={name}
                value={value}
                onChange={onChange}
                options={conditionOptions}
              />
            )}
          />

          <Controller
            name="is_enabled"
            control={control}
            render={({ field: { name, value, onChange } }) => (
              <Select
                label={filterText.isEnabled}
                placeholder={filterText.isEnabledAll}
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
