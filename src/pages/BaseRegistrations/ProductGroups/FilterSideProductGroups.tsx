// src/pages/BaseRegistrations/ProductGroups/FilterSideProductGroups.tsx
// -----------------------------------------------------------------------------
// Drawer de FILTRO da listagem de Grupos de Produto (mesma casca global
// <FilterSide> de CentroCusto/FilterSideCentroCusto.tsx e
// Racas/FilterSideRacas.tsx).
//
// Contrato real (TASK-GRP-01): search (Input, param `search`) + is_enabled
// (Select — Ativo/Inativo, param `is_enabled`) — SEM nenhum Select adicional
// (Grupos de Produto não tem nenhuma FK, nem opcional).
//
// Re-hidratação (recorrência do padrão já implementado em
// Racas/FilterSideRacas.tsx e CentroCusto/FilterSideCentroCusto.tsx): o form
// reconstrói seus valores a partir do filtro REALMENTE aplicado na listagem
// (`filter`) toda vez que o drawer abre — nunca de um literal em branco fixo.
// Deps do `useEffect` restritas a `[isOpen]` DE PROPÓSITO — ver comentário no
// próprio hook abaixo.
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
import type { ProductGroupFilterForm } from '@/@types/v2/ProductGroups/product-group';

// Forma INTERNA do form (só deste componente) — o Select trabalha com
// `Option`, o submit converte para `ProductGroupFilterForm` (string crua).
interface FilterFormValues {
  search?: string;
  is_enabled: Option<string> | null;
}

export function FilterSideProductGroups({
  isOpen,
  onClose,
  handleReset,
  handleFilterChange,
  filter,
  languageGB,
}: FilterModalProps<ProductGroupFilterForm>) {
  const text = languageGB.productGroups.productGroup.filter;

  const enabledOptions: Option<string>[] = [
    { value: 'true', label: text.enabledOptions.active },
    { value: 'false', label: text.enabledOptions.inactive },
  ];

  const pristineFormValues: FilterFormValues = {
    search: '',
    is_enabled: null,
  };

  function toInternalValues(rawFilter?: ProductGroupFilterForm | null): FilterFormValues {
    return {
      search: rawFilter?.search ?? '',
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
      is_enabled: (data.is_enabled?.value as ProductGroupFilterForm['is_enabled']) || undefined,
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

  // Re-hidrata o form a partir do filtro REALMENTE aplicado sempre que o
  // drawer abre — NUNCA a partir de um literal em branco fixo.
  useEffect(() => {
    reset({
      ...pristineFormValues,
      ...toInternalValues(filter),
    });
    // Deps: SOMENTE isOpen. NUNCA incluir `filter` aqui — se entrar, toda vez
    // que a grid re-fetcha (o que atualiza a referência do objeto filter) o
    // efeito dispara de novo e sobrescreve (clobber) o que o usuário está
    // digitando dentro do drawer aberto.
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
