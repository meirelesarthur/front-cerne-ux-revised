// src/pages/Operacional/Pedidos/FilterSideOrder.tsx
// -----------------------------------------------------------------------------
// Drawer de FILTRO da listagem de Pedidos (Order — Operacional / Vendas,
// F-051, 97-Esteiras/043, PED-FE-02). Contrato B canônico de filtro
// (`<Form formFilter>`, `FilterModalProps<T>` 6 props exatas, re-hidratação
// em `[isOpen]`), mirror ESTRUTURAL DIRETO de `FilterSideBudget.tsx`
// (módulo análogo direto — busca texto + 2 `SelectAsyncPaginate` + 2
// `DateInput`), acrescido do `Select` de registros por página (FLT-006,
// contrato-tela §7.4 — ausente em Budget).
//
// `product`/`client` já são `Option<string> | null` diretos (mirror
// `BudgetFilterForm`) — a conversão para querystring crua (`ListOrdersParams`)
// acontece em `Pedidos/index.tsx::toRequestFilter`, NÃO aqui (mesma separação
// de responsabilidade de `FilterSideBudget`/`FilterSideRequisition`).
//
// `pagination_quantity` (FLT-006) NÃO vira querystring própria — sincroniza
// `paginatedQuery.pageSize` (o `per_page` real da grid) via o wrapper de
// `handleFilterChange` que `Pedidos/index.tsx` passa como prop; aqui só
// carrega o `Option<number>` selecionado, mesma disciplina de
// `product`/`client`.
//
// GAP-API-FE-03 (contrato-tela §8, `[PARA ANÁLISE]`) — `product` (FLT-002)
// assume que `GET /orders` aceita o filtro por produto (`whereHas items`),
// a confirmar pelo `api-architect`; o campo é fiel ao contrato de tela
// mesmo antes da confirmação (o pior caso é o backend ignorar o parâmetro).
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

import { paginationQuantityOptions } from '@/constants/Orders/options';
import { defaultPaginationQuantity } from '@/constants/Orders/options/pagination-quantity-options';
import type { PaginationQuantity } from '@/constants/Orders/options/pagination-quantity-options';

import { listOrderClientOptions } from '@/services/v2/Orders/order-service';
import type { OrderClientOptionItem } from '@/services/v2/Orders/order-service';
import { listProductOptions } from '@/services/v2/Products/product-service';
import type { ProductOptionItem } from '@/services/v2/Products/product-service';

import type { FilterModalProps } from '@/@types/filter-modal';
import type { Option } from '@/@types/option';
import type { OrderFilterForm } from '@/@types/v2/Orders';

const DATE_FORMAT = 'yyyy-MM-dd';

// `DateInput` só aceita/devolve `string | null` (ISO) — `OrderFilterForm`
// tipa `Date | null` (mirror `FilterSideBudget`). Conversão isolada aqui,
// nas duas bordas do drawer.
function toIsoDateString(date?: Date | null): string | null {
  return date ? format(date, DATE_FORMAT) : null;
}

function fromIsoDateString(value: string | null): Date | null {
  if (!value) return null;
  const parsed = parse(value, DATE_FORMAT, new Date());
  return isValid(parsed) ? parsed : null;
}

// Forma INTERNA do form — datas em ISO (contrato de `DateInput`); o
// submit/re-hidratação converte para/de `Date` no boundary de
// `OrderFilterForm`.
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

function toInternalValues(rawFilter?: OrderFilterForm | null): FilterFormValues {
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

export function FilterSideOrder({
  isOpen,
  onClose,
  handleReset,
  handleFilterChange,
  filter,
  languageGB,
}: FilterModalProps<OrderFilterForm>) {
  const filterText = languageGB.orders.order.filter;

  const { control, register, handleSubmit, reset } = useForm<FilterFormValues>({
    mode: 'onChange',
    reValidateMode: 'onChange',
    defaultValues: {
      ...pristineFormValues,
      ...toInternalValues(filter),
    },
  });

  // Re-hidratação ao (re)abrir o drawer — deps SOMENTE [isOpen] (Contrato B,
  // mirror `FilterSideBudget.tsx`).
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

export default FilterSideOrder;
