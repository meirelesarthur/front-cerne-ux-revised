// src/pages/Administrativo/Equipes/FilterSideEquipes.tsx
// -----------------------------------------------------------------------------
// Drawer de FILTRO da listagem de Equipes (mesma casca global <FilterSide>
// de FilterSideFuncoes.tsx — casca interna é um `Drawer` genérico
// (`Drawer.Body` recebe `children`); o form real é montado pelo CALLER via
// `<Form formFilter>` + `Form.BodyFilter` (campos) + `Form.FooterFilter`
// (botões), padrão canônico de todos os filtros reais do `frontend_root`.
//
// Contrato real (front-contract-equipes.md §4.3): search (Input, busca ILIKE
// em `name`/`description` no servidor) + is_enabled (Select — Todos/Ativo/
// Inativo). SEM filtro adicional (GAP-EQ-FE-05/06 não pedem mais campos).
//
// Contrato B canônico (`FilterModalProps<TeamFilterForm>`): re-hidratação via
// `toInternalValues(filter)` somada a `pristineFormValues`, ressincronizada
// em um ÚNICO `useEffect` com deps `[isOpen]` — nunca `[filter]`.
//
// Armadilha #4 da Tarefa — `is_enabled` SEMPRE stringificado com `??`, nunca
// `||` (`false`/"Inativo" é falsy e seria descartado por `||`).
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
import type { TeamFilterForm } from '@/@types/v2/Teams';

// Forma INTERNA do form (só deste componente) — o Select trabalha com
// `Option`, o submit converte para `TeamFilterForm` (strings cruas).
interface FilterFormValues {
  search?: string;
  is_enabled: Option<string> | null;
}

export function FilterSideEquipes({
  isOpen,
  onClose,
  handleReset,
  handleFilterChange,
  filter,
  languageGB,
}: FilterModalProps<TeamFilterForm>) {
  // Var local de i18n renomeada p/ `filterText` — evita colisão com a prop
  // `filter` do Contrato B (`FilterModalProps<TeamFilterForm>`).
  const filterText = languageGB.workTeams.workTeam.filter;

  const enabledOptions: Option<string>[] = [
    { value: 'true', label: filterText.enabledOptions.active },
    { value: 'false', label: filterText.enabledOptions.inactive },
  ];

  const pristineFormValues: FilterFormValues = {
    search: '',
    is_enabled: null,
  };

  function toInternalValues(rawFilter?: TeamFilterForm | null): FilterFormValues {
    return {
      search: rawFilter?.search ?? '',
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
      // `??`, NUNCA `||` — armadilha #4 da Tarefa (`false` é falsy e seria
      // descartado por `||`, quebrando o filtro "Inativo").
      is_enabled: (data.is_enabled?.value as TeamFilterForm['is_enabled']) ?? undefined,
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
