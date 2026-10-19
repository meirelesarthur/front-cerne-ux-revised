// src/pages/CadastrosBase/Categorias/FilterSideCategorias.tsx
// -----------------------------------------------------------------------------
// Drawer de FILTRO da listagem de Categorias Financeiras (mesma casca global
// <FilterSide> de FilterSideAgrupadores.tsx/FilterSideCentroCusto.tsx).
//
// Contrato real (Gestão-Contrato §3.1/§6.1): search (Input, aciona o MODO
// GRID achatado) + is_enabled (Select) + classification (Select — N/C/O).
// SEM filtro por Tipo/Agrupador — o backend espera `type_id`/`grouper_id`
// NUMÉRICOS internos, que o front nunca tem (contrato §3.1, omissão
// deliberada, não é regressão).
//
// Re-hidratação: mesmo padrão consolidado (useEffect com deps `[isOpen]`
// SOMENTE), agora hidratando a partir da prop `filter` (Contrato B).
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
import type {
  FinancialCategoryClassification,
  FinancialCategoryFilterForm,
} from '@/@types/v2/FinancialCategories';

interface FilterFormValues {
  search?: string;
  is_enabled: Option<string> | null;
  classification: Option<FinancialCategoryClassification> | null;
}

export function FilterSideCategorias({
  isOpen,
  onClose,
  handleReset,
  handleFilterChange,
  filter,
  languageGB,
}: FilterModalProps<FinancialCategoryFilterForm>) {
  const text = languageGB.financialCategories.financialCategory.filter;

  const enabledOptions: Option<string>[] = [
    { value: 'true', label: text.enabledOptions.active },
    { value: 'false', label: text.enabledOptions.inactive },
  ];

  const classificationOptions: Option<FinancialCategoryClassification>[] = [
    { value: 'N', label: text.classificationOptions.unclassified },
    { value: 'C', label: text.classificationOptions.capex },
    { value: 'O', label: text.classificationOptions.opex },
  ];

  const pristineFormValues: FilterFormValues = {
    search: '',
    is_enabled: null,
    classification: null,
  };

  function toInternalValues(rawFilter?: FinancialCategoryFilterForm | null): FilterFormValues {
    return {
      search: rawFilter?.search ?? '',
      is_enabled: enabledOptions.find((option) => option.value === rawFilter?.is_enabled) ?? null,
      classification:
        classificationOptions.find((option) => option.value === rawFilter?.classification) ??
        null,
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
      is_enabled:
        (data.is_enabled?.value as FinancialCategoryFilterForm['is_enabled']) || undefined,
      classification:
        (data.classification?.value as FinancialCategoryFilterForm['classification']) || undefined,
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
            name="classification"
            control={control}
            render={({ field: { name, value, onChange } }) => (
              <Select
                label={text.classification}
                placeholder={text.classificationAll}
                name={name}
                value={value}
                onChange={onChange}
                options={classificationOptions}
              />
            )}
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
