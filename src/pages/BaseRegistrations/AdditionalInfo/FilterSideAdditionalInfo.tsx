// src/pages/BaseRegistrations/AdditionalInfo/FilterSideAdditionalInfo.tsx
// -----------------------------------------------------------------------------
// Drawer de FILTRO da listagem de Informações Complementares (mesma casca
// global <FilterSide> de FilterSideTiposTitulo.tsx — molde deste drawer, por
// não ter nenhum Select assíncrono).
//
// Contrato real (TASK-AI-03): search (Input, busca por `description`) +
// is_active (Select — Todos/Ativo/Inativo). Sem `SelectAsyncPaginate`, sem
// companion `_label`, sem `menuPortalTarget`/`menuPosition="fixed"` —
// `is_active` é um Select Chakra estático, que já portaliza nativamente
// (AdditionalInfo não tem nenhuma FK própria — ver TASK-AI-03, seção
// "Correção de premissa").
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
import type { AdditionalInfoFilterForm } from '@/@types/v2/AdditionalInfo';

// Forma INTERNA do form (só deste componente) — o Select trabalha com
// `Option`, o submit converte para `AdditionalInfoFilterForm` (string crua).
interface FilterFormValues {
  search?: string;
  is_active: Option<string> | null;
}

export function FilterSideAdditionalInfo({
  isOpen,
  onClose,
  handleReset,
  handleFilterChange,
  filter,
  languageGB,
}: FilterModalProps<AdditionalInfoFilterForm>) {
  const text = languageGB.baseRegistrations.additionalInfo.filter;

  const activeOptions: Option<string>[] = [
    { value: 'true', label: text.activeOptions.active },
    { value: 'false', label: text.activeOptions.inactive },
  ];

  const pristineFormValues: FilterFormValues = {
    search: '',
    is_active: null,
  };

  function toInternalValues(rawFilter?: AdditionalInfoFilterForm | null): FilterFormValues {
    return {
      search: rawFilter?.search ?? '',
      is_active: activeOptions.find((option) => option.value === rawFilter?.is_active) ?? null,
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
      is_active: (data.is_active?.value as AdditionalInfoFilterForm['is_active']) || undefined,
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
            {text.title}
          </Text>

          <Input
            label={text.search}
            placeholder={text.searchPlaceholder}
            {...register('search')}
          />

          <Controller
            name="is_active"
            control={control}
            render={({ field: { name, value, onChange } }) => (
              <Select
                label={text.isActive}
                placeholder={text.isActiveAll}
                name={name}
                value={value}
                onChange={onChange}
                options={activeOptions}
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
