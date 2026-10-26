// src/pages/Administrativo/Fabrica/FilterSideFabrica.tsx
// -----------------------------------------------------------------------------
// Drawer de FILTRO da listagem de Formulação (Food — Fábrica/Ração,
// TASK-FOOD-FE-05). Contrato B canônico de filtro (mirror
// `BaseRegistrations/Warehouses/FilterSideWarehouses.tsx`) — `<Form
// formFilter>` (`Form.BodyFilter`/`Form.FooterFilter`), NUNCA `<VStack
// as="form">` cru (regra estrutural obrigatória do protocolo).
//
// Contrato real da ficha (`## Componentes`): `SelectAsyncPaginate` (Produto,
// `listProductOptions` com `food_eligibility: 'food'` — mesma reconciliação
// da lacuna de elegibilidade já documentada em `FoodFeedstocksEditor.tsx`/
// `product-service.ts`, ver Histórico de `TASK-FOOD-FE-04`), `Select`
// (Status: Ativo/Inativo/Todos) e `Select` (Tipo: P/U/Todos — reusa
// `foodTypeOptions.options()`, `@/constants/foods/options/food-type-options`,
// mesma fábrica já usada pelo badge de Tipo da grid).
//
// O componente `@/components/Form/Select`/`SelectAsyncPaginate` trabalha com
// `Option` (label/value), não com a string crua que o backend espera — por
// isso o form RHF usa `Option | null` internamente e o `onSubmit` converte
// para o shape cru de `FoodFilterForm` antes de chamar `handleFilterChange`
// (mesmo padrão de `FilterSideWarehouses.tsx`).
// -----------------------------------------------------------------------------

import { useEffect } from 'react';

import { Text } from '@chakra-ui/react';
import { Controller, useForm } from 'react-hook-form';

import { Button } from '@/components/Button';
import { FilterSide } from '@/components/FilterSide';
import { Form } from '@/components/Form';
import { Select } from '@/components/Form/Select';
import { SelectAsyncPaginate } from '@/components/Form/SelectAsyncPaginate';

import { foodTypeOptions } from '@/constants/foods/options/food-type-options';

import { listProductOptions } from '@/services/v2/Products/product-service';
import type { ProductOptionItem } from '@/services/v2/Products/product-service';

import type { FilterModalProps } from '@/@types/filter-modal';
import type { Option } from '@/@types/option';
import type { FoodFilterForm, FoodType } from '@/@types/v2/Foods';

// Select de Ração — mirror EXATO de `listProductOptions` com
// `food_eligibility: 'food'` (TASK-FOOD-06, ✅ CONCLUÍDO — ver nota de topo
// de `product-service.ts`).
async function listFoodProductOptions(params: { search?: string; page?: number }) {
  return listProductOptions({ ...params, food_eligibility: 'food' });
}

function mapProductOption(item: ProductOptionItem) {
  return { label: `${item.code} — ${item.description}`, value: item.uuid };
}

const findParamsFromSearch = (search: string | { search: string }) => ({
  search: typeof search === 'string' ? search : search.search,
});

// Forma INTERNA do form (só deste componente) — os Selects trabalham com
// `Option`, o submit converte para `FoodFilterForm` (strings cruas).
interface FilterFormValues {
  product_uuid: Option<string> | null;
  is_enabled: Option<string> | null;
  type: Option<FoodType> | null;
}

export function FilterSideFabrica({
  isOpen,
  onClose,
  handleReset,
  handleFilterChange,
  filter,
  languageGB,
}: FilterModalProps<FoodFilterForm>) {
  const filterText = languageGB.foods.food.filter;

  const statusOptions: Option<string>[] = [
    { value: '1', label: filterText.statusOptions.active },
    { value: '0', label: filterText.statusOptions.inactive },
  ];

  const typeOptions = foodTypeOptions.options(languageGB);

  const pristineFormValues: FilterFormValues = {
    product_uuid: null,
    is_enabled: null,
    type: null,
  };

  // `product_uuid` não tem `*_label` companion (contrato B simples, sem
  // re-hidratação por texto) — ao reabrir o drawer com filtro já aplicado, o
  // Select de Produto reabre vazio (limitação aceita, mirror
  // `SaldoEstoque`/`EstoqueInicial` só quando o filtro persistido tem
  // `*_label`; Food-contrato.md não expõe esse companion). Status/Tipo
  // re-hidratam normalmente (valores fixos locais).
  function toInternalValues(rawFilter?: FoodFilterForm | null): FilterFormValues {
    return {
      product_uuid: null,
      is_enabled: statusOptions.find((option) => option.value === rawFilter?.is_enabled) ?? null,
      type: typeOptions.find((option) => option.value === rawFilter?.type) ?? null,
    };
  }

  const { control, handleSubmit, reset } = useForm<FilterFormValues>({
    mode: 'onChange',
    reValidateMode: 'onChange',
    defaultValues: {
      ...pristineFormValues,
      ...toInternalValues(filter),
    },
  });

  function onSubmit(data: FilterFormValues) {
    handleFilterChange({
      product_uuid: data.product_uuid?.value || undefined,
      is_enabled: (data.is_enabled?.value as FoodFilterForm['is_enabled']) || undefined,
      type: (data.type?.value as FoodFilterForm['type']) || undefined,
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

  // Ao (re)abrir o drawer, ressincroniza o form com o filtro aplicado.
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

          <Controller
            name="product_uuid"
            control={control}
            render={({ field: { name, value, onChange } }) => (
              <SelectAsyncPaginate
                name={name}
                label={filterText.product}
                placeholder={filterText.productPlaceholder}
                service={listFoodProductOptions}
                mapOptions={mapProductOption}
                findParams={findParamsFromSearch}
                value={value ?? undefined}
                onChange={(option: any) => onChange(option ?? null)}
              />
            )}
          />

          <Controller
            name="is_enabled"
            control={control}
            render={({ field: { name, value, onChange } }) => (
              <Select
                label={filterText.status}
                placeholder={filterText.statusAll}
                name={name}
                value={value}
                onChange={onChange}
                options={statusOptions}
              />
            )}
          />

          <Controller
            name="type"
            control={control}
            render={({ field: { name, value, onChange } }) => (
              <Select
                label={filterText.type}
                placeholder={filterText.typeAll}
                name={name}
                value={value}
                onChange={onChange}
                options={typeOptions}
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
