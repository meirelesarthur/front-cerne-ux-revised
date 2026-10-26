// src/pages/Operacional/Vendas/FilterSideSale.tsx
// -----------------------------------------------------------------------------
// Drawer de FILTRO da listagem de Vendas COMERCIAL (Sale — Operacional /
// Vendas, venda de PRODUTOS, 97-Esteiras/043, SALE-FE-COM-02). Contrato B
// canônico (`<Form formFilter>`, `FilterModalProps<T>` 6 props exatas,
// re-hidratação em `[isOpen]`), mirror ESTRUTURAL DIRETO de
// `Operacional/Pedidos/FilterSideOrder.tsx` (irmão comercial migrado — 6
// props: `search`/`product`/`client`/`start_date`/`end_date`/
// `pagination_quantity`).
//
// `client` REUSA `listOrderClientOptions` DIRETO (contrato-tela §5, sem
// endpoint próprio de Vendas) — o mesmo satélite `/clients/options` já
// consumido por Pedidos. `product` usa `listProductOptions` (paginado).
// `start_date`/`end_date` incidem sobre `dt_shipping` (contrato-tela §7.2).
//
// `pagination_quantity` (FL001) NÃO vira querystring própria — sincroniza
// `paginatedQuery.pageSize` via o wrapper `handleFilterChangeWithPageSize`
// que `Vendas/index.tsx` passa como prop (mesma disciplina de Pedidos).
// -----------------------------------------------------------------------------

import { useEffect } from 'react';

import { Text } from '@chakra-ui/react';
import { format, isValid, parse } from 'date-fns';
import { Controller, useForm } from 'react-hook-form';

import { Button } from '@/components/Button';
import { DateInput } from '@/components/DateInput';
import { FilterSide } from '@/components/FilterSide';
import { Form } from '@/components/Form';
import { Input } from '@/components/Form/Input';
import { Select } from '@/components/Form/Select';
import { SelectAsyncPaginate } from '@/components/Form/SelectAsyncPaginate';

import { defaultPaginationQuantity, paginationQuantityOptions } from '@/constants/Sales/options';
import type { PaginationQuantity } from '@/constants/Sales/options';

import { listOrderClientOptions } from '@/services/v2/Orders/order-service';
import type { OrderClientOptionItem } from '@/services/v2/Orders/order-service';
import { listProductOptions } from '@/services/v2/Products/product-service';
import type { ProductOptionItem } from '@/services/v2/Products/product-service';

import type { FilterModalProps } from '@/@types/filter-modal';
import type { Option } from '@/@types/option';
import type { SaleFilterForm } from '@/@types/v2/Sales';

const DATE_FORMAT = 'yyyy-MM-dd';

// `DateInput` só aceita/devolve `string | null` (ISO) — `SaleFilterForm`
// tipa `Date | null` (mirror `FilterSideOrder`). Conversão isolada aqui, nas
// duas bordas do drawer.
function toIsoDateString(date?: Date | null): string | null {
  return date ? format(date, DATE_FORMAT) : null;
}

function fromIsoDateString(value: string | null): Date | null {
  if (!value) return null;
  const parsed = parse(value, DATE_FORMAT, new Date());
  return isValid(parsed) ? parsed : null;
}

// Forma INTERNA do form — datas em ISO (contrato de `DateInput`); o
// submit/re-hidratação converte para/de `Date` no boundary de `SaleFilterForm`.
interface FilterFormValues {
  search: string;
  product: Option<string> | null;
  client: Option<string> | null;
  start_date: string | null;
  end_date: string | null;
  pagination_quantity: Option<PaginationQuantity> | null;
}

const defaultPaginationOption = paginationQuantityOptions.getOption(defaultPaginationQuantity);

const pristineFormValues: FilterFormValues = {
  search: '',
  product: null,
  client: null,
  start_date: null,
  end_date: null,
  pagination_quantity: defaultPaginationOption,
};

