// src/pages/BaseRegistrations/TypeTitles/FilterSideTypeTitles.tsx
// -----------------------------------------------------------------------------
// Drawer de FILTRO da listagem de Tipos de Título (mesma casca global
// <FilterSide> de FilterSideMotivosBaixa.tsx — molde do drawer desta Tarefa,
// por não ter nenhum Select assíncrono).
//
// Contrato real (TASK-TT-01): search (Input, busca por `description`) +
// is_enabled (Select — Todos/Ativo/Inativo) + type (Select — Todos/Pagar/
// Receber/Ambas). `factor` NÃO entra no filtro — não foi pedido e o backend
// não suporta (TypeTitleFilterData só tem search/is_enabled/type/per_page).
//
// Sem SelectAsyncPaginate, sem companion `_label`, sem
// menuPortalTarget/menuPosition="fixed" — `is_enabled`/`type` são Selects
// Chakra estáticos, que já portalizam nativamente (mesmo racional de
// FilterSideMotivosBaixa.tsx).
//
// RE-HIDRATAÇÃO — prop `filter` (Contrato B; o index.tsx passa
// `filter={paginatedQuery.filter}`) + `useEffect` com deps `[isOpen]`
// APENAS (nunca incluir `filter` nas deps — evitaria reset no meio de
// uma edição do usuário enquanto o drawer está aberto).
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
import type { TypeTitleFilterForm } from '@/@types/v2/BaseRegistrations/typeTitles';

// Forma INTERNA do form (só deste componente) — os Selects trabalham com
// `Option`, o submit converte para `TypeTitleFilterForm` (strings cruas).
interface FilterFormValues {
  search?: string;
  is_enabled: Option<string> | null;
  type: Option<string> | null;
}

export function FilterSideTypeTitles({
  isOpen,
  onClose,
  handleReset,
  handleFilterChange,
  filter: appliedFilter,
  languageGB,
}: FilterModalProps<TypeTitleFilterForm>) {
  const filter = languageGB.baseRegistrations.typeTitle.filter;

  const enabledOptions: Option<string>[] = [
    { value: 'true', label: filter.enabledOptions.active },
    { value: 'false', label: filter.enabledOptions.inactive },
  ];

  const typeOptions: Option<string>[] = [
    { value: '1', label: filter.typeOptions.payable },
    { value: '2', label: filter.typeOptions.receivable },
    { value: '3', label: filter.typeOptions.both },
  ];

  const pristineFormValues: FilterFormValues = {
    search: '',
    is_enabled: null,
    type: null,
  };

  function toInternalValues(rawFilter?: TypeTitleFilterForm | null): FilterFormValues {
    return {
      search: rawFilter?.search ?? '',
      is_enabled: enabledOptions.find((o) => o.value === rawFilter?.is_enabled) ?? null,
      type: typeOptions.find((o) => o.value === rawFilter?.type) ?? null,
    };
  }

  const { control, register, handleSubmit, reset } = useForm<FilterFormValues>({
    defaultValues: {
      ...pristineFormValues,
      ...toInternalValues(appliedFilter),
    },
  });

  // RE-HIDRATAÇÃO — deps `[isOpen]` APENAS. Ao (re)abrir o drawer, reconstrói
  // os campos a partir do filtro REALMENTE aplicado na grid (`filter`), não
  // dos `defaultValues` fixos do useForm. Não reage a mudanças de `filter`
  // enquanto o drawer permanece aberto (evitaria resetar o form no meio de
  // uma edição do usuário).
  useEffect(() => {
    reset({
      ...pristineFormValues,
      ...toInternalValues(appliedFilter),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  function onSubmit(data: FilterFormValues) {
    handleFilterChange({
      search: data.search?.trim() || undefined,
      is_enabled: (data.is_enabled?.value as TypeTitleFilterForm['is_enabled']) || undefined,
      type: (data.type?.value as TypeTitleFilterForm['type']) || undefined,
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
      ...toInternalValues(appliedFilter),
    });
    onClose();
  }

  return (
    <FilterSide isOpen={isOpen} onClose={onClose} languageGB={languageGB}>
      <Form noPadding formFilter onSubmit={handleSubmit(onSubmit)}>
        <Form.BodyFilter>
          <Text fontWeight="bold" color="brandColorText">
            {filter.title}
          </Text>

          <Input
            label={filter.search}
            placeholder={filter.searchPlaceholder}
            {...register('search')}
          />

          <Controller
            name="is_enabled"
            control={control}
            render={({ field: { name, value, onChange } }) => (
              <Select
                label={filter.isEnabled}
                placeholder={filter.isEnabledAll}
                name={name}
                value={value}
                onChange={onChange}
                options={enabledOptions}
              />
            )}
          />

          <Controller
            name="type"
            control={control}
            render={({ field: { name, value, onChange } }) => (
              <Select
                label={filter.type}
                placeholder={filter.typeAll}
                name={name}
                value={value}
                onChange={onChange}
                options={typeOptions}
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
