// src/pages/Administrativo/Requisition/FilterSideRequisition.tsx
// -----------------------------------------------------------------------------
// Drawer de FILTRO da listagem de Requisição/Saída (Requisition — Estoque,
// 97-Esteiras/002, Tarefa 04). Mirror EXATO de `FilterSideFarmTransfer.tsx`
// — Contrato B canônico de filtro (`<Form formFilter>`, `FilterModalProps<T>`
// 6 props exatas, re-hidratação em `[isOpen]`), acrescido do filtro
// `cost_center_uuid` (mirror `RequisitionFilterData`, `FLT-01..05`).
//
// A conversão `Option` → querystring crua (`ListRequisitionsParams`)
// acontece em `Requisition/index.tsx::toRequestFilter`, NÃO aqui.
// -----------------------------------------------------------------------------

import { useEffect } from 'react';

import { Text } from '@chakra-ui/react';
import { Controller, useForm } from 'react-hook-form';

import { Button } from '@/components/Button';
import { DateInput } from '@/components/DateInput';
import { FilterSide } from '@/components/FilterSide';
import { Form } from '@/components/Form';
import { SelectAsyncPaginate } from '@/components/Form/SelectAsyncPaginate';

import { listCostCenterOptions } from '@/services/v2/CostCenters/cost-center-service';
import { listProductOptions } from '@/services/v2/Products/product-service';
import type { ProductOptionItem } from '@/services/v2/Products/product-service';
import { listWarehouses } from '@/services/v2/Warehouses/warehouse-service';

import type { FilterModalProps } from '@/@types/filter-modal';
import type { CostCenterRef } from '@/@types/v2/CostCenters';
import type { RequisitionFilterForm } from '@/@types/v2/Requisitions';
import type { WarehouseListItem } from '@/@types/v2/Warehouses';

function mapProductOption(item: ProductOptionItem) {
  return { label: `${item.code} — ${item.description}`, value: item.uuid };
}

function mapWarehouseOption(item: WarehouseListItem) {
  return { label: `${item.initials} — ${item.description}`, value: item.uuid };
}

function mapCostCenterOption(item: CostCenterRef) {
  return { label: `${item.code} — ${item.description}`, value: item.uuid };
}

const findParamsFromSearch = (search: string | { search: string }) => ({
  search: typeof search === 'string' ? search : search.search,
});

const findWarehouseFilterParamsFromSearch = (search: string | { search: string }) => ({
  search: typeof search === 'string' ? search : search.search,
  is_active: 'true' as const,
});

const pristineFormValues: RequisitionFilterForm = {
  product_uuid: null,
  warehouse_uuid: null,
  cost_center_uuid: null,
  date_from: '',
  date_to: '',
};

export function FilterSideRequisition({
  isOpen,
  onClose,
  handleReset,
  handleFilterChange,
  filter,
  languageGB,
}: FilterModalProps<RequisitionFilterForm>) {
  const filterText = languageGB.requisitions.requisition.filter;

  const { control, handleSubmit, reset, watch } = useForm<RequisitionFilterForm>({
    mode: 'onChange',
    reValidateMode: 'onChange',
    defaultValues: {
      ...pristineFormValues,
      ...filter,
    },
  });

  // Re-hidratação ao (re)abrir o drawer — deps SOMENTE [isOpen] (mesma
  // disciplina dos irmãos).
  useEffect(() => {
    if (!isOpen) return;
    reset({ ...pristineFormValues, ...filter });
  }, [isOpen]);

  const watchedDateFrom = watch('date_from');
  const watchedDateTo = watch('date_to');

  function onSubmit(data: RequisitionFilterForm) {
    handleFilterChange({
      product_uuid: data.product_uuid ?? undefined,
      warehouse_uuid: data.warehouse_uuid ?? undefined,
      cost_center_uuid: data.cost_center_uuid ?? undefined,
      date_from: data.date_from || undefined,
      date_to: data.date_to || undefined,
    });
    onClose();
  }

  function handleResetFilters() {
    handleReset();
    reset(pristineFormValues);
  }

  function handleResetFiltersOnClose() {
    reset({ ...pristineFormValues, ...filter });
    onClose();
  }

  return (
    <FilterSide isOpen={isOpen} onClose={onClose} languageGB={languageGB}>
      <Form noPadding formFilter onSubmit={handleSubmit(onSubmit)}>
        <Form.BodyFilter>
          <Text fontWeight="bold" color="brandColorText">
            {filterText.title}
          </Text>

          <Controller
            name="product_uuid"
            control={control}
            render={({ field: { name, value, onChange } }) => (
              <SelectAsyncPaginate
                name={name}
                label={filterText.product}
                placeholder={filterText.productPlaceholder}
                service={listProductOptions}
                mapOptions={mapProductOption}
                findParams={findParamsFromSearch}
                value={value ?? null}
                onChange={(option: any) => onChange(option ?? null)}
                menuPortalTarget={document.body}
                menuPosition="fixed"
              />
            )}
          />

          <Controller
            name="warehouse_uuid"
            control={control}
            render={({ field: { name, value, onChange } }) => (
              <SelectAsyncPaginate
                name={name}
                label={filterText.warehouse}
                placeholder={filterText.warehousePlaceholder}
                service={listWarehouses}
                mapOptions={mapWarehouseOption}
                findParams={findWarehouseFilterParamsFromSearch}
                value={value ?? null}
                onChange={(option: any) => onChange(option ?? null)}
                menuPortalTarget={document.body}
                menuPosition="fixed"
              />
            )}
          />

          <Controller
            name="cost_center_uuid"
            control={control}
            render={({ field: { name, value, onChange } }) => (
              <SelectAsyncPaginate
                name={name}
                label={filterText.costCenter}
                placeholder={filterText.costCenterPlaceholder}
                service={listCostCenterOptions}
                mapOptions={mapCostCenterOption}
                findParams={findParamsFromSearch}
                value={value ?? null}
                onChange={(option: any) => onChange(option ?? null)}
                menuPortalTarget={document.body}
                menuPosition="fixed"
              />
            )}
          />

          <Controller
            name="date_from"
            control={control}
            render={({ field }) => (
              <DateInput
                value={field.value ?? null}
                onChange={(v) => field.onChange(v ?? '')}
                label={filterText.dateFrom}
                maxDate={watchedDateTo ? new Date(`${watchedDateTo}T00:00:00`) : undefined}
              />
            )}
          />
          <Controller
            name="date_to"
            control={control}
            render={({ field }) => (
              <DateInput
                value={field.value ?? null}
                onChange={(v) => field.onChange(v ?? '')}
                label={filterText.dateTo}
                minDate={watchedDateFrom ? new Date(`${watchedDateFrom}T00:00:00`) : undefined}
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

export default FilterSideRequisition;
