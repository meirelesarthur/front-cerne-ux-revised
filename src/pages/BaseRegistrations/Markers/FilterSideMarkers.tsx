// src/pages/BaseRegistrations/Markers/FilterSideMarkers.tsx
// -----------------------------------------------------------------------------
// Drawer de FILTRO da listagem de Marcadores (mesma casca global <FilterSide>
// de FilterSideFamiliaBens.tsx/FilterSideCentroCusto.tsx — inspecionado
// `@/components/FilterSide` (Inspeção Obrigatória da ficha): a casca interna
// é um `Drawer` genérico (`Drawer.Body` recebe `children`); o form real é
// montado pelo CALLER via `<Form formFilter>` + `Form.BodyFilter` (campos) +
// `Form.FooterFilter` (botões), padrão canônico de TODOS os filtros reais do
// `frontend_root` hoje (FamiliaBens/CentroCusto/Contador/etc.).
//
// Contrato real (TASK-MK-FE-01): search (Input, busca por `description`) +
// type (Select — Todos/Atividade/Infraestrutura, via fábrica
// `markerTypeOptions`) + is_enabled (Select — Todos/Ativo/Inativo).
//
// Contrato B canônico (`FilterModalProps<MarkerFilterForm>`): re-hidratação
// via `toInternalValues(filter)` (prop `filter` = `paginatedQuery.filter` do
// index.tsx) somada a `pristineFormValues`, ressincronizada em um ÚNICO
// `useEffect` com deps `[isOpen]` — nunca `[filter]`, para não sobrescrever o
// que o usuário está digitando enquanto o drawer está aberto.
// -----------------------------------------------------------------------------

import { useEffect } from 'react';

import { Text } from '@chakra-ui/react';
import { Controller, useForm } from 'react-hook-form';

import { Button } from '@/components/Button';
import { FilterSide } from '@/components/FilterSide';
import { Form } from '@/components/Form';
import { Input } from '@/components/Form/Input';
import { Select } from '@/components/Form/Select';

import { markerTypeOptions } from '@/constants/Marker/options/marker-type-options';

import type { FilterModalProps } from '@/@types/filter-modal';
import type { Option } from '@/@types/option';
import type { MarkerFilterForm } from '@/@types/v2/BaseRegistrations/marker';

// Forma INTERNA do form (só deste componente) — os Selects trabalham com
// `Option`, o submit converte para `MarkerFilterForm` (strings cruas).
interface FilterFormValues {
  search?: string;
  type: Option<1 | 2> | null;
  is_enabled: Option<string> | null;
}

export function FilterSideMarkers({
  isOpen,
  onClose,
  handleReset,
  handleFilterChange,
  filter,
  languageGB,
}: FilterModalProps<MarkerFilterForm>) {
  // Var local de i18n renomeada p/ `filterText` — evita colisão com a prop
  // `filter` do Contrato B (`FilterModalProps<MarkerFilterForm>`).
  const filterText = languageGB.markers.marker.filter;

  const typeOptions = markerTypeOptions.options(languageGB);

  const enabledOptions: Option<string>[] = [
    { value: 'true', label: filterText.enabledOptions.active },
    { value: 'false', label: filterText.enabledOptions.inactive },
  ];

  const pristineFormValues: FilterFormValues = {
    search: '',
    type: null,
    is_enabled: null,
  };

  function toInternalValues(rawFilter?: MarkerFilterForm | null): FilterFormValues {
    return {
      search: rawFilter?.search ?? '',
      type: rawFilter?.type
        ? (typeOptions.find((option) => String(option.value) === rawFilter.type) ?? null)
        : null,
      is_enabled: rawFilter?.is_enabled
        ? (enabledOptions.find((option) => option.value === rawFilter.is_enabled) ?? null)
        : null,
    };
  }

  const { control, register, handleSubmit, reset } = useForm<FilterFormValues>({
    defaultValues: {
      ...pristineFormValues,
      ...toInternalValues(filter),
    },
  });

  // Ao (re)abrir o drawer, ressincroniza o form com o filtro aplicado.
  // Deps SOMENTE [isOpen] — deliberado: reagir a `filter` clobaria o que o
  // usuário está digitando dentro do drawer aberto.
  useEffect(() => {
    if (!isOpen) return;

    reset({
      ...pristineFormValues,
      ...toInternalValues(filter),
    });
  }, [isOpen]);

  function onSubmit(data: FilterFormValues) {
    handleFilterChange({
      search: data.search?.trim() || undefined,
      // `type` SEMPRE stringificado explicitamente antes de ir para a
      // querystring — armadilha #2 do task-packet (enum como int, mas
      // stringificado).
      type: data.type ? (String(data.type.value) as MarkerFilterForm['type']) : undefined,
      is_enabled: (data.is_enabled?.value as MarkerFilterForm['is_enabled']) || undefined,
    });
    onClose();
  }

  function handleResetFilters() {
    handleReset();
    reset(pristineFormValues);
  }

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
            variant="outline"
            onClick={handleResetFilters}
            type="button"
          />
          <Button title={languageGB.defaltStrings.applyFilters} type="submit" />
        </Form.FooterFilter>
      </Form>
    </FilterSide>
  );
}
