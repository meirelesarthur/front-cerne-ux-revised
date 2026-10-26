// src/pages/CadastrosBase/Pessoas/FilterSidePessoas.tsx
// -----------------------------------------------------------------------------
// Drawer de FILTRO da listagem de Pessoas — mesma casca global <FilterSide>
// de FilterSideCondicoesPagamento.tsx/FilterSideTiposTitulo.tsx.
//
// Contrato real (People-contrato.md §6/`PersonFilterData`): apenas 2 filtros
// — `search` (nome/apelido/CPF-CNPJ normalizado, NÃO e-mail) e `entity`
// (papel: proprietary/employee/provider/client/user). SEM campo de status —
// `Person` não tem conceito de `is_enabled`, só os papéis.
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
import type { PersonFilterForm, RoleKey } from '@/@types/v2/People';

interface FilterFormValues {
  search?: string;
  entity: Option<RoleKey> | null;
}

export function FilterSidePessoas({
  isOpen,
  onClose,
  handleReset,
  handleFilterChange,
  filter,
  languageGB,
}: FilterModalProps<PersonFilterForm>) {
  const text = languageGB.people.person;
  const roles = text.roles;

  const roleOptions: Option<RoleKey>[] = [
    { value: 'proprietary', label: roles.proprietary },
    { value: 'employee', label: roles.employee },
    { value: 'provider', label: roles.provider },
    { value: 'client', label: roles.client },
    { value: 'user', label: roles.user },
  ];

  const pristineFormValues: FilterFormValues = {
    search: '',
    entity: null,
  };

  function toInternalValues(rawFilter?: PersonFilterForm | null): FilterFormValues {
    return {
      search: rawFilter?.search ?? '',
      entity: roleOptions.find((o) => o.value === rawFilter?.entity) ?? null,
    };
  }

  const { control, register, handleSubmit, reset } = useForm<FilterFormValues>({
    defaultValues: {
      ...pristineFormValues,
      ...toInternalValues(filter),
    },
  });

  // Ao (re)abrir o drawer, ressincroniza o form com o filtro aplicado.
  useEffect(() => {
    reset({
      ...pristineFormValues,
      ...toInternalValues(filter),
    });
  }, [isOpen]);

  function onSubmit(data: FilterFormValues) {
    handleFilterChange({
      search: data.search?.trim() || undefined,
      entity: data.entity?.value || undefined,
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

  return (
    <FilterSide isOpen={isOpen} onClose={onClose} languageGB={languageGB}>
      <Form noPadding formFilter onSubmit={handleSubmit(onSubmit)}>
        <Form.BodyFilter>
          <Text fontWeight="bold" color="brandColorText">
            {text.filter.title}
          </Text>

          <Input
            label={text.filter.search}
            placeholder={text.list.searchPlaceholder}
            {...register('search')}
          />

          <Controller
            name="entity"
            control={control}
            render={({ field: { name, value, onChange } }) => (
              <Select
                label={text.filter.role}
                placeholder={text.filter.roleAll}
                name={name}
                value={value}
                onChange={onChange}
                options={roleOptions}
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
