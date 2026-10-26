// src/pages/Administrativo/SaldoEstoque/FilterSideSaldoEstoque.tsx
// -----------------------------------------------------------------------------
// Drawer de FILTRO da listagem de SALDO DE ESTOQUE (Stock, TASK-STK-FE-01) —
// casca `<FilterSide>` + `<Form formFilter>`/`<Form.BodyFilter>`/
// `<Form.FooterFilter>` (NUNCA `<VStack as="form">` cru), mirror mecânico de
// `CadastrosBase/EstoqueInicial/FilterSideEstoqueInicial.tsx` — único
// precedente real de filtro por FK dupla (`product_uuid`+`warehouse_uuid`)
// no projeto.
//
// Contrato de tela §3.1 (ordem: search → product → warehouse). Diferente de
// `FilterSideEstoqueInicial.tsx`: aqui `products/options` JÁ EXISTE
// (`listProductOptions`, `product-service.ts`) — usado direto, sem o
// interim via `listProducts` paginado completo.
//
// Ambos os Selects PORTALIZADOS (`menuPortalTarget={document.body}`,
// `menuPosition="fixed"`) — armadilha catalogada do projeto: sem isso, o
// menu quebra dentro do drawer de filtro. Persistido como par uuid+label
// (`StockFilterForm.product_label`/`.warehouse_label`) para re-hidratar o
// drawer ao reabrir.
// -----------------------------------------------------------------------------

import { useEffect } from 'react';

import { Text } from '@chakra-ui/react';
import { Controller, useForm } from 'react-hook-form';

import { Button } from '@/components/Button';
import { FilterSide } from '@/components/FilterSide';
import { Form } from '@/components/Form';
import { Input } from '@/components/Form/Input';
import { SelectAsyncPaginate } from '@/components/Form/SelectAsyncPaginate';

import { listProductOptions } from '@/services/v2/Products/product-service';
import type { ProductOptionItem } from '@/services/v2/Products/product-service';
import { listWarehouseOptions } from '@/services/v2/Warehouses/warehouse-service';

import type { FilterModalProps } from '@/@types/filter-modal';
import type { Option } from '@/@types/option';
import type { StockFilterForm } from '@/@types/v2/Stocks';
import type { WarehouseOption } from '@/@types/v2/Warehouses';

// Forma INTERNA do form — os 2 Selects trabalham com `Option`, o submit
// converte para `StockFilterForm` (strings cruas + `*_label` companion),
// mesmo padrão de `FilterSideEstoqueInicial.tsx`.
interface FilterFormValues {
  search: string;
  product_uuid: Option<string> | null;
  warehouse_uuid: Option<string> | null;
}

const pristineFormValues: FilterFormValues = {
  search: '',
  product_uuid: null,
  warehouse_uuid: null,
};

export function FilterSideSaldoEstoque({
  isOpen,
  onClose,
  handleReset,
  handleFilterChange,
  filter,
  languageGB,
}: FilterModalProps<StockFilterForm>) {
  const text = languageGB.stocks.stock.filter;

  const { control, register, handleSubmit, reset } = useForm<FilterFormValues>({
    defaultValues: pristineFormValues,
  });

  function toInternalValues(rawFilter?: StockFilterForm | null): FilterFormValues {
    return {
      search: rawFilter?.search ?? '',
      product_uuid: rawFilter?.product_uuid
        ? {
            value: rawFilter.product_uuid,
            label: rawFilter.product_label ?? rawFilter.product_uuid,
          }
        : null,
      warehouse_uuid: rawFilter?.warehouse_uuid
        ? {
            value: rawFilter.warehouse_uuid,
            label: rawFilter.warehouse_label ?? rawFilter.warehouse_uuid,
          }
        : null,
    };
  }

  // Re-hidratação ao (re)abrir o drawer — deps SOMENTE [isOpen] (reagir a
  // `filter` clobaria o que o usuário está digitando com o drawer aberto,
  // mesma disciplina de `FilterSideEstoqueInicial.tsx`).
  useEffect(() => {
    if (!isOpen) return;
    reset({ ...pristineFormValues, ...toInternalValues(filter) });
  }, [isOpen]);

  function onSubmit(data: FilterFormValues) {
    const applied: StockFilterForm = {
      search: data.search?.trim() || undefined,
      product_uuid: data.product_uuid?.value || undefined,
      product_label: data.product_uuid?.label,
      warehouse_uuid: data.warehouse_uuid?.value || undefined,
      warehouse_label: data.warehouse_uuid?.label,
    };
    handleFilterChange(applied);
    onClose();
  }

  function handleResetFilters() {
    handleReset();
    reset(pristineFormValues);
  }

  return (
    <FilterSide isOpen={isOpen} onClose={onClose} languageGB={languageGB}>
      <Form noPadding formFilter onSubmit={handleSubmit(onSubmit)}>
        <Form.BodyFilter>
          <Text fontWeight="bold" color="brandColorText">
            {text.title}
          </Text>

          <Input label={text.search} placeholder={text.searchPlaceholder} {...register('search')} />

          <Controller
            name="product_uuid"
            control={control}
            render={({ field }) => (
              <SelectAsyncPaginate
                name={field.name}
                label={text.product}
                placeholder={text.productPlaceholder}
                service={listProductOptions}
                mapOptions={(item: ProductOptionItem) => ({
                  label: `${item.code} — ${item.description}`,
                  value: item.uuid,
                })}
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

          <Controller
            name="warehouse_uuid"
            control={control}
            render={({ field }) => (
              <SelectAsyncPaginate
                name={field.name}
                label={text.warehouse}
                placeholder={text.warehousePlaceholder}
                service={listWarehouseOptions}
                mapOptions={(item: WarehouseOption) => ({
                  label: `${item.initials} — ${item.description}`,
                  value: item.uuid,
                })}
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
            onClick={onClose}
            type="button"
          />
          <Button title={languageGB.defaltStrings.applyFilters} type="submit" />
        </Form.FooterFilter>
      </Form>
    </FilterSide>
  );
}
