// src/pages/Administrativo/WarehouseTransfer/FilterSideWarehouseTransfer.tsx
// -----------------------------------------------------------------------------
// Drawer de FILTRO da listagem de Trans. Armazém (WarehouseTransfer — Estoque,
// TASK-WT-FE-02). Contrato B canônico de filtro (mirror `FilterSideFoodBeat.tsx`)
// — `<Form formFilter>` (`Form.BodyFilter`/`Form.FooterFilter`), NUNCA
// `<VStack as="form">` cru.
//
// `FilterModalProps<WarehouseTransferFilterForm>` — 6 props exatas
// (`TASK-WT-FE-01`). `WarehouseTransferFilterForm` (`@/@types/v2/WarehouseTransfers`,
// já travado pela fundação `TASK-WT-FE-01`) já é `{ product_uuid?: Option|null,
// warehouse_uuid?: Option|null, date_from?, date_to? }` — o form RHF interno USA
// o próprio `WarehouseTransferFilterForm` como tipo, sem tipo intermediário nem
// companheiro `{campo}_label` (mesmo racional de `FilterSideFoodBeat.tsx`, o
// próprio `Option` completo — label+value — já vem persistido em
// `paginatedQuery.filter`).
//
// ⚠️ `warehouse_uuid` refere-se ao ARMAZÉM DESTINO (achado de leitura direta,
// ver `@/@types/v2/WarehouseTransfers`) — rótulo exibido é "Armazém Destino",
// nunca "Armazém" genérico.
//
// A conversão `Option` → querystring crua (`ListWarehouseTransfersParams`)
// acontece em `WarehouseTransfer/index.tsx::toRequestFilter`, NÃO aqui.
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
import type { WarehouseListItem } from '@/@types/v2/Warehouses';
import type { WarehouseTransferFilterForm } from '@/@types/v2/WarehouseTransfers';

function mapProductOption(item: ProductOptionItem) {
  return { label: `${item.code} — ${item.description}`, value: item.uuid };
}

function mapWarehouseOption(item: WarehouseListItem) {
  return { label: `${item.initials} — ${item.description}`, value: item.uuid };
}

const findParamsFromSearch = (search: string | { search: string }) => ({
  search: typeof search === 'string' ? search : search.search,
});

// GAP — fix cirúrgico TASK-WT-FE-02 (fidelidade ao legado
// `WarehouseTransferController.php:38-40`, que lista TODOS os armazéns
// ATIVOS da fazenda, sem filtro de `type`). Função DEDICADA a este campo —
// NÃO reaproveita/alterar `findParamsFromSearch` acima, que também serve o
// filtro de Produto (helper compartilhado, fora de escopo desta correção).
const findWarehouseFilterParamsFromSearch = (search: string | { search: string }) => ({
  search: typeof search === 'string' ? search : search.search,
  is_active: 'true' as const,
});

const pristineFormValues: WarehouseTransferFilterForm = {
  product_uuid: null,
  warehouse_uuid: null,
  date_from: '',
  date_to: '',
};

export function FilterSideWarehouseTransfer({
  isOpen,
  onClose,
  handleReset,
  handleFilterChange,
  filter,
  languageGB,
}: FilterModalProps<WarehouseTransferFilterForm>) {
  const filterText = languageGB.warehouseTransfers.warehouseTransfer.filter;

  const { control, handleSubmit, reset, watch } = useForm<WarehouseTransferFilterForm>({
    mode: 'onChange',
    reValidateMode: 'onChange',
    defaultValues: {
      ...pristineFormValues,
      ...filter,
    },
  });

  // Re-hidratação ao (re)abrir o drawer — deps SOMENTE [isOpen] (reagir a
  // `filter` clobaria o que o usuário está digitando com o drawer aberto,
  // mesma disciplina de `FilterSideFoodBeat.tsx`).
  useEffect(() => {
    if (!isOpen) return;
    reset({ ...pristineFormValues, ...filter });
  }, [isOpen]);

  const watchedDateFrom = watch('date_from');
  const watchedDateTo = watch('date_to');

  function onSubmit(data: WarehouseTransferFilterForm) {
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

export default FilterSideWarehouseTransfer;
