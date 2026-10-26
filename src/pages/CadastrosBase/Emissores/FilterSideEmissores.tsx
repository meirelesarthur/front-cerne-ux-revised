// src/pages/CadastrosBase/Emissores/FilterSideEmissores.tsx
// -----------------------------------------------------------------------------
// Drawer de FILTRO da listagem de Emissores NFe (mesma casca global
// <FilterSide> de CondicoesPagamento/FilterSideCondicoesPagamento.tsx).
//
// Contrato real (IssuerIndexRequest, contrato backend §12.1): `search`
// (Input) + `is_enabled` (Select Todos/Ativo/Inativo) + `issues_nfe` (Select
// Todos/Sim/Não). SEM filtro de Ambiente (GAP-FE-114 — `IssuerIndexRequest`
// não valida esse parâmetro; enviá-lo seria um filtro "fantasma").
//
// RE-HIDRATAÇÃO — prop `filter` (Contrato B) + `useEffect` com deps
// `[isOpen]` (mesmo padrão de FilterSideDiagnosisPregnancy.tsx).
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
import type { IssuerFilterForm } from '@/@types/v2/Issuers';

interface FilterFormValues {
  search?: string;
  is_enabled: Option<string> | null;
  issues_nfe: Option<string> | null;
}

export function FilterSideEmissores({
  isOpen,
  onClose,
  handleReset,
  handleFilterChange,
  filter,
  languageGB,
}: FilterModalProps<IssuerFilterForm>) {
  const text = languageGB.issuers.issuer.filter;

  const enabledOptions: Option<string>[] = [
    { value: 'true', label: text.enabledOptions.active },
    { value: 'false', label: text.enabledOptions.inactive },
  ];

  const issuesNfeOptions: Option<string>[] = [
    { value: 'true', label: text.issuesNfeOptions.yes },
    { value: 'false', label: text.issuesNfeOptions.no },
  ];

  const pristineFormValues: FilterFormValues = {
    search: '',
    is_enabled: null,
    issues_nfe: null,
  };

  function toInternalValues(rawFilter?: IssuerFilterForm | null): FilterFormValues {
    return {
      search: rawFilter?.search ?? '',
      is_enabled: enabledOptions.find((option) => option.value === rawFilter?.is_enabled) ?? null,
      issues_nfe: issuesNfeOptions.find((option) => option.value === rawFilter?.issues_nfe) ?? null,
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
      is_enabled: (data.is_enabled?.value as IssuerFilterForm['is_enabled']) || undefined,
      issues_nfe: (data.issues_nfe?.value as IssuerFilterForm['issues_nfe']) || undefined,
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  return (
    <FilterSide isOpen={isOpen} onClose={onClose} languageGB={languageGB}>
      <Form noPadding formFilter onSubmit={handleSubmit(onSubmit)}>
        <Form.BodyFilter>
          <Text fontWeight="bold" color="brandColorText">
            {text.title}
          </Text>

          <Input label={text.search} placeholder={text.searchPlaceholder} {...register('search')} />

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

          <Controller
            name="issues_nfe"
            control={control}
            render={({ field: { name, value, onChange } }) => (
              <Select
                label={text.issuesNfe}
                placeholder={text.issuesNfeAll}
                name={name}
                value={value}
                onChange={onChange}
                options={issuesNfeOptions}
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
