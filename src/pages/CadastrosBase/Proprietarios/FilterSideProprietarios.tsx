// src/pages/CadastrosBase/Proprietarios/FilterSideProprietarios.tsx
// -----------------------------------------------------------------------------
// Drawer de FILTRO da listagem de Proprietários — 2 filtros reais do
// contrato (Proprietary-contrato.md ## 3): `search` (texto) + `is_enabled`
// (Select booleano). Sem filtro de `type`/`city` — `Proprietary` não tem
// enum de tipo e o contrato não pede filtro de cidade nesta Tarefa.
//
// `<Form formFilter>` + `Form.BodyFilter`/`Form.FooterFilter` (componente
// canônico, `@/components/Form`) — instrução EXPLÍCITA da ficha desta
// Tarefa. `<VStack as="form">` é NUNCA aceitável para telas novas (mesma
// divergência deliberada já registrada em `FilterSideFornecedores.tsx`
// frente aos irmãos mais antigos de Cadastros Base).
//
// Rehidrata o campo com o filtro já aplicado ao reabrir o drawer (mesmo
// cuidado de `FilterSideFornecedores.tsx`/`FilterSideContador.tsx`):
// `useEffect` com deps SÓ `[isOpen]` — nunca `appliedFilter`, senão um
// refetch da grid (que troca a referência do objeto) reabriria o efeito e
// sobrescreveria o que o usuário está digitando/selecionando no drawer já
// aberto.
//
// `isEnabled` re-resolvido pela LISTA ESTÁTICA de opções (por `.value`),
// nunca confiando em `label` eventualmente persistido no filtro aplicado —
// mesmo racional de `FilterSideFornecedores.tsx`.
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
import type { ProprietaryFilterForm } from '@/@types/v2/CadastrosBase/proprietary';

const pristineFormValues: ProprietaryFilterForm = {
  search: '',
  isEnabled: null,
};

export function FilterSideProprietarios({
  isOpen,
  onClose,
  handleReset,
  handleFilterChange,
  filter,
  languageGB,
}: FilterModalProps<ProprietaryFilterForm>) {
  const text = languageGB.proprietaries.proprietary.filter;

  const enabledOptions: Option<boolean>[] = [
    { value: true, label: text.enabledOptions.active },
    { value: false, label: text.enabledOptions.inactive },
  ];

  function toInternalValues(rawFilter?: ProprietaryFilterForm | null): ProprietaryFilterForm {
    return {
      search: rawFilter?.search ?? '',
      isEnabled: enabledOptions.find((o) => o.value === rawFilter?.isEnabled?.value) ?? null,
    };
  }

  const { control, register, handleSubmit, reset } = useForm<ProprietaryFilterForm>({
    defaultValues: {
      ...pristineFormValues,
      ...toInternalValues(filter),
    },
  });

  function onSubmit(data: ProprietaryFilterForm) {
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
                // Armadilha #9 do checklist: `?? null`, NUNCA `?? undefined`
                // — Select controlado vira NÃO-controlado com `undefined` e
                // mantém a última seleção.
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
