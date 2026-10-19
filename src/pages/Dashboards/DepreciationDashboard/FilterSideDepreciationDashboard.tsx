// src/pages/Dashboards/DepreciationDashboard/FilterSideDepreciationDashboard.tsx
// Drawer de filtro da dashboard Depreciações (execução 048, TASK-02-FE) —
// Contrato B canônico (`FilterModalProps<T>`), 2 campos: Ano e Tipo de ativo
// (`CONTRATO-API-048-02 §2` — shape final/aprovado; substitui o preset 3/6/12
// meses + filtro de equipamentos do rascunho do ROTEIRO §5.2, que não existe
// no contrato de API liberado).

import { useEffect } from 'react';

import { Text } from '@chakra-ui/react';
import { yupResolver } from '@hookform/resolvers/yup';
import { Controller, useForm } from 'react-hook-form';

import { Button } from '@/components/Button';
import { FilterSide } from '@/components/FilterSide';
import { Form } from '@/components/Form';
import { Select } from '@/components/Form/Select';

import { depreciationAssetTypeOptions } from '@/constants/dashboards/depreciationDashboard/options/depreciation-asset-type-options';
import { depreciationYearOptions } from '@/constants/dashboards/depreciationDashboard/options/depreciation-year-options';

import { depreciationDashboardFilterSchema } from '@/validations/schemas/Dashboards/depreciationDashboard-filter-schema';

import type { FilterModalProps } from '@/@types/filter-modal';
import type { DepreciationDashboardFilterForm } from '@/@types/v2/Dashboards/depreciationDashboard';

const CURRENT_YEAR = new Date().getFullYear();

const pristineFormValues: DepreciationDashboardFilterForm = {
  year: { label: String(CURRENT_YEAR), value: CURRENT_YEAR },
  assetType: { label: 'all', value: 'all' },
};

interface FilterSideDepreciationDashboardProps extends FilterModalProps<DepreciationDashboardFilterForm> {
  filtersApplied?: number;
}

export function FilterSideDepreciationDashboard({
  isOpen,
  onClose,
  handleReset,
  handleFilterChange,
  filter,
  languageGB,
  filtersApplied,
}: FilterSideDepreciationDashboardProps) {
  const text = languageGB.dashboards.depreciationDashboard.filter;
  const yearOptions = depreciationYearOptions.options(CURRENT_YEAR);
  const assetTypeOptions = depreciationAssetTypeOptions.options(languageGB);

  function toInternalValues(
    rawFilter?: DepreciationDashboardFilterForm | null
  ): DepreciationDashboardFilterForm {
    return {
      year: rawFilter?.year ?? pristineFormValues.year,
      assetType: rawFilter?.assetType ?? pristineFormValues.assetType,
    };
  }

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<DepreciationDashboardFilterForm>({
    resolver: yupResolver(depreciationDashboardFilterSchema(languageGB)),
    defaultValues: { ...pristineFormValues, ...toInternalValues(filter) },
  });

  useEffect(() => {
    if (!isOpen) return;
    reset({ ...pristineFormValues, ...toInternalValues(filter) });
  }, [isOpen]);

  function onSubmit(data: DepreciationDashboardFilterForm) {
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
                error={errors.year?.message}
                noClearable
              />
            )}
          />

          <Controller
            name="assetType"
            control={control}
            render={({ field: { name, value, onChange } }) => (
              <Select
                label={text.assetType}
                name={name}
                value={value}
                onChange={onChange}
                options={assetTypeOptions}
                error={errors.assetType?.message}
                noClearable
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
