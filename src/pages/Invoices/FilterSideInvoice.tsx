// src/pages/Invoices/FilterSideInvoice.tsx
// -----------------------------------------------------------------------------
// Drawer de FILTRO da listagem de Invoice (Doc. Fiscal/Entrada) — mirror
// Contrato B canônico de filtro (`FilterSideWarehouses.tsx`). Campos 1:1 com
// `InvoiceIndexRequest::rules()` (contrato real): `number`, `provider_id`
// (uuid, SelectAsyncPaginate), `dt_emission_from`/`dt_emission_to` (intervalo
// de datas), `product_id` (uuid, SelectAsyncPaginate), `proprietary_id`
// (uuid, SelectAsyncPaginate), `vl_total` (numérico, igualdade exata — o
// backend não faz range nesse campo).
// -----------------------------------------------------------------------------

import { useEffect } from 'react';

import { Text } from '@chakra-ui/react';
import { Controller, useForm } from 'react-hook-form';

import { Button } from '@/components/Button';
import { DateInput } from '@/components/DateInput';
import { FilterSide } from '@/components/FilterSide';
import { Form } from '@/components/Form';
import { Input } from '@/components/Form/Input';
import { NumberInput } from '@/components/Form/NumberInput';
import { SelectAsyncPaginate } from '@/components/Form/SelectAsyncPaginate';

import { listProprietaries } from '@/services/v2/CadastrosBase/Proprietary/proprietary-service';
import { listProviders } from '@/services/v2/CadastrosBase/Provider/provider-service';
import { listProducts } from '@/services/v2/Products/product-service';

import type { FilterModalProps } from '@/@types/filter-modal';
import type { Option } from '@/@types/option';
import type { InvoiceFilterForm } from '@/@types/v2/Invoices';
import type { ProductListItem } from '@/@types/v2/Products';

// Forma INTERNA do form — os selects de relacionamento trabalham com
// `Option`, o submit converte para o shape cru de `InvoiceFilterForm`.
interface FilterFormValues {
  number?: string;
  provider_id: Option<string> | null;
  dt_emission_from?: string | null;
  dt_emission_to?: string | null;
  product_id: Option<string> | null;
  proprietary_id: Option<string> | null;
  vl_total?: number | null;
}

export function FilterSideInvoice({
  isOpen,
  onClose,
  handleReset,
  handleFilterChange,
  filter,
  languageGB,
}: FilterModalProps<InvoiceFilterForm>) {
  const filterText = languageGB.invoices.invoice.filter;

  const pristineFormValues: FilterFormValues = {
    number: '',
    provider_id: null,
    dt_emission_from: null,
    dt_emission_to: null,
    product_id: null,
    proprietary_id: null,
    vl_total: null,
  };

  function toInternalValues(rawFilter?: InvoiceFilterForm | null): FilterFormValues {
    return {
      number: rawFilter?.number ?? '',
      provider_id: null,
      dt_emission_from: rawFilter?.dt_emission_from ?? null,
      dt_emission_to: rawFilter?.dt_emission_to ?? null,
      product_id: null,
      proprietary_id: null,
      vl_total: rawFilter?.vl_total ?? null,
    };
  }

  const { control, register, handleSubmit, reset } = useForm<FilterFormValues>({
    mode: 'onChange',
    reValidateMode: 'onChange',
    defaultValues: {
      ...pristineFormValues,
      ...toInternalValues(filter),
    },
  });

  function onSubmit(data: FilterFormValues) {
    handleFilterChange({
      number: data.number?.trim() || undefined,
      provider_id: data.provider_id?.value || undefined,
      dt_emission_from: data.dt_emission_from || undefined,
      dt_emission_to: data.dt_emission_to || undefined,
      product_id: data.product_id?.value || undefined,
      proprietary_id: data.proprietary_id?.value || undefined,
      vl_total: data.vl_total ?? undefined,
    });
    onClose();
  }

  function handleResetFilters() {
    handleReset();
    reset(pristineFormValues);
  }

  function handleResetFiltersOnClose() {
    reset({
      ...pristineFormValues,
      ...toInternalValues(filter),
    });
    onClose();
  }

  useEffect(() => {
    reset({
      ...pristineFormValues,
      ...toInternalValues(filter),
    });
  }, [isOpen]);

  return (
    <FilterSide isOpen={isOpen} onClose={onClose} languageGB={languageGB}>
      <Form noPadding formFilter onSubmit={handleSubmit(onSubmit)}>
        <Form.BodyFilter>
          <Text fontWeight="bold" color="brandColorText">
            {filterText.title}
          </Text>

          <Input
            label={filterText.number}
            placeholder={filterText.numberPlaceholder}
            {...register('number')}
          />

          <Controller
            name="provider_id"
            control={control}
            render={({ field }) => (
              <SelectAsyncPaginate
                name={field.name}
                label={filterText.provider}
                service={listProviders}
                mapOptions={(item: { uuid: string; name: string }) => ({
                  label: item.name,
                  value: item.uuid,
                })}
                findParams={(search: string | { search: string }) => ({
                  search: typeof search === 'string' ? search : search.search,
                })}
                value={field.value ?? undefined}
                onChange={(option: any) => field.onChange(option ?? null)}
                menuPortalTarget={document.body}
                menuPosition="fixed"
              />
            )}
          />

          <Controller
            name="proprietary_id"
            control={control}
            render={({ field }) => (
              <SelectAsyncPaginate
                name={field.name}
                label={filterText.proprietary}
                service={listProprietaries}
                mapOptions={(item: { uuid: string; name: string }) => ({
                  label: item.name,
                  value: item.uuid,
                })}
                findParams={(search: string | { search: string }) => ({
                  search: typeof search === 'string' ? search : search.search,
                })}
                value={field.value ?? undefined}
                onChange={(option: any) => field.onChange(option ?? null)}
                menuPortalTarget={document.body}
                menuPosition="fixed"
              />
            )}
          />

          <Controller
            name="product_id"
            control={control}
            render={({ field }) => (
              <SelectAsyncPaginate
                name={field.name}
                label={filterText.product}
                service={listProducts}
                mapOptions={(item: ProductListItem) => ({
                  label: item.code ? `${item.code} — ${item.description}` : item.description,
                  value: item.uuid,
                })}
                findParams={(search: string | { search: string }) => ({
                  search: typeof search === 'string' ? search : search.search,
                })}
                value={field.value ?? undefined}
                onChange={(option: any) => field.onChange(option ?? null)}
                menuPortalTarget={document.body}
                menuPosition="fixed"
              />
            )}
          />

          <Text fontSize="sm" fontWeight="medium">
            {filterText.dtEmissionFrom}
          </Text>
          <Controller
            name="dt_emission_from"
            control={control}
            render={({ field: { value, onChange } }) => (
              <DateInput value={value ?? null} onChange={onChange} />
            )}
          />

          <Text fontSize="sm" fontWeight="medium">
            {filterText.dtEmissionTo}
          </Text>
          <Controller
            name="dt_emission_to"
            control={control}
            render={({ field: { value, onChange } }) => (
              <DateInput value={value ?? null} onChange={onChange} />
            )}
          />

          <Controller
            name="vl_total"
            control={control}
            render={({ field }) => (
              <NumberInput
                name={field.name}
                label={filterText.vlTotal}
                allowDot
                decimalPlaces={2}
                value={field.value ?? null}
                onValueChange={(value) => field.onChange(value)}
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
