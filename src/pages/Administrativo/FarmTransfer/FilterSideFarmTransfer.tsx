// src/pages/Administrativo/FarmTransfer/FilterSideFarmTransfer.tsx
// -----------------------------------------------------------------------------
// Drawer de FILTRO da listagem de Trans. Fazendas (FarmTransfer — Estoque,
// Tarefa 01). Mirror EXATO de `FilterSideWarehouseTransfer.tsx` — Contrato B
// canônico de filtro (`<Form formFilter>`, `FilterModalProps<T>` 6 props
// exatas, re-hidratação em `[isOpen]`).
//
// ⚠️ `warehouse_uuid` refere-se ao ARMAZÉM DESTINO (confirmado por leitura
// direta de `StockMovementRepository::listPaginatedBetweenFarms()`, ver
// `@/@types/v2/FarmTransfers`) — rótulo exibido é "Armazém Destino", mesma
// convenção do irmão.
//
// A conversão `Option` → querystring crua (`ListFarmTransfersParams`)
// acontece em `FarmTransfer/index.tsx::toRequestFilter`, NÃO aqui.
// -----------------------------------------------------------------------------

import { useEffect } from 'react';

import { Text } from '@chakra-ui/react';
import { Controller, useForm } from 'react-hook-form';

import { Button } from '@/components/Button';
import { DateInput } from '@/components/DateInput';
import { FilterSide } from '@/components/FilterSide';
import { Form } from '@/components/Form';
import { SelectAsyncPaginate } from '@/components/Form/SelectAsyncPaginate';

import { listProductOptions } from '@/services/v2/Products/product-service';
import type { ProductOptionItem } from '@/services/v2/Products/product-service';
import { listWarehouses } from '@/services/v2/Warehouses/warehouse-service';

import type { FilterModalProps } from '@/@types/filter-modal';
import type { FarmTransferFilterForm } from '@/@types/v2/FarmTransfers';
import type { WarehouseListItem } from '@/@types/v2/Warehouses';

function mapProductOption(item: ProductOptionItem) {
  return { label: `${item.code} — ${item.description}`, value: item.uuid };
}

function mapWarehouseOption(item: WarehouseListItem) {
  return { label: `${item.initials} — ${item.description}`, value: item.uuid };
}

const findParamsFromSearch = (search: string | { search: string }) => ({
  search: typeof search === 'string' ? search : search.search,
});

// Mirror `findWarehouseFilterParamsFromSearch` de `FilterSideWarehouseTransfer.tsx`
// — lista TODOS os armazéns ATIVOS (sem filtro de `type`), mesma fidelidade
// ao legado (o backend do irmão restringe por `is_active`, comportamento
// idêntico aqui já que o filtro é o MESMO endpoint `listWarehouses`).
const findWarehouseFilterParamsFromSearch = (search: string | { search: string }) => ({
  search: typeof search === 'string' ? search : search.search,
  is_active: 'true' as const,
});

const pristineFormValues: FarmTransferFilterForm = {
  product_uuid: null,
  warehouse_uuid: null,
  date_from: '',
  date_to: '',
};

export function FilterSideFarmTransfer({
  isOpen,
  onClose,
  handleReset,
  handleFilterChange,
  filter,
  languageGB,
}: FilterModalProps<FarmTransferFilterForm>) {
  const filterText = languageGB.farmTransfers.farmTransfer.filter;

  const { control, handleSubmit, reset, watch } = useForm<FarmTransferFilterForm>({
    mode: 'onChange',
    reValidateMode: 'onChange',
    defaultValues: {
      ...pristineFormValues,
      ...filter,
    },
  });

  // Re-hidratação ao (re)abrir o drawer — deps SOMENTE [isOpen] (mesma
  // disciplina do irmão).
  useEffect(() => {
    if (!isOpen) return;
    reset({ ...pristineFormValues, ...filter });
  }, [isOpen]);

  const watchedDateFrom = watch('date_from');
  const watchedDateTo = watch('date_to');

  function onSubmit(data: FarmTransferFilterForm) {
    handleFilterChange({
      product_uuid: data.product_uuid ?? undefined,
      warehouse_uuid: data.warehouse_uuid ?? undefined,
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
                label={filterText.destinationWarehouse}
                placeholder={filterText.destinationWarehousePlaceholder}
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

export default FilterSideFarmTransfer;
