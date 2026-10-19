// src/pages/Dashboards/FinancialDashboard/FilterSideFinancialDashboard.tsx
// Drawer de filtro da dashboard Financeiro (execução 048, TASK-04-FE) —
// Contrato B canônico (`FilterModalProps<T>`), 3 campos: Ano/Mês (Select
// estático, `CONTRATO-API-048-04 §2` — mês/ano de referência, default mês
// corrente) e Centro de Custo (Option async, `cost_center_uuid`). Substitui
// os 2 pares de data + `farms[]` do rascunho do ROTEIRO §5.4, que não
// existem no contrato de API final aprovado (mesmo racional de
// Pluviometria/Depreciações/Livro Caixa: dado real tem precedência sobre
// desenho especulativo do rascunho da Tarefa).

import { useEffect } from 'react';

import { Text } from '@chakra-ui/react';
import { yupResolver } from '@hookform/resolvers/yup';
import { Controller, useForm } from 'react-hook-form';

import { Button } from '@/components/Button';
import { FilterSide } from '@/components/FilterSide';
import { Form } from '@/components/Form';
import { Select } from '@/components/Form/Select';
import { SelectAsyncPaginate } from '@/components/Form/SelectAsyncPaginate';

import { financialMonthOptions } from '@/constants/dashboards/financialDashboard/options/financial-month-options';
import { financialYearOptions } from '@/constants/dashboards/financialDashboard/options/financial-year-options';

import { financialDashboardFilterSchema } from '@/validations/schemas/Dashboards/financialDashboard-filter-schema';

import { listCostCenterOptions } from '@/services/v2/CostCenters/cost-center-service';

import type { FilterModalProps } from '@/@types/filter-modal';
import type { CostCenterRef } from '@/@types/v2/CostCenters';
import type { FinancialDashboardFilterForm } from '@/@types/v2/Dashboards/financialDashboard';

const pristineFormValues: FinancialDashboardFilterForm = {
  year: null,
  month: null,
  costCenter: null,
};

interface FilterSideFinancialDashboardProps extends FilterModalProps<FinancialDashboardFilterForm> {
  filtersApplied?: number;
}

export function FilterSideFinancialDashboard({
  isOpen,
  onClose,
  handleReset,
  handleFilterChange,
  filter,
  languageGB,
  filtersApplied,
}: FilterSideFinancialDashboardProps) {
  const text = languageGB.dashboards.financialDashboard.filter;
  const yearOptions = financialYearOptions.options();
  const monthOptions = financialMonthOptions.options(languageGB);

  function toInternalValues(
    rawFilter?: FinancialDashboardFilterForm | null
  ): FinancialDashboardFilterForm {
    return {
      year: rawFilter?.year ?? null,
      month: rawFilter?.month ?? null,
      costCenter: rawFilter?.costCenter ?? null,
    };
  }

  const { control, handleSubmit, reset } = useForm<FinancialDashboardFilterForm>({
    resolver: yupResolver(financialDashboardFilterSchema()),
    defaultValues: { ...pristineFormValues, ...toInternalValues(filter) },
  });

  useEffect(() => {
    if (!isOpen) return;
    reset({ ...pristineFormValues, ...toInternalValues(filter) });
  }, [isOpen]);

  function onSubmit(data: FinancialDashboardFilterForm) {
    handleFilterChange(data);
    onClose();
  }

  function handleResetFilters() {
    handleReset();
    reset(pristineFormValues);
  }

  return (
    <FilterSide
      isOpen={isOpen}
      onClose={onClose}
      languageGB={languageGB}
      filtersApplied={filtersApplied}
    >
      <Form noPadding formFilter onSubmit={handleSubmit(onSubmit)}>
        <Form.BodyFilter>
          <Text fontWeight="bold" color="brandColorText">
            {text.title}
          </Text>

          <Controller
            name="year"
            control={control}
            render={({ field: { name, value, onChange } }) => (
              <Select
                label={text.year}
                name={name}
                value={value}
                onChange={onChange}
                options={yearOptions}
              />
            )}
          />

          <Controller
            name="month"
            control={control}
            render={({ field: { name, value, onChange } }) => (
              <Select
                label={text.month}
                name={name}
                value={value}
                onChange={onChange}
                options={monthOptions}
              />
            )}
          />

          <Controller
            name="costCenter"
            control={control}
            render={({ field }) => (
              <SelectAsyncPaginate
                name={field.name}
                label={text.costCenter}
                placeholder={text.costCenterAllPlaceholder}
                service={listCostCenterOptions}
                mapOptions={(item: CostCenterRef) => ({
                  label: `${item.code} — ${item.description}`,
                  value: item.uuid,
                })}
                findParams={(search: string | { search: string }) => ({
                  search: typeof search === 'string' ? search : search.search,
                })}
                value={field.value}
                onChange={(option: any) => field.onChange(option ?? null)}
                menuPortalTarget={document.body}
                menuPosition="fixed"
              />
            )}
          />
        </Form.BodyFilter>
        <Form.FooterFilter>
          <Button
            title={languageGB.defaltStrings.clearAllFilters}
            variant="outline"
            onClick={handleResetFilters}
            type="button"
          />
          <Button title={languageGB.defaltStrings.applyFilters} type="submit" />
        </Form.FooterFilter>
      </Form>
    </FilterSide>
  );
}
