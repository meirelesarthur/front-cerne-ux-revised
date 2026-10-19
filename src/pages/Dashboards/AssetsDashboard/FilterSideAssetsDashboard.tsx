// src/pages/Dashboards/AssetsDashboard/FilterSideAssetsDashboard.tsx
// Drawer de filtro da dashboard Ativos (execução 046, TASK-AT-FE-04) —
// Contrato B canônico (`FilterModalProps<T>`), 4 campos: Período, Família
// (multi), Status (legado), Proprietário Gestor. `filter` é a forma
// Option-based (`AssetsDashboardFilterForm`) — mesmo racional de
// `FeedlotDashboardFilterForm` (evita rótulo perdido no reabrir do drawer,
// já que Família e Proprietário são `SelectAsyncPaginate`).

import { useEffect } from 'react';

import { Text } from '@chakra-ui/react';
import { yupResolver } from '@hookform/resolvers/yup';
import { Controller, useForm } from 'react-hook-form';

import { Button } from '@/components/Button';
import { FilterSide } from '@/components/FilterSide';
import { Form } from '@/components/Form';
import { Select } from '@/components/Form/Select';
import { SelectAsyncPaginate } from '@/components/Form/SelectAsyncPaginate';

import { assetsOpStatusOptions } from '@/constants/dashboards/assetsDashboard/options/assets-op-status-options';
import { assetsPeriodOptions } from '@/constants/dashboards/assetsDashboard/options/assets-period-options';

import { assetsDashboardFilterSchema } from '@/validations/schemas/Dashboards/assetsDashboard-filter-schema';

import {
  listFamilyEquipmentOptions,
  type ListFamilyEquipmentOptionsParams,
} from '@/services/v2/BaseRegistrations/familyEquipment-service';
import {
  listProprietaryOptions,
  type ProprietaryOption,
} from '@/services/v2/CadastrosBase/Proprietary/proprietary-service';

import type { FilterModalProps } from '@/@types/filter-modal';
import type { PaginationQueryParams } from '@/@types/pagination';
import type { ResponsePagination } from '@/@types/response-api';
import type { FamilyEquipmentOption } from '@/@types/v2/BaseRegistrations/familyEquipment';
import type { AssetsDashboardFilterForm } from '@/@types/v2/Dashboards/assetsDashboard';

const pristineFormValues: AssetsDashboardFilterForm = {
  months: null,
  families: [],
  status: null,
  proprietary: null,
};

interface FilterSideAssetsDashboardProps extends FilterModalProps<AssetsDashboardFilterForm> {
  filtersApplied?: number;
}

interface ListProprietaryOptionsParams extends PaginationQueryParams {
  search?: string;
}

/**
 * Adapta `listProprietaryOptions` (array direto, sem paginação real — DA-PY,
 * fachada mínima já existente) ao contrato `service` de `SelectAsyncPaginate`
 * (`ResponsePagination<T>`) — mesma técnica de `listFamilyEquipmentOptions`.
 * @param {ListProprietaryOptionsParams} params - Parâmetros de busca (`search`) vindos do `SelectAsyncPaginate`.
 * @return {Promise<ResponsePagination<ProprietaryOption[]>>} Envelope paginado de página única.
 */
async function listProprietaryOptionsPaginated(
  params: ListProprietaryOptionsParams
): Promise<ResponsePagination<ProprietaryOption[]>> {
  const items = await listProprietaryOptions(params.search);
  return {
    success: true,
    data: {
      items,
      pagination: {
        total: items.length,
        count: items.length,
        per_page: items.length || 1,
        current_page: 1,
        total_pages: 1,
      },
    },
  };
}

export function FilterSideAssetsDashboard({
  isOpen,
  onClose,
  handleReset,
  handleFilterChange,
  filter,
  languageGB,
  filtersApplied,
}: FilterSideAssetsDashboardProps) {
  const text = languageGB.dashboards.assetsDashboard.filter;
  const periodOptions = assetsPeriodOptions.options(languageGB);
  const statusOptions = assetsOpStatusOptions.options(languageGB);

  function toInternalValues(
    rawFilter?: AssetsDashboardFilterForm | null
  ): AssetsDashboardFilterForm {
    return {
      months: rawFilter?.months ?? null,
      families: rawFilter?.families ?? [],
      status: rawFilter?.status ?? null,
      proprietary: rawFilter?.proprietary ?? null,
    };
  }

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<AssetsDashboardFilterForm>({
    resolver: yupResolver(assetsDashboardFilterSchema(languageGB)),
    defaultValues: { ...pristineFormValues, ...toInternalValues(filter) },
  });

  useEffect(() => {
    if (!isOpen) return;
    reset({ ...pristineFormValues, ...toInternalValues(filter) });
  }, [isOpen]);

  function onSubmit(data: AssetsDashboardFilterForm) {
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
            name="months"
            control={control}
            render={({ field: { name, value, onChange } }) => (
              <Select
                label={text.period}
                name={name}
                value={value}
                onChange={onChange}
                options={periodOptions}
                error={errors.months?.message}
                noClearable
              />
            )}
          />

          <Controller
            name="families"
            control={control}
            render={({ field }) => (
              <SelectAsyncPaginate
                name={field.name}
                label={text.families}
                isMulti
                closeMenuOnSelect={false}
                service={(params: ListFamilyEquipmentOptionsParams) =>
                  listFamilyEquipmentOptions(params)
                }
                mapOptions={(item: FamilyEquipmentOption) => ({
                  label: item.description,
                  value: item.uuid,
                })}
                findParams={(search: string | { search: string }) => ({
                  search: typeof search === 'string' ? search : search.search,
                })}
                value={field.value}
                onChange={(options: any) => field.onChange(options ?? [])}
                menuPortalTarget={document.body}
                menuPosition="fixed"
              />
            )}
          />

          <Controller
            name="status"
            control={control}
            render={({ field: { name, value, onChange } }) => (
              <Select
                label={text.status}
                placeholder={text.statusAllPlaceholder}
                name={name}
                value={value}
                onChange={onChange}
                options={statusOptions}
              />
            )}
          />

          <Controller
            name="proprietary"
            control={control}
            render={({ field }) => (
              <SelectAsyncPaginate
                name={field.name}
                label={text.proprietary}
                service={listProprietaryOptionsPaginated}
                mapOptions={(item: ProprietaryOption) => ({ label: item.label, value: item.uuid })}
                findParams={(search: string | { search: string }) => ({
                  search: typeof search === 'string' ? search : search.search,
                })}
                value={field.value ?? null}
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
