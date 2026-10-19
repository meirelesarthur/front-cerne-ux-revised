// src/pages/Dashboards/RainfallDashboard/FilterSideRainfallDashboard.tsx
// Drawer de filtro da dashboard Pluviometria (execução 048, TASK-01-FE) —
// Contrato B canônico (`FilterModalProps<T>`), 2 campos: Período e Área
// (`CONTRATO-API-048-01 §2` — só `area_uuid`/`period`; a fazenda é sempre a
// corrente, resolvida pelo backend via `X-Farm-Id`, nunca um Select nesta
// tela). `filter` é a forma Option-based (evita rótulo perdido no reabrir
// do drawer, já que Área é `SelectAsyncPaginate`).

import { useEffect } from 'react';

import { Text } from '@chakra-ui/react';
import { yupResolver } from '@hookform/resolvers/yup';
import { Controller, useForm } from 'react-hook-form';

import { Button } from '@/components/Button';
import { FilterSide } from '@/components/FilterSide';
import { Form } from '@/components/Form';
import { Select } from '@/components/Form/Select';
import { SelectAsyncPaginate } from '@/components/Form/SelectAsyncPaginate';

import { useAuth } from '@/hooks/useAuth';

import { rainfallPeriodOptions } from '@/constants/dashboards/rainfallDashboard/options/rainfall-period-options';

import { rainfallDashboardFilterSchema } from '@/validations/schemas/Dashboards/rainfallDashboard-filter-schema';

import { listAreas } from '@/services/v2/BaseRegistrations/areas-service';

import type { FilterModalProps } from '@/@types/filter-modal';
import type { PaginationQueryParams } from '@/@types/pagination';
import type { AreaListItem } from '@/@types/v2/BaseRegistrations/areas';
import type { RainfallDashboardFilterForm } from '@/@types/v2/Dashboards/rainfallDashboard';

const pristineFormValues: RainfallDashboardFilterForm = {
  area: null,
  period: { label: '12m', value: '12m' },
};

interface FilterSideRainfallDashboardProps extends FilterModalProps<RainfallDashboardFilterForm> {
  filtersApplied?: number;
}

interface ListRainfallAreaOptionsParams extends PaginationQueryParams {
  search?: string;
}

export function FilterSideRainfallDashboard({
  isOpen,
  onClose,
  handleReset,
  handleFilterChange,
  filter,
  languageGB,
  filtersApplied,
}: FilterSideRainfallDashboardProps) {
  const { activeFarmUuid } = useAuth();
  const text = languageGB.dashboards.rainfallDashboard.filter;
  const periodOptions = rainfallPeriodOptions.options(languageGB);

  function listRainfallAreaOptions(params: ListRainfallAreaOptionsParams) {
    return listAreas({
      farm_uuid: activeFarmUuid ?? '',
      per_page: params.per_page,
      page: params.page,
    });
  }

  function toInternalValues(
    rawFilter?: RainfallDashboardFilterForm | null
  ): RainfallDashboardFilterForm {
    return {
      area: rawFilter?.area ?? null,
      period: rawFilter?.period ?? pristineFormValues.period,
    };
  }

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<RainfallDashboardFilterForm>({
    resolver: yupResolver(rainfallDashboardFilterSchema(languageGB)),
    defaultValues: { ...pristineFormValues, ...toInternalValues(filter) },
  });

  useEffect(() => {
    if (!isOpen) return;
    reset({ ...pristineFormValues, ...toInternalValues(filter) });
  }, [isOpen]);

  function onSubmit(data: RainfallDashboardFilterForm) {
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
            name="period"
            control={control}
            render={({ field: { name, value, onChange } }) => (
              <Select
                label={text.period}
                name={name}
                value={value}
                onChange={onChange}
                options={periodOptions}
                error={errors.period?.message}
                noClearable
              />
            )}
          />

          <Controller
            name="area"
            control={control}
            render={({ field }) => (
              <SelectAsyncPaginate
                name={field.name}
                label={text.area}
                placeholder={text.areaAllPlaceholder}
                service={listRainfallAreaOptions}
                mapOptions={(item: AreaListItem) => ({ label: item.description, value: item.uuid })}
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
