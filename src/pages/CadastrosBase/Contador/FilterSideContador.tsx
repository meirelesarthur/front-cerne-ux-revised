// src/pages/CadastrosBase/Contador/FilterSideContador.tsx
// -----------------------------------------------------------------------------
// Drawer de FILTRO da listagem de Contador — único filtro real do contrato
// (Contador-contrato §3): `search` (ILIKE em `razao_social`/`nome_fantasia`/
// `cnpj`). NÃO inventar filtro de cidade/emissor fiscal sem base contratual
// (ver Tarefa, §"Componentes").
//
// Rehidrata o campo com o filtro já aplicado ao reabrir o drawer (mesmo
// cuidado de `FilterSidePlanAccount.tsx`/`FilterSideAddressing.tsx` —
// TASK-FILTER-REHYDRATE-01): `useEffect` com deps SÓ `[isOpen]`.
// -----------------------------------------------------------------------------

import { useEffect } from 'react';

import { Text } from '@chakra-ui/react';
import { useForm } from 'react-hook-form';

import { Button } from '@/components/Button';
import { FilterSide } from '@/components/FilterSide';
import { Form } from '@/components/Form';
import { Input } from '@/components/Form/Input';

import type { FilterModalProps } from '@/@types/filter-modal';
import type { ContadorFilterForm } from '@/@types/v2/Contadores';

const pristineFormValues: ContadorFilterForm = {
  search: '',
};

function toInternalValues(rawFilter?: ContadorFilterForm | null): ContadorFilterForm {
  return {
    search: rawFilter?.search ?? '',
  };
}

export function FilterSideContador({
  isOpen,
  onClose,
  handleReset,
  handleFilterChange,
  filter,
  languageGB,
}: FilterModalProps<ContadorFilterForm>) {
  const { register, handleSubmit, reset } = useForm<ContadorFilterForm>({
    defaultValues: {
      ...pristineFormValues,
      ...toInternalValues(filter),
    },
  });

  const text = languageGB.contadores.contador.filter;

  // Ao (re)abrir o drawer, ressincroniza o form com o filtro aplicado.
  useEffect(() => {
    reset({
      ...pristineFormValues,
      ...toInternalValues(filter),
    });
  }, [isOpen]);

  function onSubmit(data: ContadorFilterForm) {
    handleFilterChange({ search: data.search?.trim() || undefined });
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
            {text.title}
          </Text>

          <Input
            label={text.search}
            placeholder={text.searchPlaceholder}
            {...register('search')}
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