function toInternalValues(rawFilter?: SaleFilterForm | null): FilterFormValues {
  return {
    search: rawFilter?.search ?? '',
    product: rawFilter?.product ?? null,
    client: rawFilter?.client ?? null,
    start_date: toIsoDateString(rawFilter?.start_date),
    end_date: toIsoDateString(rawFilter?.end_date),
    pagination_quantity:
      (rawFilter?.pagination_quantity as Option<PaginationQuantity> | null) ??
      defaultPaginationOption,
  };
}

function mapProductOption(item: ProductOptionItem) {
  return { label: `${item.code} — ${item.description}`, value: item.uuid };
}

function mapClientOption(item: OrderClientOptionItem) {
  return { label: item.name ?? '—', value: item.uuid };
}

const findParamsFromSearch = (search: string | { search: string }) => ({
  search: typeof search === 'string' ? search : search.search,
});

export function FilterSideSale({
  isOpen,
  onClose,
  handleReset,
  handleFilterChange,
  filter,
  languageGB,
}: FilterModalProps<SaleFilterForm>) {
  const filterText = languageGB.sales.sale.filter;

  const { control, register, handleSubmit, reset } = useForm<FilterFormValues>({
    mode: 'onChange',
    reValidateMode: 'onChange',
    defaultValues: {
      ...pristineFormValues,
      ...toInternalValues(filter),
    },
  });

  // Re-hidratação ao (re)abrir o drawer — deps SOMENTE [isOpen] (Contrato B,
  // mirror `FilterSideOrder.tsx`).
  useEffect(() => {
    reset({ ...pristineFormValues, ...toInternalValues(filter) });
  }, [isOpen]);

  function onSubmit(data: FilterFormValues) {
    handleFilterChange({
      search: data.search?.trim() || undefined,
      product: data.product ?? undefined,
      client: data.client ?? undefined,
      start_date: fromIsoDateString(data.start_date),
      end_date: fromIsoDateString(data.end_date),
      pagination_quantity: data.pagination_quantity ?? defaultPaginationOption,
    });
    onClose();
  }

  // Limpar NÃO fecha o drawer (DEC-012/contrato-tela §7.2, A002/A003).
  function handleResetFilters() {
    handleReset();
    reset(pristineFormValues);
  }

  function handleResetFiltersOnClose() {
    reset({ ...pristineFormValues, ...toInternalValues(filter) });
    onClose();
  }

  return (
    <FilterSide isOpen={isOpen} onClose={onClose} languageGB={languageGB}>
      <Form noPadding formFilter onSubmit={handleSubmit(onSubmit)}>
        <Form.BodyFilter>
          <Text fontWeight="bold" color="brandColorText">
            {filterText.title}
          </Text>

          <Input
            label={filterText.search}
            placeholder={filterText.searchPlaceholder}
            {...register('search')}
          />

          <Controller
            name="product"
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
            name="client"
            control={control}
            render={({ field: { name, value, onChange } }) => (
              <SelectAsyncPaginate
                name={name}
                label={filterText.client}
                placeholder={filterText.clientPlaceholder}
                service={listOrderClientOptions}
                mapOptions={mapClientOption}
                findParams={findParamsFromSearch}
                value={value ?? null}
                onChange={(option: any) => onChange(option ?? null)}
                menuPortalTarget={document.body}
                menuPosition="fixed"
              />
            )}
          />

          <Controller
            name="start_date"
            control={control}
            render={({ field: { value, onChange } }) => (
              <DateInput
                value={value ?? null}
                onChange={onChange}
                placeholder={filterText.startDate}
              />
            )}
          />

          <Controller
            name="end_date"
            control={control}
            render={({ field: { value, onChange } }) => (
              <DateInput
                value={value ?? null}
                onChange={onChange}
                placeholder={filterText.endDate}
              />
            )}
          />

          <Controller
            name="pagination_quantity"
            control={control}
            render={({ field: { name, value, onChange } }) => (
              <Select
                name={name}
                label={filterText.paginationQuantity}
                noClearable
                value={value ?? defaultPaginationOption}
                onChange={(option: Option<PaginationQuantity> | null) =>
                  onChange(option ?? defaultPaginationOption)
                }
                options={paginationQuantityOptions.options()}
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

export default FilterSideSale;
