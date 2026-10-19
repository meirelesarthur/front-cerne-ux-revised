// src/pages/CadastrosBase/Clientes/FilterSideClientes.tsx
// -----------------------------------------------------------------------------
// Drawer de FILTRO da listagem de Clientes — 2 filtros (DEFAULT assumido,
// mirror `FilterSideProprietarios.tsx`): `search` (texto) + `is_enabled`
// (Select booleano).
//
// `<Form formFilter>` + `Form.BodyFilter`/`Form.FooterFilter` (componente
// canônico, `@/components/Form`) — `<VStack as="form">` NUNCA aceitável
// para telas novas.
//
// Rehidrata o campo com o filtro já aplicado ao reabrir o drawer: `useEffect`
// com deps SÓ `[isOpen]` — nunca `appliedFilter`, senão um refetch da grid
// (que troca a referência do objeto) reabriria o efeito e sobrescreveria o
// que o usuário está digitando/selecionando no drawer já aberto.
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
import type { ClientFilterForm } from '@/@types/v2/CadastrosBase/client';

const pristineFormValues: ClientFilterForm = {
  search: '',
  isEnabled: null,
};

export function FilterSideClientes({
  isOpen,
  onClose,
  handleReset,
  handleFilterChange,
  filter,
  languageGB,
}: FilterModalProps<ClientFilterForm>) {
  const text = languageGB.clients.client.filter;

  const enabledOptions: Option<boolean>[] = [
    { value: true, label: text.enabledOptions.active },
    { value: false, label: text.enabledOptions.inactive },
  ];

  function toInternalValues(rawFilter?: ClientFilterForm | null): ClientFilterForm {
    return {
      search: rawFilter?.search ?? '',
      isEnabled:
        enabledOptions.find((option) => option.value === rawFilter?.isEnabled?.value) ?? null,
    };
  }

  const { control, register, handleSubmit, reset } = useForm<ClientFilterForm>({
    defaultValues: {
      ...pristineFormValues,
      ...toInternalValues(filter),
    },
  });

  function onSubmit(data: ClientFilterForm) {
    handleFilterChange({
      search: data.search?.trim() || undefined,
      isEnabled: data.isEnabled ?? undefined,
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
            name="isEnabled"
            control={control}
            render={({ field: { name, value, onChange } }) => (
              <Select
                label={text.isEnabled}
                placeholder={text.isEnabledAll}
                name={name}
                // Armadilha #9 do checklist: `?? null`, NUNCA `?? undefined`.
                value={value ?? null}
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
