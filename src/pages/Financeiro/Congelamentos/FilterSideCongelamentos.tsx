// src/pages/Financeiro/Congelamentos/FilterSideCongelamentos.tsx
// -----------------------------------------------------------------------------
// Drawer de FILTRO da listagem de Congelamentos Financeiros (FinancialFreeze
// — F-110, Tarefa 31) — casca `<FilterSide>` + `<Form formFilter>`/
// `<Form.BodyFilter>`/`<Form.FooterFilter>`, Contrato B do filtro
// (get_pwa_grid_query_pattern) — SEIS props exatas
// (`FilterModalProps<FinancialFreezeFilterRequest>`, não ampliar o tipo).
//
// Mirror estrutural de `FilterSideDepreciacao.tsx` (mesmo par Select de mês +
// Input de ano, mesma re-hidratação em `[isOpen]`) — aqui SEM o campo
// `equipment_uuid` (não existe nesta feature) e SEM domínio de aba.
//
// `month` e `year` são filtros INDEPENDENTES (contrato de tela §5.2):
// `MonthInput` ('YYYY-MM') foi avaliado e REJEITADO — um campo único
// impediria "filtrar só por ano" (caso real do domínio) e divergiria do
// legado.
// -----------------------------------------------------------------------------

import { useEffect } from 'react';

import { Text } from '@chakra-ui/react';
import { Controller, useForm } from 'react-hook-form';

import { Button } from '@/components/Button';
import { FilterSide } from '@/components/FilterSide';
import { Form } from '@/components/Form';
import { Input } from '@/components/Form/Input';
import { Select } from '@/components/Form/Select';

import { financialFreezeMonthOptions } from '@/constants/Financial/FinancialFreeze/options/financial-freeze-month-options';

import type { FilterModalProps } from '@/@types/filter-modal';
import type { Option } from '@/@types/option';
import type { FinancialFreezeFilterRequest } from '@/@types/v2/FinancialFreeze';

interface FilterFormValues {
  month: Option<number> | null;
  year: string;
}

const pristineFormValues: FilterFormValues = {
  month: null,
  year: '',
};

export function FilterSideCongelamentos({
  isOpen,
  onClose,
  handleReset,
  handleFilterChange,
  filter,
  languageGB,
}: FilterModalProps<FinancialFreezeFilterRequest>) {
  const text = languageGB.financial.financialFreeze.filter;

  function toInternalValues(rawFilter?: FinancialFreezeFilterRequest | null): FilterFormValues {
    return {
      month:
        rawFilter?.month != null
          ? financialFreezeMonthOptions.getOption(rawFilter.month, languageGB)
          : null,
      year: rawFilter?.year ?? '',
    };
  }

  const { control, register, handleSubmit, reset } = useForm<FilterFormValues>({
    defaultValues: { ...pristineFormValues, ...toInternalValues(filter) },
  });

  // Re-hidratação SOMENTE em `[isOpen]` — mirror `FilterSideDepreciacao.tsx`
  // / `FilterSideOfxImport.tsx`. Reagir a `[filter]` apagaria o que o
  // usuário está digitando dentro do drawer aberto.
  useEffect(() => {
    if (!isOpen) return;
    reset({ ...pristineFormValues, ...toInternalValues(filter) });
  }, [isOpen]);

  function onSubmit(data: FilterFormValues) {
    handleFilterChange({
      month: data.month?.value ?? undefined,
      year: data.year || undefined,
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
            {text.title}
          </Text>

          <Controller
            name="month"
            control={control}
            render={({ field: { name, value, onChange } }) => (
              <Select
                label={text.month}
                placeholder={text.monthAll}
                name={name}
                value={value}
                onChange={onChange}
                options={financialFreezeMonthOptions.options(languageGB)}
              />
            )}
          />

          <Input
            label={text.year}
            placeholder={text.yearPlaceholder}
            maxLength={4}
            inputMode="numeric"
            {...register('year')}
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
            onClick={onClose}
            type="button"
          />
          <Button title={languageGB.defaltStrings.applyFilters} type="submit" />
        </Form.FooterFilter>
      </Form>
    </FilterSide>
  );
}
